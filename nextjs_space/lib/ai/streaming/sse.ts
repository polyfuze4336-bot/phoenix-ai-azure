/**
 * Structured SSE streaming for JSON analysis routes.
 *
 * Reproduces the original analysis routes' exact behaviour: read the upstream
 * OpenAI-compatible SSE stream line-by-line, accumulate the model's JSON text,
 * emit a `processing` event per chunk, and on `[DONE]` (or end of stream) emit a
 * single `completed` event carrying the parsed result. The byte-level SSE
 * framing (`data: ...\n\n`) is unchanged so the client sees identical output.
 *
 * The two completion paths are distinguished by `phase`:
 *   - `'done'` — the upstream `[DONE]` sentinel was reached
 *   - `'end'`  — the stream ended without a `[DONE]` sentinel
 * This preserves the source app's differing fallbacks for each path.
 */

export type StructuredResultPhase = 'done' | 'end';

export interface StructuredSseOptions {
  /** Upstream OpenAI-compatible SSE byte stream from the AI provider. */
  upstream: ReadableStream<Uint8Array>;
  /** Event object emitted (as `data: <json>`) for every processed chunk. */
  processingEvent: unknown;
  /** Build the final `result` payload from the accumulated model text. */
  buildResult: (buffer: string, phase: StructuredResultPhase) => unknown;
}

/** Build a `text/event-stream` Response that parses the upstream model output
 *  into a single structured `completed` event. */
export function createStructuredSseResponse(options: StructuredSseOptions): Response {
  const { upstream, processingEvent, buildResult } = options;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';
  let partialRead = '';

  const emitCompleted = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    phase: StructuredResultPhase,
  ) => {
    const result = buildResult(buffer, phase);
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ status: 'completed', result })}\n\n`),
    );
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          partialRead += decoder.decode(value, { stream: true });
          let lines = partialRead.split('\n');
          partialRead = lines?.pop() ?? '';
          for (const line of (lines ?? [])) {
            if (line?.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                emitCompleted(controller, 'done');
                return;
              }
              try {
                const parsed = JSON.parse(data);
                buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(processingEvent)}\n\n`));
              } catch (e: any) { /* skip */ }
            }
          }
        }
        // Reached end of stream without a [DONE] sentinel.
        if (buffer) {
          emitCompleted(controller, 'end');
        }
      } catch (error: any) {
        console.error('Stream error:', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
