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
}
