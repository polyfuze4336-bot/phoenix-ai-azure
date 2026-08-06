/**
 * Structured, privacy-safe telemetry for AI provider calls.
 *
 * Two responsibilities:
 *   1. Generate correlation IDs used to trace a request end-to-end.
 *   2. Emit structured log lines for request start and completion carrying
 *      latency and (best-effort) token metrics.
 *
 * IMPORTANT — never logs message content. The chat/vision messages contain
 * base64 image data and clinical text; only counts and derived metadata are
 * ever recorded. All lines are prefixed `[Phoenix AI][telemetry]` and emitted as
 * a single JSON object so they can be picked up by App Insights / log analytics.
 */

const PREFIX = '[Phoenix AI][telemetry]';

// Bridge to Application Insights (no-op when App Insights is not configured).
import {
  trackDependency,
  trackEvent,
  trackMetric,
  type TelemetryProperties,
} from '@/lib/telemetry/server';

/** Rough characters-per-token ratio for a best-effort completion-token estimate
 *  when the upstream stream does not carry a `usage` object. */
const CHARS_PER_TOKEN = 4;

/** Generate a correlation ID (UUID when available, otherwise a random fallback). */
export function newCorrelationId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() ?? fallbackId();
  } catch {
    return fallbackId();
  }
}

function fallbackId(): string {
  return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Approximate a token count from a character length (best effort only). */
export function estimateTokens(charCount: number): number {
  if (!charCount || charCount < 0) return 0;
  return Math.ceil(charCount / CHARS_PER_TOKEN);
}

export interface AiRequestLog {
  correlationId: string;
  provider: string;
  model: string;
  route?: string;
  /** Number of messages in the request (NOT their content). */
  messageCount: number;
  /** Whether any message carried an image part (NOT the image itself). */
  hasImage: boolean;
  /** Number of image parts across all messages. */
  imageCount: number;
  responseFormat?: string;
  maxOutputTokens?: number;
}

/** Log the start of an AI request with redacted metadata only. */
export function logAiRequest(info: AiRequestLog): void {
  emit({ event: 'ai_request', ...info });
}

export type AiTelemetryStatus = 'success' | 'error' | 'cancelled';

export interface AiTelemetryResult {
  correlationId: string;
  provider: string;
  model: string;
  route?: string;
  status: AiTelemetryStatus;
  /** Number of connection attempts made (1 = no retries). */
  attempts: number;
  /** Milliseconds until the first upstream byte was received. */
  ttfbMs?: number;
  /** Milliseconds until the upstream stream completed / errored. */
  totalMs?: number;
  /** Prompt tokens, when the upstream `usage` object provided them. */
  promptTokens?: number;
  /** Completion tokens from `usage`, or a char-based estimate otherwise. */
  completionTokens?: number;
  /** True when `completionTokens` is a heuristic estimate, not from `usage`. */
  completionTokensEstimated?: boolean;
  /** Total bytes forwarded from the upstream stream. */
  bytes?: number;
  /** Error code / short reason when status !== 'success'. */
  reason?: string;
}

/** Log the outcome of an AI request with latency + token metrics. */
export function recordAiTelemetry(result: AiTelemetryResult): void {
  emit({ event: 'ai_response', ...result });
}

function emit(payload: Record<string, unknown>): void {
  let line: string;
  try {
    line = JSON.stringify(payload);
  } catch {
    line = String(payload);
  }
  // Errors go to console.error so they surface in the app's error logs; the
  // successful request/response lines are informational.
  if (payload.status === 'error') {
    console.error(`${PREFIX} ${line}`);
  } else {
    console.log(`${PREFIX} ${line}`);
  }
  // Mirror the same redacted, counts-only payload into Application Insights. This
  // single bridge covers AI request duration, streaming completion and AI errors
  // for every route, so individual routes never re-instrument the AI call.
  forwardToAppInsights(payload);
}

/**
 * Forward an AI telemetry payload to Application Insights as an event + metrics
 * (and an exception on failure). The payload is already redacted — it contains
 * correlation IDs, counts, latencies, token totals and short error codes only,
 * never message/image content — so it is safe to forward verbatim.
 */
function forwardToAppInsights(payload: Record<string, unknown>): void {
  const event = payload.event;
  const properties: TelemetryProperties = {
    correlationId: asString(payload.correlationId),
    provider: asString(payload.provider),
    model: asString(payload.model),
    route: asString(payload.route),
  };

  if (event === 'ai_request') {
    trackEvent('ai_request', {
      ...properties,
      messageCount: asNumber(payload.messageCount),
      imageCount: asNumber(payload.imageCount),
      hasImage: payload.hasImage === true,
      responseFormat: asString(payload.responseFormat),
      maxOutputTokens: asNumber(payload.maxOutputTokens),
    });
    return;
  }

  if (event === 'ai_response') {
    const status = asString(payload.status) ?? 'unknown';
    const totalMs = asNumber(payload.totalMs);
    const ttfbMs = asNumber(payload.ttfbMs);
    const completionTokens = asNumber(payload.completionTokens);
    const promptTokens = asNumber(payload.promptTokens);
    const attempts = asNumber(payload.attempts);
    const reason = asString(payload.reason);

    trackDependency({
      dependencyTypeName: 'AI',
      name: `ai:${properties.route ?? properties.provider ?? 'chat'}`,
      data: `ai_response ${status}`,
      duration: totalMs ?? 0,
      success: status === 'success',
      resultCode: status,
      correlationId: asString(payload.correlationId),
      properties: { ...properties, status, attempts, reason },
    });

    if (typeof totalMs === 'number') trackMetric('ai_request_ms', totalMs, properties);
    if (typeof ttfbMs === 'number') trackMetric('ai_ttfb_ms', ttfbMs, properties);
    if (typeof completionTokens === 'number') {
      trackMetric('ai_completion_tokens', completionTokens, properties);
    }
    if (typeof promptTokens === 'number') {
      trackMetric('ai_prompt_tokens', promptTokens, properties);
    }

    // AI errors are surfaced as a distinct event for alerting (still no content).
    if (status === 'error') {
      trackEvent('ai_error', { ...properties, reason, attempts });
    }
    return;
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
