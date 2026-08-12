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

const MAX_ANALYSIS_IMAGES = 6;

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
    const bodySize = checkRequestBodySize(request.headers.get('content-length'), MAX_ANALYSIS_IMAGES);
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error }), { status: 413 });
    }

    const body = await request.json();
    const rawImages = Array.isArray(body?.images)
      ? body.images
      : [{ image: body?.image, mimeType: body?.mimeType }];

    if (!rawImages.length) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
    }
    if (rawImages.length > MAX_ANALYSIS_IMAGES) {
      return new Response(
        JSON.stringify({ error: `Too many images. Maximum allowed is ${MAX_ANALYSIS_IMAGES}.` }),
        { status: 400 },
      );
    }

    const validatedImages: Array<{ base64: string; mimeType: string }> = [];
    for (const entry of rawImages) {
      const image = entry && typeof entry === 'object' ? (entry as Record<string, unknown>).image : undefined;
      const mimeType =
        entry && typeof entry === 'object' ? (entry as Record<string, unknown>).mimeType : undefined;
      const validation = validateImageInput({ image, mimeType });
      if (!validation.ok) {
        return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
      }
      const base64Raw = typeof image === 'string' ? image : '';
      const base64 = base64Raw.includes(',') ? base64Raw.slice(base64Raw.indexOf(',') + 1) : base64Raw;
      validatedImages.push({ base64, mimeType: validation.mimeType });
    }

    const correlationId = getOrCreateCorrelationId(request.headers);
    const patient = readPatientContext(body?.patient);
    const refineAnswers = typeof body?.refineAnswers === 'string' ? body.refineAnswers : undefined;
    const priorAnalysis = body?.priorAnalysis && typeof body.priorAnalysis === 'object' ? body.priorAnalysis : undefined;
    const imageDataUrls = validatedImages.map(
      ({ base64, mimeType }) => `data:${mimeType};base64,${base64}`,
    );
    // Privacy-safe marker: an HCP image-analysis request started. No image bytes,
    // base64 or clinical text are recorded — only the correlation ID + flags.
    const pipelineMode = getAnalysisPipelineMode();
    trackEvent('hcp_analysis_requested', {
      correlationId,
      hasImage: imageDataUrls.length > 0,
      imageCount: imageDataUrls.length,
      pipeline: pipelineMode,
      refine: Boolean(refineAnswers),
    });

    // --- Staged pipeline (default): multi-stage, evidence-gated, deterministic calc.
    if (pipelineMode === 'staged') {
      try {
        const rich = await runAnalysisPipeline({
          imageDataUrls,
          patient,
          correlationId,
          refine: refineAnswers && priorAnalysis ? { priorAnalysis, answers: refineAnswers } : undefined,
        });
        const flat = toFlatHcpAnalysis(rich);
        const meta = buildAnalysisMetadata({
          analysisId: correlationId,
          modelDeployment: getAnalysisModelDeployment(),
          pipelineMode: 'staged',
          imageQualityAdequate: rich.imageQuality?.adequate,
          imageQualityIssues: rich.imageQuality?.issues,
          overallConfidence: rich.overallConfidence,
          parklandIndicated: rich.parkland?.total24hMl != null,
        });
        return createResultSseResponse({
          result: { ...flat, structured: rich, meta },
          processingEvent: { status: 'processing', message: 'Analyzing' },
          correlationId,
        });
      } catch (err) {
        return aiErrorResponse(err, 'LLM API error');
      }
    }

    // --- Legacy single-pass path (AI_ANALYSIS_PIPELINE=single).
    const messages: AiMessage[] = [
      { role: 'system', content: HCP_WOUND_ANALYSIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              imageDataUrls.length > 1
                ? 'Please analyze these wound/burn images of the same patient and provide a structured clinical assessment in JSON format. Consolidate findings across views and do not double-count overlapping/duplicate views when estimating TBSA.'
                : 'Please analyze this wound/burn image and provide a structured clinical assessment in JSON format.',
          },
          ...imageDataUrls.map((url) => ({ type: 'image_url' as const, image_url: { url } })),
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
