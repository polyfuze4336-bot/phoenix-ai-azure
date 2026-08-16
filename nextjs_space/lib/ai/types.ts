/**
 * Phoenix AI — portable AI provider layer: core types.
 *
 * These interfaces describe a provider-neutral chat/vision contract so the API
 * routes stay backend-agnostic. The production backend is Azure OpenAI
 * (Microsoft Foundry), which is OpenAI-compatible, so the message shape
 * intentionally mirrors OpenAI's.
 *
 * Server-only: implementations read credentials from `process.env` and must
 * never be imported into client components (API keys must not reach the browser).
 */

export type AiProviderName = 'azure';

export type AiRole = 'system' | 'user' | 'assistant';

/** A plain text content part. */
export interface AiTextPart {
  type: 'text';
  text: string;
}

/** A multimodal image content part (data URL or remote URL). */
export interface AiImagePart {
  type: 'image_url';
  image_url: { url: string };
}

export type AiContentPart = AiTextPart | AiImagePart;

/** A single chat message. `content` is a string for text-only messages, or an
 *  array of parts for multimodal (text + image) messages. */
export interface AiMessage {
  role: AiRole;
  content: string | AiContentPart[];
}

/** `text` = free-form streaming text; `json_object` = streaming structured JSON. */
export type AiResponseFormat = 'text' | 'json_object';

/** A provider-neutral streaming chat completion request. */
export interface AiChatRequest {
  /** Ordered messages (system first). Supports text and multimodal image parts. */
  messages: AiMessage[];
  /** Logical model name; providers map this to a concrete model / deployment.
   *  Omit to use the provider's configured default. */
  model?: string;
  /** Maximum number of output tokens the model may generate. */
  maxOutputTokens?: number;
  /** Request structured JSON output vs free text. Defaults to text. */
  responseFormat?: AiResponseFormat;
  /** Correlation ID for tracing across the request; generated if omitted. */
  correlationId?: string;
  /** Logical route/operation label for telemetry (e.g. `analyze-wound`). */
  route?: string;
  /** Abort the request after this many milliseconds. Disabled when omitted. */
  timeoutMs?: number;
  /** Number of connection retries on transient (network / 5xx / 429) failure. Default 0. */
  retries?: number;
  /** Base delay (ms) for exponential backoff between retries. Default 500. */
  retryBaseDelayMs?: number;
  /** Caller cancellation signal, merged with any timeout. */
  signal?: AbortSignal;
}

/** The result of opening a streaming chat completion. */
export interface AiStreamResponse {
  /** Correlation ID echoed back for logging / client tracing. */
  correlationId: string;
  /** Raw OpenAI-compatible SSE byte stream from the upstream model. Consumers
   *  either pass this through (text chat) or parse it (structured analysis). */
  body: ReadableStream<Uint8Array>;
}

/** The provider contract. A single streaming method serves text chat and
 *  multimodal image analysis; `responseFormat` selects text vs structured. */
export interface AiProvider {
  readonly name: AiProviderName;
  streamChatCompletion(request: AiChatRequest): Promise<AiStreamResponse>;
}

export type AiErrorCode =
  | 'missing_credentials'
  | 'bad_request'
  | 'upstream_error'
  | 'timeout'
  | 'aborted'
  | 'internal';

export type AiErrorCategory =
  | 'AI_TIMEOUT'
  | 'AI_RATE_LIMIT'
  | 'AI_AUTH_ERROR'
  | 'AI_UPSTREAM_5XX'
  | 'AI_STREAM_INTERRUPTED'
  | 'AI_INVALID_JSON'
  | 'AI_SCHEMA_VALIDATION_FAILED'
  | 'AI_EMPTY_RESPONSE'
  | 'UNKNOWN';

export interface AiErrorOptions {
  code: AiErrorCode;
  category?: AiErrorCategory;
  /** HTTP status the API route should return. */
  status?: number;
  /** Safe, user-facing message placed in the JSON `{ error }` body. */
  clientMessage: string;
  /** Raw upstream error text (never contains our credentials). */
  upstreamText?: string;
  correlationId?: string;
  cause?: unknown;
}

/** Structured error carrying everything an API route needs to build a faithful
 *  JSON error response without leaking provider internals or credentials. */
export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly category: AiErrorCategory;
  readonly status: number;
  readonly clientMessage: string;
  readonly upstreamText?: string;
  readonly correlationId?: string;

  constructor(opts: AiErrorOptions) {
    super(opts.clientMessage);
    this.name = 'AiError';
    this.code = opts.code;
    this.category = opts.category ?? 'UNKNOWN';
    this.status = opts.status ?? 500;
    this.clientMessage = opts.clientMessage;
    this.upstreamText = opts.upstreamText;
    this.correlationId = opts.correlationId;
    if (opts.cause !== undefined) {
      (this as { cause?: unknown }).cause = opts.cause;
    }
  }
}
