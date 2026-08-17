/**
 * Collect a full (non-streamed) completion from the provider's OpenAI-compatible
 * SSE byte stream.
 *
 * The staged analysis pipeline makes several intermediate model calls whose
 * COMPLETE text is needed before the next stage can run, so unlike the chat
 * routes it cannot pass the stream through. This reuses the same line framing as
 * `createStructuredSseResponse` to accumulate `choices[0].delta.content`.
 */

import { AiError } from '../types';
import { extractContentFilterDetails } from '../content-filter';

export interface CollectedCompletion {
  /** Full accumulated assistant text. */
  text: string;
  /** Token usage if the upstream included it (best-effort). */
  usage?: { prompt?: number; completion?: number; total?: number };
}

export async function collectCompletion(
  upstream: ReadableStream<Uint8Array>,
): Promise<CollectedCompletion> {
  const reader = upstream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let partial = '';
  let usage: CollectedCompletion['usage'];

  const processLine = (line: string): boolean => {
    if (!line.startsWith('data: ')) return false;
    const data = line.slice(6).trim();
    if (data === '[DONE]') return true;
    let parsed: any;
    try {
      parsed = JSON.parse(data);
    } catch {
      /* ignore non-JSON keep-alive lines */
      return false;
    }
    const choice = parsed?.choices?.[0];
    if (choice?.finish_reason === 'content_filter') {
      throw new AiError({
        code: 'upstream_error',
        category: 'AI_CONTENT_FILTER',
        status: 422,
        clientMessage:
          'Azure AI stopped the assessment under the configured content filter. ' +
          'The clinical result is unavailable. Contact the Azure administrator if legitimate clinical images are consistently blocked.',
        contentFilter: extractContentFilterDetails(choice, 'output') ?? { source: 'output', categories: [] },
      });
    }
    buffer += choice?.delta?.content ?? '';
    if (parsed?.usage) {
      usage = {
        prompt: parsed.usage.prompt_tokens,
        completion: parsed.usage.completion_tokens,
        total: parsed.usage.total_tokens,
      };
    }
    return false;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      partial += decoder.decode(value, { stream: true });
      const lines = partial.split('\n');
      partial = lines.pop() ?? '';
      for (const line of lines) {
        if (processLine(line)) {
          if (!buffer.trim()) {
            throw new AiError({
              code: 'upstream_error',
              category: 'AI_EMPTY_RESPONSE',
              status: 502,
              clientMessage: 'The AI service returned an empty response. Please try again.',
            });
          }
          return { text: buffer, usage };
        }
      }
    }
    partial += decoder.decode();
    for (const line of partial.split('\n')) {
      if (processLine(line)) return { text: buffer, usage };
    }
    throw new AiError({
      code: 'upstream_error',
      category: buffer.trim() ? 'AI_STREAM_INTERRUPTED' : 'AI_EMPTY_RESPONSE',
      status: 502,
      clientMessage: buffer.trim()
        ? 'The AI response was interrupted. Please try again.'
        : 'The AI service returned an empty response. Please try again.',
    });
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError({
      code: 'upstream_error',
      category: 'AI_STREAM_INTERRUPTED',
      status: 502,
      clientMessage: 'The AI response was interrupted. Please try again.',
      cause: error,
    });
  } finally {
    reader.releaseLock?.();
  }
}

/** Best-effort parse of a model JSON object, tolerating code fences / prose. */
export function parseJsonObject(text: string): Record<string, unknown> | null {
  if (!text || !text.trim()) return null;
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  const tryParse = (s: string): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(s);
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  const direct = tryParse(cleaned);
  if (direct) return direct;
  // Fall back to the first {...} block.
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) return tryParse(cleaned.slice(start, end + 1));
  return null;
}
