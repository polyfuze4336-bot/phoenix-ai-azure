import test from 'node:test';
import assert from 'node:assert/strict';
import { readCompletedAnalysis, streamChatText } from '../../lib/ai/streaming/client-analysis';
import { collectCompletion } from '../../lib/ai/streaming/collect';

function streamResponse(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
    { status, headers: { 'content-type': 'text/event-stream' } },
  );
}

test('analysis client consumes a completed event in the final unterminated SSE frame', async () => {
  const response = streamResponse([
    'data: {"status":"processing"}\n\n',
    'data: {"status":"completed","result":{"woundType":"Scald"}}',
  ]);
  const result = await readCompletedAnalysis<{ woundType: string }>(response, 'en');
  assert.equal(result.woundType, 'Scald');
});

test('analysis client does not expose upstream details for server errors', async () => {
  const response = new Response(JSON.stringify({ error: 'sensitive upstream detail' }), {
    status: 500,
    headers: { 'content-type': 'application/json' },
  });
  await assert.rejects(
    () => readCompletedAnalysis(response, 'bm'),
    /Analisis tidak dapat diselesaikan sekarang/,
  );
});

test('chat client consumes content in the final unterminated SSE frame', async () => {
  const response = streamResponse([
    'data: {"choices":[{"delta":{"content":"Selamat"}}]}\n',
    'data: {"choices":[{"delta":{"content":" datang"}}]}',
  ]);
  let text = '';
  await streamChatText(response, 'bm', (next) => {
    text = next;
  });
  assert.equal(text, 'Selamat datang');
});

test('pipeline collector consumes model content in a trailing SSE frame', async () => {
  const response = streamResponse([
    'data: {"choices":[{"delta":{"content":"{\\"ok\\":"}}]}\n',
    'data: {"choices":[{"delta":{"content":"true}"}}]}',
  ]);
  const completion = await collectCompletion(response.body!);
  assert.equal(completion.text, '{"ok":true}');
});
