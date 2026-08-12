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
import { validateImageCollection, checkImageCollectionRequestBodySize } from '@/lib/ai/validation/image-input';
import { getOrCreateCorrelationId } from '@/lib/telemetry/correlation';
import { trackEvent } from '@/lib/telemetry/server';
import { HCP_WOUND_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts/hcp-wound-analysis';
import { getAnalysisModelDeployment, getAnalysisPipelineMode } from '@/lib/ai/model-config';
import { runAnalysisPipeline, type PatientContext } from '@/lib/ai/analysis/pipeline';
import { toFlatHcpAnalysis } from '@/lib/ai/schemas/burn-wound-analysis';
import { buildAnalysisMetadata } from '@/lib/ai/analysis/metadata';
import { classifyPhotographicTbsa } from '@/lib/clinical/tbsa';

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
    const bodySize = checkImageCollectionRequestBodySize(request.headers.get('content-length'));
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error }), { status: 413 });
    }

    const body = await request.json();
    const requestedImages = Array.isArray(body?.images)
      ? body.images
      : [{ image: body?.image, mimeType: body?.mimeType }];
    const validation = validateImageCollection(requestedImages);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
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
      imageCount: validation.images.length,
      pipeline: pipelineMode,
      refine: Boolean(refineAnswers),
    });

    const imageDataUrls = validation.images.map(
      ({ image, mimeType }) => `data:${mimeType};base64,${image}`,
    );

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
              `Please jointly analyze these ${imageDataUrls.length} wound/burn image(s) and provide one structured clinical assessment in JSON format. ` +
              'Treat probable duplicate/overlapping views as corroborative evidence, not additional TBSA. Aggregate only distinct anatomical regions.',
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
      buildResult: (buffer) => {
        const result = parseHcpWoundAnalysis(buffer);
        const tbsa = classifyPhotographicTbsa(
          result.isBurn ? Number.parseFloat(result.tbsaEstimate) : null,
        );
        return {
          ...result,
          tbsaEstimate: tbsa.estimate == null ? '0' : String(tbsa.estimate),
          tbsaClassification: tbsa.classification,
          imageCount: String(validation.images.length),
          multiImageAggregationNote:
            validation.images.length > 1
              ? 'Probable duplicate views are corroborative and are not added twice; clinician confirmation is required.'
              : 'Single-image assessment.',
        };
      },
      correlationId: upstream.correlationId,
    });
  } catch (error: any) {
    console.error('Analyze wound error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
