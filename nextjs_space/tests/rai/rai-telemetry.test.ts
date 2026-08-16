/**
 * Responsible AI — privacy-safe telemetry (RAI-PRIV-003).
 *
 * Telemetry must never carry image bytes, prompts, transcripts, tokens or secrets,
 * even if a caller mistakenly passes them.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProperties } from '../../lib/telemetry/server';
import {
  imageAnalysisFailure,
  imageSizeBucket,
  readAnalysisRetryCount,
} from '../../lib/telemetry/analysis-events';
import { AiError } from '../../lib/ai/types';

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

test('RAI-PRIV-003: safe image metadata survives while image content remains blocked', () => {
  const out = sanitizeProperties({
    imageSizeBucket: '1_mb_to_5_mb',
    imageMimeType: 'image/png',
    imageContents: 'never-send-this',
    completeClinicalResponse: 'never-send-this-either',
  });
  assert.equal(out.imageSizeBucket, '1_mb_to_5_mb');
  assert.equal(out.imageMimeType, 'image/png');
  assert.equal(out.imageContents, undefined);
  assert.equal(out.completeClinicalResponse, undefined);
});

test('RAI-PRIV-003: lifecycle dimensions are bounded and categorized without payloads', () => {
  assert.equal(imageSizeBucket(100), 'under_256_kb');
  assert.equal(imageSizeBucket(2 * 1024 * 1024), '1_mb_to_5_mb');
  assert.equal(readAnalysisRetryCount('999'), 10);
  assert.equal(readAnalysisRetryCount('invalid'), 0);
  assert.deepEqual(imageAnalysisFailure(new AiError({
    code: 'timeout',
    category: 'AI_TIMEOUT',
    status: 504,
    clientMessage: 'Timed out',
  })), { category: 'AI_TIMEOUT', status: 504 });
});

test('RAI-PRIV-003: content-filter telemetry contains only safe structured classification', () => {
  assert.deepEqual(imageAnalysisFailure(new AiError({
    code: 'bad_request',
    category: 'AI_CONTENT_FILTER',
    status: 422,
    clientMessage: 'Blocked',
    upstreamText: 'raw response must not be returned',
    contentFilter: {
      source: 'input',
      categories: [{ category: 'sexual', filtered: true, severity: 'high' }],
    },
  })), {
    category: 'AI_CONTENT_FILTER',
    status: 422,
    contentFilterSource: 'input',
    contentFilterCategory: 'sexual',
    contentFilterSeverity: 'high',
  });
});
