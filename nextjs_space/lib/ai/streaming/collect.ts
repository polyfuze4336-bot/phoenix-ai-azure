/**
 * Collect a full (non-streamed) completion from the provider's OpenAI-compatible
 * SSE byte stream.
 *
 * The staged analysis pipeline makes several intermediate model calls whose
 * COMPLETE text is needed before the next stage can run, so unlike the chat
 * routes it cannot pass the stream through. This reuses the same line framing as
 * `createStructuredSseResponse` to accumulate `choices[0].delta.content`.
 */

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
    const normalized = line.endsWith('\r') ? line.slice(0, -1) : line;
    if (!normalized.startsWith('data: ')) return false;
    const data = normalized.slice(6);
    if (data === '[DONE]') return true;
    try {
      const parsed = JSON.parse(data);
      buffer += parsed?.choices?.[0]?.delta?.content ?? '';
      if (parsed?.usage) {
        usage = {
          prompt: parsed.usage.prompt_tokens,
          completion: parsed.usage.completion_tokens,
          total: parsed.usage.total_tokens,
        };
      }
    } catch {
      /* ignore non-JSON keep-alive lines */
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
        if (processLine(line)) return { text: buffer, usage };
      }
    }
    partial += decoder.decode();
    if (partial) processLine(partial);
  } finally {
    reader.releaseLock?.();
  }
  return { text: buffer, usage };
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
