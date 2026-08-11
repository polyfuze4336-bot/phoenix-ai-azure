/**
 * Responsible AI — privacy-safe telemetry (RAI-PRIV-003).
 *
 * Telemetry must never carry image bytes, prompts, transcripts, tokens or secrets,
 * even if a caller mistakenly passes them.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProperties } from '../../lib/telemetry/server';

test('RAI-PRIV-003: blocked keys are stripped from telemetry properties', () => {
  const out = sanitizeProperties({
    correlationId: 'abc',
    image: 'BIGBASE64',
    base64: 'x',
    prompt: 'system prompt',
    transcript: 'chat',
    token: 't',
    password: 'p',
    apiKey: 'k',
    authorization: 'Bearer x',
    latencyMs: 1200,
  });
  for (const blocked of ['image', 'base64', 'prompt', 'transcript', 'token', 'password', 'apiKey', 'authorization']) {
    assert.equal(out[blocked], undefined, `${blocked} must be dropped`);
  }
  assert.equal(out.correlationId, 'abc');
  assert.equal(out.latencyMs, '1200');
});
