import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * HTTP API integration tests for Phoenix AI.
 *
 * Health endpoints + the four AI routes, exercised over real HTTP against the
 * production build. Validation paths (400/413) need no model. Well-formed AI
 * requests are asserted to reach a DETERMINISTIC terminal response — never skipped,
 * never hanging.
 */

/** A tiny but valid 1x1 PNG (base64, no data-URL prefix). */
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/** A payload comfortably above the 1 MB test image ceiling (~2 MB of base64). */
const OVERSIZED_B64 = 'A'.repeat(2_000_000);

/** Assert a route reached a terminal HTTP response (2xx stream OR explicit error). */
function expectTerminalResponse(status: number): void {
  expect(typeof status).toBe('number');
  // Either the stream started (2xx) or the app returned an explicit, deterministic
  // error status. A well-formed request must never hang or return an ambiguous 0.
  expect(status === 200 || status >= 400).toBeTruthy();
}

async function postJson(request: APIRequestContext, path: string, data: unknown) {
  return request.post(path, {
    data,
    headers: { 'content-type': 'application/json' },
  });
}

// --- Health endpoints --------------------------------------------------------

test('GET /api/health returns 200 with status ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ok');
});

test('GET /api/health/live returns 200', async ({ request }) => {
  const res = await request.get('/api/health/live');
  expect(res.status()).toBe(200);
});

test('GET /api/health/db returns a JSON status (200 or 503)', async ({ request }) => {
  const res = await request.get('/api/health/db');
  expect([200, 503]).toContain(res.status());
  const body = await res.json();
  expect(body).toHaveProperty('status');
});

test('GET /api/health/ready reports the essential checks', async ({ request }) => {
  const res = await request.get('/api/health/ready');
  expect([200, 503]).toContain(res.status());
  const body = await res.json();
  const names = (body.checks ?? []).map((c: { name: string }) => c.name);
  for (const essential of ['runtime', 'azure-ai', 'postgresql', 'blob-storage']) {
    expect(names).toContain(essential);
  }
});

// --- /api/analyze-wound ------------------------------------------------------

test('POST /api/analyze-wound rejects a missing image with 400', async ({ request }) => {
  const res = await postJson(request, '/api/analyze-wound', { language: 'en' });
  expect(res.status()).toBe(400);
});

test('POST /api/analyze-wound rejects unsupported HEIC before model invocation', async ({ request }) => {
  const res = await postJson(request, '/api/analyze-wound', { image: TINY_PNG_B64, mimeType: 'image/heic', language: 'en' });
  expect(res.status()).toBe(400);
  await expect(res.json()).resolves.toMatchObject({ error: expect.stringMatching(/JPEG, PNG, WebP, or GIF/) });
});

test('POST /api/analyze-wound rejects MIME/content mismatch before model invocation', async ({ request }) => {
  const res = await postJson(request, '/api/analyze-wound', { image: TINY_PNG_B64, mimeType: 'image/jpeg', language: 'en' });
  expect(res.status()).toBe(400);
  await expect(res.json()).resolves.toMatchObject({ error: expect.stringMatching(/does not match/) });
});

test('POST /api/analyze-wound rejects an oversized body with 413', async ({ request }) => {
  const res = await postJson(request, '/api/analyze-wound', { image: OVERSIZED_B64, mimeType: 'image/png', language: 'en' });
  expect(res.status()).toBe(413);
});

test('POST /api/analyze-wound reaches a terminal response for a valid image', async ({ request }) => {
  const res = await postJson(request, '/api/analyze-wound', { image: TINY_PNG_B64, mimeType: 'image/png', language: 'en' });
  expectTerminalResponse(res.status());
});

test('POST /api/analyze-wound/translate requires a structured result', async ({ request }) => {
  const res = await postJson(request, '/api/analyze-wound/translate', { language: 'ms' });
  expect(res.status()).toBe(400);
});

test('POST /api/analyze-wound/translate rejects a non-canonical language', async ({ request }) => {
  const res = await postJson(request, '/api/analyze-wound/translate', {
    language: 'bm',
    result: { characteristics: 'No change' },
  });
  expect(res.status()).toBe(400);
});

// --- /api/community-analyze --------------------------------------------------

test('POST /api/community-analyze rejects a missing image with 400', async ({ request }) => {
  const res = await postJson(request, '/api/community-analyze', { language: 'en' });
  expect(res.status()).toBe(400);
});

test('POST /api/community-analyze rejects an oversized body with 413', async ({ request }) => {
  const res = await postJson(request, '/api/community-analyze', { image: OVERSIZED_B64, mimeType: 'image/png', language: 'en' });
  expect(res.status()).toBe(413);
});

test('POST /api/community-analyze reaches a terminal response for a valid image', async ({ request }) => {
  const res = await postJson(request, '/api/community-analyze', {
    image: TINY_PNG_B64,
    mimeType: 'image/png',
    language: 'en',
  });
  expectTerminalResponse(res.status());
});

// --- /api/hcp-chat -----------------------------------------------------------

test('POST /api/hcp-chat rejects an oversized body with 413', async ({ request }) => {
  const res = await postJson(request, '/api/hcp-chat', {
    messages: [{ role: 'user', content: OVERSIZED_B64 }],
    language: 'en',
  });
  expect(res.status()).toBe(413);
});

test('POST /api/hcp-chat reaches a terminal response for a valid question', async ({ request }) => {
  const res = await postJson(request, '/api/hcp-chat', {
    messages: [{ role: 'user', content: 'What is the initial management of a burn?' }],
    language: 'en',
  });
  expectTerminalResponse(res.status());
});

// --- /api/community-chat -----------------------------------------------------

test('POST /api/community-chat rejects an oversized body with 413', async ({ request }) => {
  const res = await postJson(request, '/api/community-chat', {
    messages: [{ role: 'user', content: OVERSIZED_B64 }],
    language: 'en',
  });
  expect(res.status()).toBe(413);
});

test('POST /api/community-chat reaches a terminal response for a valid question', async ({ request }) => {
  const res = await postJson(request, '/api/community-chat', {
    messages: [{ role: 'user', content: 'How do I treat a minor kitchen burn?' }],
    language: 'en',
  });
  expectTerminalResponse(res.status());
});

for (const route of ['/api/analyze-wound', '/api/community-analyze', '/api/hcp-chat', '/api/community-chat']) {
  test(`POST ${route} rejects a missing language with 400`, async ({ request }) => {
    const payload = route.includes('chat')
      ? { messages: [{ role: 'user', content: 'Test question' }] }
      : { image: TINY_PNG_B64, mimeType: 'image/png' };
    const res = await postJson(request, route, payload);
    expect(res.status()).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringMatching(/"en" or "ms"/) });
  });

  test(`POST ${route} rejects a non-canonical language with 400`, async ({ request }) => {
    const payload = route.includes('chat')
      ? { messages: [{ role: 'user', content: 'Test question' }], language: 'bm' }
      : { image: TINY_PNG_B64, mimeType: 'image/png', language: 'bm' };
    const res = await postJson(request, route, payload);
    expect(res.status()).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringMatching(/"en" or "ms"/) });
  });
}
