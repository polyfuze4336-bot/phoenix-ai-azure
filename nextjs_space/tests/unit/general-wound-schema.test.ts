import test from 'node:test';
import assert from 'node:assert/strict';
import { generalWoundAnalysisSchema } from '../../lib/ai/schemas/general-wound-analysis';
import { GENERAL_WOUND_ANALYSIS_PROMPT } from '../../lib/ai/prompts/general-wound-analysis';

test('general wound schema exposes all six clinical TIMERS fields', () => {
  const result = generalWoundAnalysisSchema.safeParse({
    schemaVersion: '1.0',
    analysisQuality: 'MODERATE',
    imageQuality: { adequate: true, issues: [], note: 'usable' },
    observation: {
      imageQualityAdequate: true,
      imageQualityIssues: [],
      imageQualityNote: 'usable',
      anatomicalLocation: 'leg',
      observedSkinTone: 'unclear',
      visibleFindings: ['open wound'],
      scalePresent: false,
      notes: '',
    },
    fitzpatrickPhototype: 'Unable to determine reliably',
    woundCategory: 'Chronic wound',
    woundCharacteristics: 'Open wound with visible slough',
    confidenceLevel: 'moderate',
    timers: {
      tissueManagement: 'Assess slough',
      infectionInflammation: 'Clinical exam required',
      moistureImbalance: 'Moderate exudate',
      edgeOfWound: 'Irregular',
      repairRegeneration: 'Reassess trajectory',
      socialPatientFactors: 'Not supplied',
    },
    managementRecommendations: {
      woundCareProtocol: 'Clean and reassess',
      dressingRecommendations: 'Select after exudate assessment',
      referralCriteria: 'Escalate for red flags',
      followUpSchedule: 'Clinical review',
    },
    whyThisAssessment: ['Visible slough'],
    visualExtent: 'Localised',
    measuredDimensions: 'Unable to determine reliably without a scale/reference',
    redFlags: [],
    missingInformation: ['Comorbidities'],
    limitations: ['Single photograph'],
    refinementOptions: ['Add a scale reference'],
  });
  assert.equal(result.success, true);
});

test('general wound prompt excludes burn-only calculations and protects unsupported inference', () => {
  assert.match(GENERAL_WOUND_ANALYSIS_PROMPT, /Do not output TBSA/);
  assert.match(GENERAL_WOUND_ANALYSIS_PROMPT, /Unable to determine reliably/);
  assert.match(GENERAL_WOUND_ANALYSIS_PROMPT, /Do not infer comorbidities or social factors/);
  assert.match(GENERAL_WOUND_ANALYSIS_PROMPT, /S — Social & patient factors/);
});

test('general wound schema accepts intimate-site clinical findings without burn-only fields', () => {
  const result = generalWoundAnalysisSchema.safeParse({
    imageQuality: { adequate: true },
    observation: {
      imageQualityAdequate: true, scalePresent: false,
      anatomicalLocation: 'perineal region', visibleFindings: ['slough'],
    },
    fitzpatrickPhototype: 'Unable to determine reliably',
    woundCategory: 'General wound',
    woundCharacteristics: 'Visible slough',
    confidenceLevel: 'low',
    timers: {
      tissueManagement: 'Assess tissue', infectionInflammation: 'Examine',
      moistureImbalance: 'Assess exudate', edgeOfWound: 'Assess edge',
      repairRegeneration: 'Monitor', socialPatientFactors: 'Not supplied',
    },
    managementRecommendations: {
      woundCareProtocol: 'Clinical review', dressingRecommendations: 'Assess',
      referralCriteria: 'Escalate', followUpSchedule: 'Review',
    },
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal('tbsaEstimate' in result.data, false);
    assert.equal('parkland' in result.data, false);
  }
});
