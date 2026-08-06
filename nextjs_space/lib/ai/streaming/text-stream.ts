/**
 * Streaming text passthrough.
 *
 * Reproduces the original chat routes' behaviour: read the upstream
 * OpenAI-compatible SSE byte stream and forward it to the client untouched, as
 * `text/plain`. Because both providers emit the same wire format, the bytes the
 * browser receives are byte-identical to the source app — no client changes.
 */

/** Wrap an upstream model byte stream in a passthrough `text/plain` Response.
 *  An optional `correlationId` is echoed in the `x-correlation-id` header. */
export function createTextPassthroughResponse(
  upstream: ReadableStream<Uint8Array>,
  correlationId?: string,
): Response {
  const reader = upstream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(encoder.encode(decoder.decode(value)));
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
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...(correlationId ? { 'x-correlation-id': correlationId } : {}),
    },
  });
}
