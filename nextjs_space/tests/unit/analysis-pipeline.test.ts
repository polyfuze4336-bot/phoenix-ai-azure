/**
 * Unit tests — staged burn/wound analysis pipeline (DETERMINISTIC parts only).
 *
 * These tests exercise the pure post-processing/safety rules in
 * `assembleAnalysis` and the flat back-compat adapter. They make NO live model
 * calls, so they are fast and hermetic. They verify the correctness FIXES the
 * redesign is responsible for — they do NOT assert clinical/diagnostic accuracy
 * (which requires a separate, live evaluation harness with a labelled dataset).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assembleAnalysis,
  getAnalysisTimeoutMs,
  hasInterpretationSignal,
  hasObservationSignal,
} from '../../lib/ai/analysis/pipeline';
import { toFlatHcpAnalysis, type Interpretation, type VisualObservation, type Management } from '../../lib/ai/schemas/burn-wound-analysis';

function field(interpretation: string, confidence: any = 'high') {
  return { observation: 'obs', interpretation, confidence, basis: ['b'] };
}

function baseObservation(over: Partial<VisualObservation> = {}): VisualObservation {
  return {
    imageQualityAdequate: true,
    imageQualityIssues: [],
    imageQualityNote: 'clear',
    anatomicalLocation: 'left forearm',
    observedSkinTone: 'light brown',
    visibleFindings: ['erythema', 'blistering'],
    scalePresent: false,
    notes: '',
    ...over,
  };
}

function baseInterpretation(over: Partial<Interpretation> = {}): Interpretation {
  return {
    woundCategory: field('Burn'),
    woundType: 'Scald',
    isBurn: true,
    burnMechanism: field('Scald'),
    burnDepth: field('Superficial partial thickness'),
    tissueComposition: field('N/A'),
    exudate: field('Scant'),
    infectionSigns: field('None', 'low'),
    edgesAndPeriwound: field('Defined'),
    severity: 'Moderate',
    visualExtent: 'small area',
    measuredDimensions: '5 x 4 cm',
    tbsaEstimate: 5,
    tbsaRange: '4-6%',
    tbsaMethod: 'Palm method',
    tbsaBodyRegions: 'Left forearm',
    tbsaAssumptions: [],
    tbsaLimitations: [],
    reportedFitzpatrickType: 'Type V',
    skinToneInterpretationNote: 'note',
    ...over,
  };
}

function baseManagement(over: Partial<Management> = {}): Management {
  return {
    firstAid: 'Cool with running water',
    woundCare: 'Non-adherent dressing',
    dressing: 'Silver',
    referralLevel: 'routine',
    referralCriteria: 'GP follow-up',
    locationConsiderations: '',
    followUp: '48h',
    redFlags: ['spreading redness'],
    ...over,
  };
}

const critic = { pass: true, issues: [], recommendedCorrections: [] };

test('core stage signal gates reject empty tolerant-schema inputs', () => {
  assert.equal(hasObservationSignal({}), false);
  assert.equal(hasObservationSignal({
    imageQualityAdequate: false,
    scalePresent: false,
    visibleFindings: [],
  }), true);
  assert.equal(hasInterpretationSignal({}), false);
  assert.equal(hasInterpretationSignal({ isBurn: false }), true);
  assert.equal(hasInterpretationSignal({
    isBurn: true,
    woundCategory: { interpretation: 'Burn' },
    burnDepth: { interpretation: 'Superficial partial thickness' },
  }), true);
});

test('analysis timeout is configurable and bounded', () => {
  const saved = process.env.AI_ANALYSIS_TIMEOUT_MS;
  try {
    delete process.env.AI_ANALYSIS_TIMEOUT_MS;
    assert.equal(getAnalysisTimeoutMs(), 90_000);
    process.env.AI_ANALYSIS_TIMEOUT_MS = '1000';
    assert.equal(getAnalysisTimeoutMs(), 10_000);
    process.env.AI_ANALYSIS_TIMEOUT_MS = '999999';
    assert.equal(getAnalysisTimeoutMs(), 180_000);
    process.env.AI_ANALYSIS_TIMEOUT_MS = '120000';
    assert.equal(getAnalysisTimeoutMs(), 120_000);
  } finally {
    if (saved === undefined) delete process.env.AI_ANALYSIS_TIMEOUT_MS;
    else process.env.AI_ANALYSIS_TIMEOUT_MS = saved;
  }
});

test('Parkland is NOT computed from an assumed weight when an indicated adult regimen lacks weight', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 15 }),
    management: baseManagement(),
    critic,
    patient: { ageGroup: 'adult' },
  });
  assert.equal(a.parkland.indicated, 'yes');
  assert.equal(a.parkland.requiresWeight, true);
  assert.equal(a.parkland.total24hMl, null);
  assert.match(a.parkland.summary, /patient weight is required/i);
  // The summary must not present a COMPUTED fluid volume; it may name 70 kg only
  // to explain why a fixed estimate is unsafe.
  assert.doesNotMatch(a.parkland.summary, /\d[\d,]*\s?mL/i);
});

test('Parkland IS computed deterministically when category, threshold, and weight permit it', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 15 }),
    management: baseManagement(),
    critic,
    patient: { weightKg: 70, ageGroup: 'adult' },
  });
  // 4 * 70 * 15 = 4200 mL
  assert.equal(a.parkland.indicated, 'yes');
  assert.equal(a.parkland.total24hMl, 4200);
  assert.equal(a.parkland.first8hMl, 2100);
});

test('Parkland below-threshold guidance is localized without calculated volumes', () => {
  const english = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 14.9 }),
    management: baseManagement(),
    critic,
    patient: { weightKg: 70, ageGroup: 'adult' },
    language: 'en',
  });
  const malay = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 9.9 }),
    management: baseManagement(),
    critic,
    patient: { weightKg: 20, ageGroup: 'child' },
    language: 'ms',
  });
  assert.equal(english.parkland.indicated, 'no');
  assert.equal(english.parkland.total24hMl, null);
  assert.match(english.parkland.summary, /not required/i);
  assert.equal(malay.parkland.indicated, 'no');
  assert.equal(malay.parkland.total24hMl, null);
  assert.match(malay.parkland.summary, /tidak diperlukan/i);
});

test('Parkland is uncertain when patient category is unavailable', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 20 }),
    management: baseManagement(),
    critic,
    patient: { weightKg: 70 },
  });
  assert.equal(a.parkland.indicated, 'uncertain');
  assert.equal(a.parkland.requiresWeight, false);
  assert.equal(a.parkland.total24hMl, null);
  assert.match(a.parkland.summary, /adult or child/i);
});

test('measured dimensions are dropped when no scale reference is present', () => {
  const a = assembleAnalysis({ observation: baseObservation({ scalePresent: false }), interpretation: baseInterpretation(), management: baseManagement(), critic });
  assert.equal(a.interpretation.measuredDimensions, 'unavailable');
});

test('Fitzpatrick is forced to unknown unless supplied by the clinician', () => {
  const a = assembleAnalysis({ observation: baseObservation(), interpretation: baseInterpretation({ reportedFitzpatrickType: 'Type IV' }), management: baseManagement(), critic });
  assert.equal(a.interpretation.reportedFitzpatrickType, 'unknown');

  const b = assembleAnalysis({ observation: baseObservation(), interpretation: baseInterpretation(), management: baseManagement(), critic, patient: { fitzpatrickType: 'Type IV' } });
  assert.equal(b.interpretation.reportedFitzpatrickType, 'Type IV');
});

test('poor image quality caps field confidence', () => {
  const a = assembleAnalysis({
    observation: baseObservation({ imageQualityAdequate: false, imageQualityIssues: ['blur', 'low light'] }),
    interpretation: baseInterpretation(),
    management: baseManagement(),
    critic,
  });
  assert.notEqual(a.interpretation.burnDepth.confidence, 'high');
  assert.notEqual(a.analysisQuality, 'HIGH');
});

test('special-site burn is never left on routine follow-up', () => {
  const a = assembleAnalysis({
    observation: baseObservation({ anatomicalLocation: 'right hand' }),
    interpretation: baseInterpretation(),
    management: baseManagement({ referralLevel: 'routine' }),
    critic,
  });
  assert.notEqual(a.management.referralLevel, 'routine');
});

test('non-burn cannot carry a TBSA value', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ isBurn: false, tbsaEstimate: 12 }),
    management: baseManagement(),
    critic,
  });
  assert.equal(a.interpretation.tbsaEstimate, null);
  assert.equal(a.parkland.indicated, 'no');
});

test('missing weight for an indicated burn is surfaced as missing information', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 15 }),
    management: baseManagement(),
    critic,
    patient: { ageGroup: 'adult' },
  });
  assert.ok(a.missingInformation.some((m) => /weight/i.test(m)));
  assert.ok(a.recommendedFollowUpQuestions.some((q) => /weight/i.test(q)));
});

test('flat adapter maps the rich structure back to the 22-field contract', () => {
  const a = assembleAnalysis({ observation: baseObservation(), interpretation: baseInterpretation({ tbsaEstimate: 15 }), management: baseManagement(), critic, patient: { weightKg: 70, ageGroup: 'adult', fitzpatrickType: 'Type V' } });
  const flat = toFlatHcpAnalysis(a);
  assert.equal(flat.isBurn, true);
  assert.equal(flat.woundType, 'Scald');
  assert.equal(typeof flat.tbsaEstimate, 'string');
  assert.ok(flat.parklandFluid.length > 0);
  // A clinician-supplied Fitzpatrick type is carried into the flat field.
  assert.match(flat.fitzpatrickType, /Type V/);
});
