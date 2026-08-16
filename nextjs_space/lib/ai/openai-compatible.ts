/**
 * Shared transport for OpenAI-compatible streaming chat completions.
 *
 * Azure OpenAI (Microsoft Foundry) speaks the OpenAI-compatible
 * `/chat/completions` wire format, so the fetch, timeout, retry, cancellation
 * and correlation-ID handling live here once. Providers only supply the
 * endpoint URL, auth headers and concrete model name.
 *
 * The returned body is the untouched upstream SSE byte stream; callers decide
 * whether to pass it through (text chat) or parse it (structured analysis).
 */

import { AiChatRequest, AiError, AiMessage, AiStreamResponse } from './types';
import { extractContentFilterDetails } from './content-filter';
import {
  estimateTokens,
  logAiRequest,
  recordAiTelemetry,
  type AiTelemetryStatus,
} from './telemetry';

export interface OpenAiCompatibleConfig {
  /** Provider label, used for logging + telemetry. */
  providerName: string;
  /** Fully-qualified URL to POST the chat completion to. */
  endpoint: string;
  /** Auth (and any provider-specific) headers merged into the request. */
  headers: Record<string, string>;
  /** Concrete model / deployment name sent in the request body. */
  model: string;
  /** Logical route label for telemetry (e.g. `analyze-wound`). */
  route?: string;
  /** Extra top-level fields merged into the request body (e.g. stream_options). */
  extraBody?: Record<string, unknown>;
  /** When true, parse the stream for a `usage` object to record token counts. */
  collectUsage?: boolean;
}

const NOOP = () => {};

const DEFAULT_RETRY_BASE_DELAY_MS = 500;
/** Cap on any single backoff delay (including Retry-After). */
const MAX_RETRY_DELAY_MS = 20_000;
const MAX_RETRIES = 2;
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableAiStatus(status: number): boolean {
  return RETRYABLE_HTTP_STATUSES.has(status);
}

function randomCorrelationId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() ?? fallbackId();
  } catch {
    return fallbackId();
  }
}

function fallbackId(): string {
  return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isAbortError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError';
}

async function safeText(response: Response | undefined): Promise<string> {
  try {
    return (await response?.text?.()) ?? '';
  } catch {
    return '';
  }
}

function countImageParts(messages: AiMessage[]): number {
  let n = 0;
  for (const m of messages ?? []) {
    if (Array.isArray(m?.content)) {
      for (const part of m.content) {
        if (part?.type === 'image_url') n++;
      }
    }
  }
  return n;
}

/** Sleep for `ms`, rejecting early if `signal` aborts. */
function sleep(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Compute the backoff delay for a retry attempt, honouring Retry-After. */
function backoffDelay(attempt: number, baseDelayMs: number, retryAfterMs?: number): number {
  if (retryAfterMs && retryAfterMs > 0) {
    return Math.min(retryAfterMs, MAX_RETRY_DELAY_MS);
  }
  const exp = baseDelayMs * 2 ** attempt;
  const jitter = Math.floor(Math.random() * baseDelayMs);
  return Math.min(exp + jitter, MAX_RETRY_DELAY_MS);
}

/** Parse a `Retry-After` header (seconds or HTTP date) into milliseconds. */
function parseRetryAfter(response: Response | undefined): number | undefined {
  const raw = response?.headers?.get?.('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(raw);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return undefined;
}

/** Build an AbortSignal that fires on either a timeout or the caller's signal.
 *  Returns a no-op cleanup when neither is configured (preserving the original
 *  no-timeout behaviour with zero overhead). */
function buildSignal(
  timeoutMs: number | undefined,
  external: AbortSignal | undefined,
): { signal: AbortSignal | undefined; cleanup: () => void } {
  if (!timeoutMs && !external) {
    return { signal: undefined, cleanup: NOOP };
  }

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const onExternalAbort = () => controller.abort((external as { reason?: unknown })?.reason);

  if (external) {
    if (external.aborted) {
      controller.abort((external as { reason?: unknown }).reason);
    } else {
      external.addEventListener('abort', onExternalAbort, { once: true });
    }
  }
  if (timeoutMs) {
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }

  const cleanup = () => {
    if (timer) clearTimeout(timer);
    if (external) external.removeEventListener('abort', onExternalAbort);
  };

  return { signal: controller.signal, cleanup };
}

interface InstrumentOptions {
  cleanup: () => void;
  startedAt: number;
  attempts: number;
  collectUsage: boolean;
  telemetry: {
    correlationId: string;
    provider: string;
    model: string;
    route?: string;
  };
}

/**
 * Wrap the upstream stream to record latency + token telemetry when it ends,
 * errors or is cancelled. Forwarded bytes are identical to the upstream; the
 * side-channel decode is best-effort and never throws into the stream.
 */
function instrumentStream(
  body: ReadableStream<Uint8Array>,
  opts: InstrumentOptions,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let ttfbMs: number | undefined;
  let bytes = 0;
  let completionChars = 0;
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;
  let sideRemainder = '';
  let settled = false;

  const observe = (chunk: Uint8Array) => {
    if (!opts.collectUsage) return;
    try {
      sideRemainder += decoder.decode(chunk, { stream: true });
      const lines = sideRemainder.split('\n');
      sideRemainder = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string') completionChars += delta.length;
          const usage = parsed?.usage;
          if (usage) {
            if (typeof usage.prompt_tokens === 'number') promptTokens = usage.prompt_tokens;
            if (typeof usage.completion_tokens === 'number') {
              completionTokens = usage.completion_tokens;
            }
          }
        } catch {
          /* partial / non-JSON line — ignore */
        }
      }
    } catch {
      /* decode failure — telemetry only, ignore */
    }
  };

  const settle = (status: AiTelemetryStatus, reason?: string) => {
    if (settled) return;
    settled = true;
    const estimated = completionTokens === undefined && completionChars > 0;
    recordAiTelemetry({
      ...opts.telemetry,
      status,
      attempts: opts.attempts,
      ttfbMs,
      totalMs: Date.now() - opts.startedAt,
      promptTokens,
      completionTokens:
        completionTokens ?? (completionChars > 0 ? estimateTokens(completionChars) : undefined),
      completionTokensEstimated: estimated,
      bytes,
      reason,
    });
    opts.cleanup();
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          settle('success');
          controller.close();
          return;
        }
        if (ttfbMs === undefined) ttfbMs = Date.now() - opts.startedAt;
        bytes += value.byteLength;
        observe(value);
        controller.enqueue(value);
      } catch (err) {
        settle('error', (err as { message?: string })?.message ?? 'stream_error');
        controller.error(err);
      }
    },
    cancel(reason) {
      settle('cancelled', typeof reason === 'string' ? reason : undefined);
      return reader.cancel(reason);
    },
  });
}

/** Open an OpenAI-compatible streaming chat completion with timeout, retry
 *  (exponential backoff), cancellation, correlation and telemetry support. */
export async function streamOpenAiCompatible(
  request: AiChatRequest,
  config: OpenAiCompatibleConfig,
): Promise<AiStreamResponse> {
  const correlationId = request.correlationId ?? randomCorrelationId();
  const maxRetries = Math.min(MAX_RETRIES, Math.max(0, request.retries ?? 0));
  const baseDelayMs = request.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  const startedAt = Date.now();

  const telemetryBase = {
    correlationId,
    provider: config.providerName,
    model: config.model,
    route: config.route ?? request.route,
  };

  // Redacted request log — counts only, never message/image content.
  const imageCount = countImageParts(request.messages ?? []);
  logAiRequest({
    ...telemetryBase,
    messageCount: request.messages?.length ?? 0,
    imageCount,
    hasImage: imageCount > 0,
    responseFormat: request.responseFormat,
    maxOutputTokens: request.maxOutputTokens,
  });

  const payload = {
    model: config.model,
    messages: request.messages,
    stream: true as const,
    max_tokens: request.maxOutputTokens,
    ...(request.responseFormat === 'json_object'
      ? { response_format: { type: 'json_object' as const } }
      : {}),
    ...(config.extraBody ?? {}),
  };
  const bodyText = JSON.stringify(payload);

  const recordFailure = (status: AiTelemetryStatus, reason: string, attempts: number) =>
    recordAiTelemetry({
      ...telemetryBase,
      status,
      attempts,
      totalMs: Date.now() - startedAt,
      reason,
    });

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { signal, cleanup } = buildSignal(request.timeoutMs, request.signal);
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
          ...config.headers,
        },
        body: bodyText,
        signal,
      });

      if (!response?.ok) {
        const upstreamText = await safeText(response);
        let upstreamError: unknown;
        try {
          upstreamError = JSON.parse(upstreamText);
        } catch {
          upstreamError = undefined;
        }
        const contentFilter = extractContentFilterDetails(upstreamError, 'input');
        if (contentFilter) {
          cleanup();
          recordFailure('error', 'content_filter_input', attempt + 1);
          throw new AiError({
            code: 'bad_request',
            category: 'AI_CONTENT_FILTER',
            status: 422,
            clientMessage:
              'Azure AI could not process this clinical image under the configured content filter. ' +
              'The image was not analyzed. Contact the Azure administrator if legitimate clinical images are consistently blocked.',
            correlationId,
            contentFilter,
          });
        }
        const retryable = isRetryableAiStatus(response.status);
        const category = response.status === 429
          ? 'AI_RATE_LIMIT' as const
          : response.status === 408
            ? 'AI_TIMEOUT' as const
            : response.status === 401 || response.status === 403
              ? 'AI_AUTH_ERROR' as const
              : response.status >= 500
                ? 'AI_UPSTREAM_5XX' as const
                : 'UNKNOWN' as const;
        const clientMessage = category === 'AI_RATE_LIMIT'
          ? 'The AI service is busy. Please try again shortly.'
          : category === 'AI_TIMEOUT'
            ? 'The AI assessment timed out. Please try again.'
            : category === 'AI_AUTH_ERROR'
              ? 'The AI service is temporarily unavailable.'
              : category === 'AI_UPSTREAM_5XX'
                ? 'The AI service could not complete the assessment. Please try again.'
                : 'The AI request could not be processed.';
        if (retryable && attempt < maxRetries) {
          cleanup();
          lastError = new AiError({
            code: 'upstream_error',
            status: response.status,
            category,
            clientMessage,
            correlationId,
          });
          await sleep(
            backoffDelay(attempt, baseDelayMs, parseRetryAfter(response)),
            request.signal,
          );
          continue;
        }
        cleanup();
        recordFailure('error', `http_${response.status}`, attempt + 1);
        throw new AiError({
          code: 'upstream_error',
          category,
          status: category === 'AI_RATE_LIMIT' ? 429 : category === 'AI_TIMEOUT' ? 504 : 502,
          clientMessage,
          correlationId,
        });
      }

      const body = response.body;
      if (!body) {
        cleanup();
        recordFailure('error', 'no_body', attempt + 1);
        throw new AiError({
          code: 'upstream_error',
          category: 'AI_EMPTY_RESPONSE',
          status: 500,
          clientMessage: 'The AI service returned an empty response. Please try again.',
          correlationId,
        });
      }

      // The timeout (if any) must cover the whole stream, so cleanup + telemetry
      // are deferred to stream completion via instrumentStream.
      return {
        correlationId,
        body: instrumentStream(body, {
          cleanup,
          startedAt,
          attempts: attempt + 1,
          collectUsage: config.collectUsage === true,
          telemetry: telemetryBase,
        }),
      };
    } catch (err) {
      cleanup();

      if (err instanceof AiError) {
        recordFailure('error', err.code, attempt + 1);
        throw err;
      }

      if (isAbortError(err)) {
        const aborted = request.signal?.aborted === true;
        recordFailure(
          aborted ? 'cancelled' : 'error',
          aborted ? 'aborted' : 'timeout',
          attempt + 1,
        );
        throw new AiError({
          code: aborted ? 'aborted' : 'timeout',
          category: aborted ? 'UNKNOWN' : 'AI_TIMEOUT',
          status: aborted ? 499 : 504,
          clientMessage: aborted ? 'AI request was cancelled.' : 'AI request timed out.',
          correlationId,
          cause: err,
        });
      }

      // Network / transient error → retry (with backoff) if attempts remain.
      lastError = err;
      if (attempt < maxRetries) {
        try {
          await sleep(backoffDelay(attempt, baseDelayMs), request.signal);
        } catch {
          recordFailure('cancelled', 'aborted_during_backoff', attempt + 1);
          throw new AiError({
            code: 'aborted',
            status: 499,
            clientMessage: 'AI request was cancelled.',
            correlationId,
          });
        }
        continue;
      }
      recordFailure('error', 'network', attempt + 1);
      throw new AiError({
        code: 'internal',
        category: 'UNKNOWN',
        status: 500,
        clientMessage: 'The AI service could not be reached. Please try again.',
        correlationId,
        cause: err,
      });
    }
  }

  recordFailure('error', 'exhausted', maxRetries + 1);
  throw lastError instanceof AiError
    ? lastError
    : new AiError({ code: 'internal', category: 'UNKNOWN', status: 500, clientMessage: 'The AI service could not be reached. Please try again.', correlationId });
}
