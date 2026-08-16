import test from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableAiStatus, streamOpenAiCompatible } from '../../lib/ai/openai-compatible';
import { aiErrorResponse } from '../../lib/ai/ai-provider';
import { AiError } from '../../lib/ai/types';

test('retry allowlist contains only the configured transient HTTP statuses', () => {
  for (const status of [408, 429, 500, 502, 503, 504]) {
    assert.equal(isRetryableAiStatus(status), true, `${status} should retry`);
  }
  for (const status of [400, 401, 403, 404, 409, 422, 501, 505]) {
    assert.equal(isRetryableAiStatus(status), false, `${status} should not retry`);
  }
});

test('AI error responses expose a stable category without upstream details', async () => {
  const response = aiErrorResponse(new AiError({
    code: 'upstream_error',
    category: 'AI_UPSTREAM_5XX',
    status: 502,
    clientMessage: 'The AI service could not complete the assessment. Please try again.',
    upstreamText: 'secret provider diagnostic',
  }));
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.deepEqual(body, {
    error: 'The AI service could not complete the assessment. Please try again.',
    code: 'AI_UPSTREAM_5XX',
  });
  assert.doesNotMatch(JSON.stringify(body), /secret provider diagnostic/);
});

const request = {
  messages: [{ role: 'user' as const, content: 'test' }],
  retries: 20,
  retryBaseDelayMs: 0,
};
const config = {
  providerName: 'test',
  endpoint: 'https://example.invalid/chat',
  headers: {},
  model: 'test-model',
};

test('transport retries 408 but caps the request at three total attempts', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response('retry', { status: 408 });
  };
  try {
    await assert.rejects(streamOpenAiCompatible(request, config),
      (error: unknown) => error instanceof AiError && error.category === 'AI_TIMEOUT');
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('transport does not retry a non-allowlisted 501 response', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response('do not expose this', { status: 501 });
  };
  try {
    await assert.rejects(streamOpenAiCompatible(request, config),
      (error: unknown) => error instanceof AiError && error.category === 'AI_UPSTREAM_5XX');
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('transport safely classifies an Azure input content-filter rejection', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({
      error: {
        code: 'content_filter',
        innererror: {
          code: 'ResponsibleAIPolicyViolation',
          content_filter_result: {
            sexual: { filtered: true, severity: 'medium' },
            violence: { filtered: false, severity: 'low' },
          },
        },
      },
    }, { status: 400 });
  };
  try {
    await assert.rejects(streamOpenAiCompatible(request, config),
      (error: unknown) => error instanceof AiError &&
        error.category === 'AI_CONTENT_FILTER' &&
        error.contentFilter?.source === 'input' &&
        error.contentFilter.categories.some((item) =>
          item.category === 'sexual' && item.filtered && item.severity === 'medium'));
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('AI content-filter responses expose only allowlisted structured details', async () => {
  const response = aiErrorResponse(new AiError({
    code: 'bad_request',
    category: 'AI_CONTENT_FILTER',
    status: 422,
    clientMessage: 'Clinical image blocked by Azure policy.',
    upstreamText: 'must never be returned',
    contentFilter: {
      source: 'input',
      categories: [{ category: 'violence', filtered: true, severity: 'medium' }],
    },
  }));
  const body = await response.json();
  assert.deepEqual(body, {
    error: 'Clinical image blocked by Azure policy.',
    code: 'AI_CONTENT_FILTER',
    contentFilter: {
      source: 'input',
      categories: [{ category: 'violence', filtered: true, severity: 'medium' }],
    },
  });
  assert.doesNotMatch(JSON.stringify(body), /must never/);
});