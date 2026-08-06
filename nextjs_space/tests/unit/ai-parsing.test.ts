/**
 * Unit tests — AI response parsing (streamed model output -> structured result).
 * Covers parseHcpWoundAnalysis / parseCommunityWoundAnalysis behaviour, including
 * the explicit safe-fallback states (no fabricated clinical findings).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHcpWoundAnalysis,
  parseCommunityWoundAnalysis,
  HCP_ASSESSMENT_UNAVAILABLE,
  COMMUNITY_ASSESSMENT_UNAVAILABLE,
} from '../../lib/ai/validation/wound-analysis-schema';

test('parseHcpWoundAnalysis: valid model JSON parses into the structured result', () => {
  const buffer = JSON.stringify({
    woundType: 'Thermal burn',
    woundCategory: 'Burn',
    severity: 'Moderate',
    characteristics: 'Blistering with erythema',
    burnDegree: '2nd degree superficial',
    tissueComposition: 'Mixed',
    isBurn: true,
    confidence: 'High',
  });
  const result = parseHcpWoundAnalysis(buffer);
  assert.equal(result.woundType, 'Thermal burn');
  assert.equal(result.severity, 'Moderate');
  assert.equal(result.isBurn, true);
});

test('parseHcpWoundAnalysis: invalid JSON -> explicit unavailable fallback', () => {
  assert.deepEqual(parseHcpWoundAnalysis('not json at all'), HCP_ASSESSMENT_UNAVAILABLE);
  assert.deepEqual(parseHcpWoundAnalysis(''), HCP_ASSESSMENT_UNAVAILABLE);
  assert.deepEqual(parseHcpWoundAnalysis('   '), HCP_ASSESSMENT_UNAVAILABLE);
});

test('parseHcpWoundAnalysis: JSON array or non-object -> fallback', () => {
  assert.deepEqual(parseHcpWoundAnalysis('[1,2,3]'), HCP_ASSESSMENT_UNAVAILABLE);
  assert.deepEqual(parseHcpWoundAnalysis('"a string"'), HCP_ASSESSMENT_UNAVAILABLE);
  assert.deepEqual(parseHcpWoundAnalysis('42'), HCP_ASSESSMENT_UNAVAILABLE);
});

test('parseHcpWoundAnalysis: object without any signal key -> fallback', () => {
  assert.deepEqual(parseHcpWoundAnalysis(JSON.stringify({ foo: 'bar' })), HCP_ASSESSMENT_UNAVAILABLE);
});

test('parseHcpWoundAnalysis: tolerant coercion of number/boolean to string', () => {
  const buffer = JSON.stringify({ woundType: 'Burn', confidence: 87, tbsaEstimate: 12 });
  const result = parseHcpWoundAnalysis(buffer);
  assert.equal(result.confidence, '87');
  assert.equal(result.tbsaEstimate, '12');
});

test('parseHcpWoundAnalysis: isBurn tolerates yes/no strings', () => {
  const yes = parseHcpWoundAnalysis(JSON.stringify({ woundType: 'Burn', isBurn: 'yes' }));
  assert.equal(yes.isBurn, true);
  const no = parseHcpWoundAnalysis(JSON.stringify({ woundType: 'Ulcer', isBurn: 'no' }));
  assert.equal(no.isBurn, false);
});

test('parseCommunityWoundAnalysis: valid model JSON parses', () => {
  const buffer = JSON.stringify({
    description: 'A small superficial graze.',
    recommendation: 'Clean and cover it.',
    firstAidTips: 'Wash with clean water.',
  });
  const result = parseCommunityWoundAnalysis(buffer);
  assert.equal(result.description, 'A small superficial graze.');
  assert.equal(result.recommendation, 'Clean and cover it.');
});

test('parseCommunityWoundAnalysis: invalid/empty/no-signal -> unavailable fallback', () => {
  assert.deepEqual(parseCommunityWoundAnalysis('garbage'), COMMUNITY_ASSESSMENT_UNAVAILABLE);
  assert.deepEqual(parseCommunityWoundAnalysis(''), COMMUNITY_ASSESSMENT_UNAVAILABLE);
  assert.deepEqual(parseCommunityWoundAnalysis(JSON.stringify({ foo: 1 })), COMMUNITY_ASSESSMENT_UNAVAILABLE);
});

test('parseCommunityWoundAnalysis: phase argument does not change safe fallback', () => {
  assert.deepEqual(parseCommunityWoundAnalysis('bad', 'done'), COMMUNITY_ASSESSMENT_UNAVAILABLE);
  assert.deepEqual(parseCommunityWoundAnalysis('bad', 'end'), COMMUNITY_ASSESSMENT_UNAVAILABLE);
});
