export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// The staged pipeline makes several sequential vision/text calls. Allow a
// generous ceiling, comfortably under the App Service front-end idle timeout (~230s).
export const maxDuration = 220;

import { NextRequest } from 'next/server';
import { AiMessage, AiError } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createResultSseResponse } from '@/lib/ai/streaming/sse';
import { parseHcpWoundAnalysis } from '@/lib/ai/validation/wound-analysis-schema';
import { validateImageInput, checkRequestBodySize } from '@/lib/ai/validation/image-input';
import { getOrCreateCorrelationId } from '@/lib/telemetry/correlation';
import { trackEvent } from '@/lib/telemetry/server';
import { hcpWoundAnalysisSystemPrompt } from '@/lib/ai/prompts/hcp-wound-analysis';
import { getAnalysisModelDeployment, getAnalysisPipelineMode } from '@/lib/ai/model-config';
import {
  computeParkland,
  getAnalysisTimeoutMs,
  runAnalysisPipeline,
  type PatientContext,
} from '@/lib/ai/analysis/pipeline';
import { toFlatHcpAnalysis } from '@/lib/ai/schemas/burn-wound-analysis';
import { buildAnalysisMetadata } from '@/lib/ai/analysis/metadata';
import { completeWithLanguageValidation, parseRequestedLanguage } from '@/lib/ai/language';
import {
  imageAnalysisFailure,
  imageSizeBucket,
  readAnalysisRetryCount,
  recordImageAnalysisEvent,
  type ImageAnalysisTelemetryContext,
} from '@/lib/telemetry/analysis-events';

/** Coerce an untrusted patient-context object into the typed shape (no invented values). */
function readPatientContext(raw: unknown): PatientContext | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const p = raw as Record<string, unknown>;
  const weight = typeof p.weightKg === 'number' ? p.weightKg : parseFloat(String(p.weightKg ?? ''));
  const ctx: PatientContext = {
    weightKg: Number.isFinite(weight) && weight > 0 ? weight : undefined,
    ageGroup: p.ageGroup === 'adult' || p.ageGroup === 'child' ? p.ageGroup : undefined,
    fitzpatrickType: typeof p.fitzpatrickType === 'string' ? p.fitzpatrickType : undefined,
    mechanism: typeof p.mechanism === 'string' ? p.mechanism : undefined,
    timeSinceInjury: typeof p.timeSinceInjury === 'string' ? p.timeSinceInjury : undefined,
    freeText: typeof p.freeText === 'string' ? p.freeText.slice(0, 2000) : undefined,
  };
  return Object.values(ctx).some((v) => v !== undefined) ? ctx : undefined;
}

export async function POST(request: NextRequest) {
  const requestStartedAt = Date.now();
  let analysisTelemetry: Omit<ImageAnalysisTelemetryContext, 'errorCategory' | 'httpStatus' | 'latencyMs'> | undefined;
  try {
    const bodySize = checkRequestBodySize(request.headers.get('content-length'));
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error, code: 'IMAGE_TOO_LARGE' }), { status: 413 });
    }

    const body = await request.json();
    const { image, mimeType } = body ?? {};
    const language = parseRequestedLanguage(body?.language);
    if (!language) {
      return new Response(JSON.stringify({ error: 'Invalid language. Use "en" or "ms".' }), { status: 400 });
    }

    const validation = validateImageInput({ image, mimeType });
    if (!validation.ok) {
      const error = language === 'ms'
        ? validation.code === 'IMAGE_TOO_LARGE'
          ? 'Imej terlalu besar. Sila pilih imej yang lebih kecil.'
          : 'Imej tidak dapat diproses. Sila cuba imej JPEG, PNG, WebP atau GIF yang lain.'
        : validation.error;
      return new Response(JSON.stringify({ error, code: validation.code }), {
        status: validation.code === 'IMAGE_TOO_LARGE' ? 413 : 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const correlationId = getOrCreateCorrelationId(request.headers);
    const patient = readPatientContext(body?.patient);
    const refineAnswers = typeof body?.refineAnswers === 'string' ? body.refineAnswers : undefined;
    const priorAnalysis = body?.priorAnalysis && typeof body.priorAnalysis === 'object' ? body.priorAnalysis : undefined;
    // Privacy-safe marker: an HCP image-analysis request started. No image bytes,
    // base64 or clinical text are recorded — only the correlation ID + flags.
    const pipelineMode = getAnalysisPipelineMode();
    const retryCount = readAnalysisRetryCount(request.headers.get('x-analysis-retry-count'));
    analysisTelemetry = {
      modelDeployment: getAnalysisModelDeployment() ?? 'default',
      retryCount,
      imageSizeBucket: imageSizeBucket(validation.bytes),
      imageMimeType: validation.mimeType,
      requestedLanguage: language,
    };
    const startedContext = {
      ...analysisTelemetry,
      httpStatus: 0,
      latencyMs: 0,
    };
    if (retryCount > 0) recordImageAnalysisEvent('image_analysis_retry', startedContext);
    recordImageAnalysisEvent('image_analysis_started', startedContext);
    trackEvent('hcp_analysis_requested', {
      correlationId,
      hasImage: true,
      pipeline: pipelineMode,
      refine: Boolean(refineAnswers),
    });

    const imageDataUrl = `data:${validation.mimeType};base64,${validation.base64}`;

    // --- Staged pipeline (default): multi-stage, evidence-gated, deterministic calc.
    if (pipelineMode === 'staged') {
      try {
        const rich = await runAnalysisPipeline({
          imageDataUrl,
          language,
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
        recordImageAnalysisEvent('image_analysis_completed', {
          ...analysisTelemetry,
          httpStatus: 200,
          latencyMs: Date.now() - requestStartedAt,
        });
        return createResultSseResponse({
          result: { ...flat, structured: rich, meta, language },
          processingEvent: { status: 'processing', message: 'Analyzing' },
          correlationId,
        });
      } catch (err) {
        // Transient failures fall back to single-pass for demo resilience.
        const isTransient = err instanceof AiError &&
          ['AI_TIMEOUT', 'AI_RATE_LIMIT', 'AI_UPSTREAM_5XX', 'AI_STREAM_INTERRUPTED'].includes(err.category);
        if (isTransient && !refineAnswers) {
          try {
            const fallbackMessages: AiMessage[] = [
              { role: 'system', content: hcpWoundAnalysisSystemPrompt(language) },
              { role: 'user', content: [
                { type: 'text', text: 'Please analyze this wound/burn image and provide a structured clinical assessment in JSON format.' },
                { type: 'image_url', image_url: { url: imageDataUrl } },
              ]},
            ];
            const fallback = await completeWithLanguageValidation({
              messages: fallbackMessages,
              language,
              route: 'analyze-wound',
              correlationId,
              complete: async (msgs) => (await getAiProvider().streamChatCompletion({
                messages: msgs,
                model: getAnalysisModelDeployment(),
                maxOutputTokens: 2000,
                responseFormat: 'json_object',
                correlationId,
                route: 'analyze-wound',
                timeoutMs: getAnalysisTimeoutMs(),
              })).body,
            });
            const parsed = parseHcpWoundAnalysis(fallback.text);
            const parkland = computeParkland(
              parsed.isBurn, Number.parseFloat(parsed.tbsaEstimate),
              patient?.ageGroup, patient?.weightKg, language,
            );
            recordImageAnalysisEvent('image_analysis_completed', {
              ...analysisTelemetry!,
              httpStatus: 200,
              latencyMs: Date.now() - requestStartedAt,
            });
            return createResultSseResponse({
              result: { ...parsed, parklandFluid: parkland.summary, language, pipelineUsed: 'single-fallback' },
              processingEvent: { status: 'processing', message: 'Analyzing' },
              correlationId,
            });
          } catch { /* fall through to original error */ }
        }
        const response = aiErrorResponse(err, 'LLM API error');
        const failure = imageAnalysisFailure(err);
        recordImageAnalysisEvent('image_analysis_failed', {
          ...analysisTelemetry,
          errorCategory: failure.category,
          contentFilterSource: failure.contentFilterSource,
          contentFilterCategory: failure.contentFilterCategory,
          contentFilterSeverity: failure.contentFilterSeverity,
          httpStatus: response.status,
          latencyMs: Date.now() - requestStartedAt,
        });
        return response;
      }
    }

    // --- Legacy single-pass path (AI_ANALYSIS_PIPELINE=single).
    const messages: AiMessage[] = [
      { role: 'system', content: hcpWoundAnalysisSystemPrompt(language) },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Please analyze this wound/burn image and provide a structured clinical assessment in JSON format.' },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ];

    let completion;
    try {
      completion = await completeWithLanguageValidation({
        messages,
        language,
        route: 'analyze-wound',
        correlationId,
        complete: async (completionMessages) => (await getAiProvider().streamChatCompletion({
          messages: completionMessages,
          model: getAnalysisModelDeployment(),
          maxOutputTokens: 2000,
          responseFormat: 'json_object',
          correlationId,
          route: 'analyze-wound',
          timeoutMs: getAnalysisTimeoutMs(),
        })).body,
      });
    } catch (err) {
      const response = aiErrorResponse(err, 'LLM API error');
      const failure = imageAnalysisFailure(err);
      recordImageAnalysisEvent('image_analysis_failed', {
        ...analysisTelemetry,
        errorCategory: failure.category,
        contentFilterSource: failure.contentFilterSource,
        contentFilterCategory: failure.contentFilterCategory,
        contentFilterSeverity: failure.contentFilterSeverity,
        httpStatus: response.status,
        latencyMs: Date.now() - requestStartedAt,
      });
      return response;
    }

    recordImageAnalysisEvent('image_analysis_completed', {
      ...analysisTelemetry,
      httpStatus: 200,
      latencyMs: Date.now() - requestStartedAt,
    });
    const parsed = parseHcpWoundAnalysis(completion.text);
    const parkland = computeParkland(
      parsed.isBurn,
      Number.parseFloat(parsed.tbsaEstimate),
      patient?.ageGroup,
      patient?.weightKg,
      language,
    );
    return createResultSseResponse({
      result: { ...parsed, parklandFluid: parkland.summary, language },
      processingEvent: { status: 'processing', message: 'Analyzing' },
      correlationId,
    });
  } catch (error: any) {
    console.error('Analyze wound error:', error);
    if (analysisTelemetry) {
      recordImageAnalysisEvent('image_analysis_failed', {
        ...analysisTelemetry,
        errorCategory: 'UNKNOWN',
        httpStatus: 500,
        latencyMs: Date.now() - requestStartedAt,
      });
    }
    return new Response(JSON.stringify({
      error: 'The AI assessment could not be completed. Please try again.',
      code: 'UNKNOWN',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
