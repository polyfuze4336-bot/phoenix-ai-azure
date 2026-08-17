/**
 * Responsible AI — safety controls.
 *
 * These tests assert the deterministic safety guarantees that back the AI Assurance
 * controls (RAI-SAFE-*). They exercise the pure `assembleAnalysis` post-processing,
 * make no live model calls, and verify safety BEHAVIOUR — not diagnostic accuracy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { assembleAnalysis } from '../../lib/ai/analysis/pipeline';
import { baseObservation, baseInterpretation, baseManagement, passingCritic as critic } from './_fixtures';

test('RAI-SAFE-006: Parkland is never computed from an assumed weight', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 15 }),
    management: baseManagement(),
    critic,
    patient: { ageGroup: 'adult' },
  });

  assert.equal(a.parkland.requiresWeight, true);
  assert.equal(a.parkland.total24hMl, null);
  assert.doesNotMatch(a.parkland.summary, /\d[\d,]*\s?mL/i);
});

test('RAI-SAFE-006: Parkland volumes require the category-specific TBSA threshold', () => {
  const adultBelow = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 14.9 }),
    management: baseManagement(),
    critic,
    patient: { ageGroup: 'adult', weightKg: 70 },
  });
  const childBoundary = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 10 }),
    management: baseManagement(),
    critic,
    patient: { ageGroup: 'child', weightKg: 20 },
  });
  assert.equal(adultBelow.parkland.indicated, 'no');
  assert.equal(adultBelow.parkland.total24hMl, null);
  assert.equal(childBoundary.parkland.indicated, 'yes');
  assert.equal(childBoundary.parkland.total24hMl, 800);
});

test('RAI-SAFE-007: measured dimensions are dropped without a scale reference', () => {
  const a = assembleAnalysis({
    observation: baseObservation({ scalePresent: false }),
    interpretation: baseInterpretation(),
    management: baseManagement(),
    critic,
  });
  assert.equal(a.interpretation.measuredDimensions, 'unavailable');
});

test('RAI-FAIR-001: Fitzpatrick is forced to unknown unless clinician-supplied', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ reportedFitzpatrickType: 'Type IV' }),
    management: baseManagement(),
    critic,
  });
  assert.equal(a.interpretation.reportedFitzpatrickType, 'unknown');
});

test('RAI-SAFE-009: poor image quality caps confidence', () => {
  const a = assembleAnalysis({
    observation: baseObservation({ imageQualityAdequate: false, imageQualityIssues: ['blur', 'low light'] }),
    interpretation: baseInterpretation(),
    management: baseManagement(),
    critic,
  });
  assert.notEqual(a.interpretation.burnDepth.confidence, 'high');
  assert.notEqual(a.analysisQuality, 'HIGH');
});

test('RAI-SAFE-008: special-site burn never stays on a routine pathway', () => {
  const a = assembleAnalysis({
    observation: baseObservation({ anatomicalLocation: 'right hand' }),
    interpretation: baseInterpretation(),
    management: baseManagement({ referralLevel: 'routine' }),
    critic,
  });
  assert.notEqual(a.management.referralLevel, 'routine');
});

test('RAI-SAFE-011: a non-burn cannot carry a TBSA value', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ isBurn: false, tbsaEstimate: 12 }),
    management: baseManagement(),
    critic,
  });
  assert.equal(a.interpretation.tbsaEstimate, null);
});

test('RAI-TRANS-002: limitations and missing information are always present arrays', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation(),
    management: baseManagement(),
    critic,
  });
  assert.ok(Array.isArray(a.limitations));
  assert.ok(Array.isArray(a.missingInformation));
});
