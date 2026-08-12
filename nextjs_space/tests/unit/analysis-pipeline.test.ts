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
import { assembleAnalysis } from '../../lib/ai/analysis/pipeline';
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

test('Parkland is NOT computed from an assumed weight when weight is absent', () => {
  const a = assembleAnalysis({ observation: baseObservation(), interpretation: baseInterpretation(), management: baseManagement(), critic });
  assert.equal(a.parkland.requiresWeight, true);
  assert.equal(a.parkland.total24hMl, null);
  assert.match(a.parkland.summary, /requires the patient/i);
  // The summary must not present a COMPUTED fluid volume; it may name 70 kg only
  // to explain why a fixed estimate is unsafe.
  assert.doesNotMatch(a.parkland.summary, /\d[\d,]*\s?mL/i);
});

test('Parkland IS computed deterministically when weight is supplied', () => {
  const a = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 10 }),
    management: baseManagement(),
    critic,
    patient: { weightKg: 70 },
  });
  // 4 * 70 * 10 = 2800 mL
  assert.equal(a.parkland.indicated, 'yes');
  assert.equal(a.parkland.total24hMl, 2800);
  assert.equal(a.parkland.first8hMl, 1400);
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

test('photographic TBSA is clamped and exactly 15% is classified Major', () => {
  const atBoundary = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 15 }),
    management: baseManagement(),
    critic,
  });
  assert.equal(atBoundary.interpretation.tbsaEstimate, 15);
  assert.equal(atBoundary.interpretation.tbsaClassification, 'Major');

  const overLimit = assembleAnalysis({
    observation: baseObservation(),
    interpretation: baseInterpretation({ tbsaEstimate: 140 }),
    management: baseManagement(),
    critic,
  });
  assert.equal(overLimit.interpretation.tbsaEstimate, 100);
});

test('multi-image analysis discloses duplicate-view and coverage limitations', () => {
  const a = assembleAnalysis({
    observation: baseObservation({
      imageCount: 3,
      distinctAnatomicalRegions: ['left arm', 'anterior trunk'],
      probableDuplicateViews: ['images 1 and 2: same left arm region'],
      multiImageAggregationNote: 'Images 1 and 2 corroborate one region; image 3 is distinct.',
    }),
    interpretation: baseInterpretation({ tbsaEstimate: 14.9 }),
    management: baseManagement(),
    critic,
    imageCount: 3,
  });
  assert.equal(a.interpretation.tbsaClassification, 'Minor');
  assert.ok(a.limitations.some((limitation) => /not geometric registration/i.test(limitation)));
  const flat = toFlatHcpAnalysis(a);
  assert.equal(flat.imageCount, '3');
  assert.equal(flat.tbsaClassification, 'Minor');
  assert.match(flat.probableDuplicateViews, /images 1 and 2/i);
});

test('missing weight for a burn is surfaced as missing information', () => {
  const a = assembleAnalysis({ observation: baseObservation(), interpretation: baseInterpretation(), management: baseManagement(), critic });
  assert.ok(a.missingInformation.some((m) => /weight/i.test(m)));
  assert.ok(a.recommendedFollowUpQuestions.some((q) => /weight/i.test(q)));
});

test('flat adapter maps the rich structure back to the 22-field contract', () => {
  const a = assembleAnalysis({ observation: baseObservation(), interpretation: baseInterpretation(), management: baseManagement(), critic, patient: { weightKg: 70, fitzpatrickType: 'Type V' } });
  const flat = toFlatHcpAnalysis(a);
  assert.equal(flat.isBurn, true);
  assert.equal(flat.woundType, 'Scald');
  assert.equal(typeof flat.tbsaEstimate, 'string');
  assert.ok(flat.parklandFluid.length > 0);
  // A clinician-supplied Fitzpatrick type is carried into the flat field.
  assert.match(flat.fitzpatrickType, /Type V/);
});
