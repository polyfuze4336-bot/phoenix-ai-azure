import { AiError } from '@/lib/ai/types';
import { trackEvent, type TelemetryProperties } from '@/lib/telemetry/server';

export type ImageAnalysisEventName =
  | 'image_analysis_started'
  | 'image_analysis_completed'
  | 'image_analysis_retry'
  | 'image_analysis_failed';

export interface ImageAnalysisTelemetryContext {
  errorCategory?: string;
  httpStatus: number;
  modelDeployment: string;
  retryCount: number;
  latencyMs: number;
  imageSizeBucket: string;
  imageMimeType: string;
  requestedLanguage: 'en' | 'ms';
  contentFilterSource?: string;
  contentFilterCategory?: string;
  contentFilterSeverity?: string;
}

export function imageSizeBucket(bytes: number): string {
  if (bytes < 256 * 1024) return 'under_256_kb';
  if (bytes < 1024 * 1024) return '256_kb_to_1_mb';
  if (bytes < 5 * 1024 * 1024) return '1_mb_to_5_mb';
  if (bytes <= 10 * 1024 * 1024) return '5_mb_to_10_mb';
  return 'over_10_mb';
}

export function readAnalysisRetryCount(value: string | null): number {
  const parsed = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(parsed) ? Math.min(10, Math.max(0, parsed)) : 0;
}

export function imageAnalysisFailure(error: unknown): {
  category: string;
  status: number;
  contentFilterSource?: string;
  contentFilterCategory?: string;
  contentFilterSeverity?: string;
} {
  if (error instanceof AiError) {
    const filtered = error.contentFilter?.categories.find((item) => item.filtered) ??
      error.contentFilter?.categories[0];
    return {
      category: error.category,
      status: error.status,
      contentFilterSource: error.contentFilter?.source,
      contentFilterCategory: filtered?.category,
      contentFilterSeverity: filtered?.severity,
    };
  }
  return { category: 'UNKNOWN', status: 500 };
}

export function recordImageAnalysisEvent(
  name: ImageAnalysisEventName,
  context: ImageAnalysisTelemetryContext,
): void {
  const properties: TelemetryProperties = {
    errorCategory: context.errorCategory,
    httpStatus: context.httpStatus,
    modelDeployment: context.modelDeployment,
    retryCount: context.retryCount,
    latencyMs: context.latencyMs,
    imageSizeBucket: context.imageSizeBucket,
    imageMimeType: context.imageMimeType,
    requestedLanguage: context.requestedLanguage,
    contentFilterSource: context.contentFilterSource,
    contentFilterCategory: context.contentFilterCategory,
    contentFilterSeverity: context.contentFilterSeverity,
  };
  trackEvent(name, properties, { latencyMs: context.latencyMs });
}