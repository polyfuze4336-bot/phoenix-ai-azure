/**
 * Shared transport for OpenAI-compatible streaming chat completions.
 *
 * Both providers (Abacus.AI and Azure OpenAI / Foundry) speak the same
 * OpenAI-compatible `/chat/completions` wire format, so the fetch, timeout,
 * retry, cancellation and correlation-ID handling live here once. Providers only
 * supply the endpoint URL, auth headers and concrete model name.
 *
 * The returned body is the untouched upstream SSE byte stream; callers decide
 * whether to pass it through (text chat) or parse it (structured analysis).
 */

import { AiChatRequest, AiError, AiStreamResponse } from './types';

export interface OpenAiCompatibleConfig {
  /** Provider label, used only for logging. */
  providerName: string;
  /** Fully-qualified URL to POST the chat completion to. */
  endpoint: string;
  /** Auth (and any provider-specific) headers merged into the request. */
  headers: Record<string, string>;
  /** Concrete model / deployment name sent in the request body. */
  model: string;
}

const NOOP = () => {};

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

/** Wrap a stream so `cleanup` runs when it ends, errors or is cancelled. Returns
 *  the original stream untouched when there is nothing to clean up. */
function withCleanup(
  body: ReadableStream<Uint8Array>,
  cleanup: () => void,
): ReadableStream<Uint8Array> {
  if (cleanup === NOOP) return body;

  const reader = body.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          cleanup();
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch (err) {
        cleanup();
        controller.error(err);
      }
    },
    cancel(reason) {
      cleanup();
      return reader.cancel(reason);
    },
  });
}

/** Open an OpenAI-compatible streaming chat completion with timeout, retry,
 *  cancellation and correlation support. */
export async function streamOpenAiCompatible(
  request: AiChatRequest,
  config: OpenAiCompatibleConfig,
): Promise<AiStreamResponse> {
  const correlationId = request.correlationId ?? randomCorrelationId();
  const maxRetries = Math.max(0, request.retries ?? 0);

  const payload = {
    model: config.model,
    messages: request.messages,
    stream: true as const,
    max_tokens: request.maxOutputTokens,
    ...(request.responseFormat === 'json_object'
      ? { response_format: { type: 'json_object' as const } }
      : {}),
  };
  const bodyText = JSON.stringify(payload);

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
        // 5xx is transient and retryable; 4xx is not.
        if (response.status >= 500 && attempt < maxRetries) {
          cleanup();
          lastError = new AiError({
            code: 'upstream_error',
            status: response.status,
            clientMessage: upstreamText,
            upstreamText,
            correlationId,
          });
          continue;
        }
        cleanup();
        // Preserve the original routes' behaviour: any non-OK upstream → HTTP 500.
        throw new AiError({
          code: 'upstream_error',
          status: 500,
          clientMessage: upstreamText,
          upstreamText,
          correlationId,
        });
      }

      const body = response.body;
      if (!body) {
        cleanup();
        throw new AiError({
          code: 'upstream_error',
          status: 500,
          clientMessage: 'No response body from AI provider',
          correlationId,
        });
      }

      // The timeout (if any) must cover the whole stream, so cleanup is deferred
      // to stream completion via withCleanup rather than run here.
      return { correlationId, body: withCleanup(body, cleanup) };
    } catch (err) {
      cleanup();

      if (err instanceof AiError) {
        if (attempt < maxRetries && err.status >= 500) {
          lastError = err;
          continue;
        }
        throw err;
      }

      if (isAbortError(err)) {
        const aborted = request.signal?.aborted === true;
        throw new AiError({
          code: aborted ? 'aborted' : 'timeout',
          status: 499,
          clientMessage: aborted ? 'AI request was cancelled.' : 'AI request timed out.',
          correlationId,
          cause: err,
        });
      }

      // Network / transient error → retry if attempts remain.
      lastError = err;
      if (attempt < maxRetries) continue;
      throw new AiError({
        code: 'internal',
        status: 500,
        clientMessage: (err as { message?: string })?.message ?? 'AI request failed.',
        correlationId,
        cause: err,
      });
    }
  }

  throw lastError instanceof AiError
    ? lastError
    : new AiError({ code: 'internal', status: 500, clientMessage: 'AI request failed.', correlationId });
}
