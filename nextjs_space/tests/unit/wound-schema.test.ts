/**
 * Unit tests — wound-analysis Zod schema validation.
 * Validates the tolerant coercion + strict shape of the HCP and community schemas.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hcpWoundAnalysisSchema,
  communityWoundAnalysisSchema,
} from '../../lib/ai/validation/wound-analysis-schema';

test('hcpWoundAnalysisSchema: parses a complete valid object', () => {
  const parsed = hcpWoundAnalysisSchema.parse({
    fitzpatrickType: 'III',
    fitzpatrickNote: 'Medium skin tone',
    woundCategory: 'Burn',
    woundType: 'Thermal',
    burnDegree: '2nd',
    severity: 'Moderate',
    characteristics: 'Blisters',
    tissueComposition: 'Mixed',
    exudate: 'Moderate',
    woundEdges: 'Defined',
    confidence: 'High',
    tbsaEstimate: '12',
    tbsaClassification: 'Minor burn (<15% TBSA)',
    tbsaRange: '10-15',
    tbsaBodyRegions: 'Arm',
    tbsaMethod: 'Rule of nines',
    isBurn: true,
    parklandFluid: '3000 ml',
    firstAid: 'Cool with water',
    woundCare: 'Dress daily',
    dressing: 'Silver',
    referral: 'Burns unit',
    followUp: '48h',
  });
  assert.equal(parsed.woundType, 'Thermal');
  assert.equal(parsed.isBurn, true);
});

test('hcpWoundAnalysisSchema: missing fields fall back to defaults (N/A, 0, false)', () => {
  const parsed = hcpWoundAnalysisSchema.parse({ woundType: 'Burn' });
  assert.equal(parsed.woundCategory, 'N/A');
  assert.equal(parsed.tbsaEstimate, '0');
  assert.equal(parsed.tbsaClassification, 'N/A');
  assert.equal(parsed.isBurn, false);
});

test('hcpWoundAnalysisSchema: coerces numbers and booleans to strings', () => {
  const parsed = hcpWoundAnalysisSchema.parse({ confidence: 90, severity: true });
  assert.equal(parsed.confidence, '90');
  assert.equal(parsed.severity, 'true');
});

test('hcpWoundAnalysisSchema: isBurn coerces true/false/yes/no', () => {
  assert.equal(hcpWoundAnalysisSchema.parse({ isBurn: 'true' }).isBurn, true);
  assert.equal(hcpWoundAnalysisSchema.parse({ isBurn: 'YES' }).isBurn, true);
  assert.equal(hcpWoundAnalysisSchema.parse({ isBurn: 'false' }).isBurn, false);
  assert.equal(hcpWoundAnalysisSchema.parse({ isBurn: 'no' }).isBurn, false);
  assert.equal(hcpWoundAnalysisSchema.parse({ isBurn: 'maybe' }).isBurn, false);
});

test('communityWoundAnalysisSchema: parses valid object and defaults empties', () => {
  const parsed = communityWoundAnalysisSchema.parse({
    description: 'A graze',
    recommendation: 'Clean it',
    firstAidTips: 'Wash it',
  });
  assert.equal(parsed.description, 'A graze');

  const withDefaults = communityWoundAnalysisSchema.parse({});
  assert.equal(withDefaults.description, '');
  assert.equal(withDefaults.recommendation, '');
  assert.equal(withDefaults.firstAidTips, '');
});
