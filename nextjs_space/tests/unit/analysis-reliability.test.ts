import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeReliability } from '../reliability/summary';

test('reliability summary reports completion, failure subtypes and average latency', () => {
  const summary = summarizeReliability([
    { kind: 'success', latencyMs: 100 },
    { kind: 'success', latencyMs: 200 },
    { kind: 'timeout', latencyMs: 300, category: 'AI_TIMEOUT' },
    { kind: 'parsing_failure', latencyMs: 400, category: 'PARSING_FAILURE' },
  ]);
  assert.equal(summary.successCount, 2);
  assert.equal(summary.failureCount, 2);
  assert.equal(summary.timeoutCount, 1);
  assert.equal(summary.parsingFailureCount, 1);
  assert.equal(summary.averageLatencyMs, 250);
  assert.equal(summary.successRatePct, 50);
  assert.equal(summary.targetMet, false);
  assert.deepEqual(summary.failureCategories, { AI_TIMEOUT: 1, PARSING_FAILURE: 1 });
});

test('reliability target requires at least 95 percent successful completion', () => {
  const outcomes = Array.from({ length: 20 }, (_, index) => ({
    kind: index === 0 ? 'failure' as const : 'success' as const,
    latencyMs: 100,
  }));
  assert.equal(summarizeReliability(outcomes).successRatePct, 95);
  assert.equal(summarizeReliability(outcomes).targetMet, true);
});