import test from 'node:test';
import assert from 'node:assert/strict';
import { collectCompletion, parseJsonObject } from '../../lib/ai/streaming/collect';
import { AiError } from '../../lib/ai/types';

function stream(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

test('collectCompletion accepts a completed SSE response', async () => {
  const result = await collectCompletion(stream(
    'data: {"choices":[{"delta":{"content":"{\\"ok\\":true}"}}]}\n\ndata: [DONE]\n',
  ));
  assert.equal(result.text, '{"ok":true}');
});

test('collectCompletion classifies empty and interrupted responses', async () => {
  await assert.rejects(
    collectCompletion(stream('data: [DONE]\n')),
    (error: unknown) => error instanceof AiError && error.category === 'AI_EMPTY_RESPONSE',
  );
  await assert.rejects(
    collectCompletion(stream('data: {"choices":[{"delta":{"content":"partial"}}]}\n')),
    (error: unknown) => error instanceof AiError && error.category === 'AI_STREAM_INTERRUPTED',
  );
});

test('collectCompletion classifies an Azure output content-filter stop', async () => {
  await assert.rejects(
    collectCompletion(stream(
      'data: {"choices":[{"delta":{},"finish_reason":"content_filter","content_filter_results":{"violence":{"filtered":true,"severity":"medium"}}}]}\n\ndata: [DONE]\n',
    )),
    (error: unknown) => error instanceof AiError &&
      error.category === 'AI_CONTENT_FILTER' &&
      error.contentFilter?.source === 'output' &&
      error.contentFilter.categories[0]?.category === 'violence',
  );
});

test('parseJsonObject tolerates markdown fences and leading commentary', () => {
  assert.deepEqual(parseJsonObject('Result follows:\n```json\n{"ok":true}\n```'), { ok: true });
});