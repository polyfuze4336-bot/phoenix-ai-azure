export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// The staged pipeline makes several sequential vision/text calls. Allow a
// generous ceiling, comfortably under the App Service front-end idle timeout (~230s).
export const maxDuration = 220;

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createStructuredSseResponse, createResultSseResponse } from '@/lib/ai/streaming/sse';
import { parseHcpWoundAnalysis } from '@/lib/ai/validation/wound-analysis-schema';
import { validateImageInput, checkRequestBodySize } from '@/lib/ai/validation/image-input';
import { getOrCreateCorrelationId } from '@/lib/telemetry/correlation';
import { trackEvent } from '@/lib/telemetry/server';
import { HCP_WOUND_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts/hcp-wound-analysis';
import { getAnalysisModelDeployment, getAnalysisPipelineMode } from '@/lib/ai/model-config';
import { runAnalysisPipeline, type PatientContext } from '@/lib/ai/analysis/pipeline';
import { toFlatHcpAnalysis } from '@/lib/ai/schemas/burn-wound-analysis';
import { buildAnalysisMetadata } from '@/lib/ai/analysis/metadata';

/** Coerce an untrusted patient-context object into the typed shape (no invented values). */
function readPatientContext(raw: unknown): PatientContext | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const p = raw as Record<string, unknown>;
  const weight = typeof p.weightKg === 'number' ? p.weightKg : parseFloat(String(p.weightKg ?? ''));
  const ctx: PatientContext = {
    weightKg: Number.isFinite(weight) && weight > 0 ? weight : undefined,
    ageGroup: typeof p.ageGroup === 'string' ? p.ageGroup : undefined,
    fitzpatrickType: typeof p.fitzpatrickType === 'string' ? p.fitzpatrickType : undefined,
    mechanism: typeof p.mechanism === 'string' ? p.mechanism : undefined,
    timeSinceInjury: typeof p.timeSinceInjury === 'string' ? p.timeSinceInjury : undefined,
    freeText: typeof p.freeText === 'string' ? p.freeText.slice(0, 2000) : undefined,
  };
  return Object.values(ctx).some((v) => v !== undefined) ? ctx : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const bodySize = checkRequestBodySize(request.headers.get('content-length'));
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error }), { status: 413 });
    }

    const body = await request.json();

    // --- Support both legacy single-image (image + mimeType) and multi-image (images array).
    let imagesToAnalyze: Array<{ data: string; mimeType: string }> = [];

    // Check for new multi-image format: { images: [{ data: base64, mimeType }, ...] }
    if (Array.isArray(body?.images) && body.images.length > 0) {
      imagesToAnalyze = body.images.map((img: any) => ({
        data: typeof img?.data === 'string' ? img.data : '',
        mimeType: typeof img?.mimeType === 'string' ? img.mimeType : 'image/jpeg',
      }));
    } else if (body?.image) {
      // Fallback to legacy single-image format: { image: base64, mimeType }
      imagesToAnalyze = [{ data: body.image, mimeType: body.mimeType }];
    }

    if (imagesToAnalyze.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided. Send either { image, mimeType } or { images: [{data, mimeType}, ...] }' }), { status: 400 });
    }

    // Validate each image
    for (const img of imagesToAnalyze) {
      const validation = validateImageInput({ image: img.data, mimeType: img.mimeType });
      if (!validation.ok) {
        return new Response(JSON.stringify({ error: `Image validation failed: ${validation.error}` }), { status: 400 });
      }
    }

    const correlationId = getOrCreateCorrelationId(request.headers);
    const patient = readPatientContext(body?.patient);
    const refineAnswers = typeof body?.refineAnswers === 'string' ? body.refineAnswers : undefined;
    const priorAnalysis = body?.priorAnalysis && typeof body.priorAnalysis === 'object' ? body.priorAnalysis : undefined;
    // Privacy-safe marker: an HCP image-analysis request started. No image bytes,
    // base64 or clinical text are recorded — only the correlation ID + flags.
    const pipelineMode = getAnalysisPipelineMode();
    trackEvent('hcp_analysis_requested', {
      correlationId,
      hasImage: true,
      imageCount: imagesToAnalyze.length,
      pipeline: pipelineMode,
      refine: Boolean(refineAnswers),
    });

    // --- Staged pipeline (default): multi-stage, evidence-gated, deterministic calc.
    if (pipelineMode === 'staged') {
      try {
        // Process each image through the pipeline
        const perImageResults = await Promise.all(
          imagesToAnalyze.map(async (img, idx) => {
            const imageDataUrl = `data:${img.mimeType};base64,${img.data}`;
            // Only use refine logic for the first image in multi-image scenario
            const refineOpts = idx === 0 && refineAnswers && priorAnalysis 
              ? { priorAnalysis, answers: refineAnswers }
              : undefined;
            return runAnalysisPipeline({
              imageDataUrl,
              patient,
              correlationId: `${correlationId}-img${idx + 1}`,
              refine: refineOpts,
            });
          })
        );

        // --- Aggregate TBSA from all images
        const aggregateTbsa = (): { estimate: number | null; classificationLabel: string; imageCount: number } => {
          const estimates = perImageResults
            .map(r => r.interpretation.tbsaEstimate)
            .filter((e): e is number => e != null && e > 0);
          
          if (estimates.length === 0) {
            return { estimate: null, classificationLabel: 'N/A', imageCount: perImageResults.length };
          }

          // Sum non-overlapping areas (conservative: take sum, cap at 100%)
          const total = Math.min(100, Math.round(estimates.reduce((a, b) => a + b, 0) * 10) / 10);
          const isMajor = total >= 15;
          const classificationLabel = isMajor ? `Major (${total}% TBSA)` : `Minor (${total}% TBSA)`;
          
          return { estimate: total, classificationLabel, imageCount: perImageResults.length };
        };

        const aggregated = aggregateTbsa();
        
        // Use the first image's analysis as the primary result, with aggregated TBSA
        const primaryAnalysis = perImageResults[0];
        primaryAnalysis.interpretation.tbsaEstimate = aggregated.estimate;
        if (aggregated.estimate != null && aggregated.estimate > 0) {
          primaryAnalysis.interpretation.tbsaClassification = {
            isMajor: aggregated.estimate >= 15,
            isMinor: aggregated.estimate < 15,
            rationale: aggregated.classificationLabel,
          };
        }

        // Note multi-image analysis in limitations
        if (imagesToAnalyze.length > 1) {
          if (!primaryAnalysis.limitations) primaryAnalysis.limitations = [];
          primaryAnalysis.limitations.push(
            `Multi-image analysis: TBSA aggregated from ${imagesToAnalyze.length} images (sum of estimated areas). ` +
            `Assumes each image captures non-overlapping regions at consistent scale and lighting.`
          );
        }

        const flat = toFlatHcpAnalysis(primaryAnalysis);
        const meta = buildAnalysisMetadata({
          analysisId: correlationId,
          modelDeployment: getAnalysisModelDeployment(),
          pipelineMode: 'staged',
          imageQualityAdequate: primaryAnalysis.imageQuality?.adequate,
          imageQualityIssues: primaryAnalysis.imageQuality?.issues,
          overallConfidence: primaryAnalysis.overallConfidence,
          parklandIndicated: primaryAnalysis.parkland?.total24hMl != null,
        });
        return createResultSseResponse({
          result: { 
            ...flat, 
            structured: primaryAnalysis, 
            meta,
            multiImageAnalysis: {
              imageCount: imagesToAnalyze.length,
              aggregatedTbsa: aggregated.estimate,
              perImageResults: perImageResults.length > 1 
                ? perImageResults.map((r, i) => ({
                    imageIndex: i + 1,
                    tbsaEstimate: r.interpretation.tbsaEstimate,
                    imageQuality: r.imageQuality?.adequate ? 'adequate' : 'inadequate',
                  }))
                : undefined,
            },
          },
          processingEvent: { status: 'processing', message: `Analyzing ${imagesToAnalyze.length} image${imagesToAnalyze.length > 1 ? 's' : ''}` },
          correlationId,
        });
      } catch (err) {
        return aiErrorResponse(err, 'LLM API error');
      }
    }

    // --- Legacy single-pass path (AI_ANALYSIS_PIPELINE=single) - only supports single image
    if (imagesToAnalyze.length > 1) {
      return new Response(
        JSON.stringify({ error: 'Multi-image analysis requires AI_ANALYSIS_PIPELINE=staged. Please set that environment variable or send a single image.' }),
        { status: 400 }
      );
    }

    const imageDataUrl = `data:${imagesToAnalyze[0].mimeType};base64,${imagesToAnalyze[0].data}`;
    const messages: AiMessage[] = [
      { role: 'system', content: HCP_WOUND_ANALYSIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Please analyze this wound/burn image and provide a structured clinical assessment in JSON format.' },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ];

    let upstream;
    try {
      upstream = await getAiProvider().streamChatCompletion({
        messages,
        model: getAnalysisModelDeployment(),
        maxOutputTokens: 2000,
        responseFormat: 'json_object',
        correlationId,
        route: 'analyze-wound',
        timeoutMs: 110_000,
      });
    } catch (err) {
      return aiErrorResponse(err, 'LLM API error');
    }

    return createStructuredSseResponse({
      upstream: upstream.body,
      processingEvent: { status: 'processing', message: 'Analyzing' },
      buildResult: (buffer) => parseHcpWoundAnalysis(buffer),
      correlationId: upstream.correlationId,
    });
  } catch (error: any) {
    console.error('Analyze wound error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
