/**
 * Responsible AI — analysis metadata & versioning (RAI-TRANS-003 / RAI-TRANS-004 /
 * RAI-ACCT-001).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAnalysisMetadata,
  deriveImageQualityBand,
  reviewStatusLabel,
} from '../../lib/ai/analysis/metadata';
import {
  ANALYSIS_PIPELINE_VERSION,
  ANALYSIS_SCHEMA_VERSION,
  STAGED_PROMPT_VERSIONS,
} from '../../lib/ai/prompts/versions';

test('RAI-TRANS-004: metadata carries pipeline, prompt and schema versions', () => {
  const m = buildAnalysisMetadata({ modelDeployment: 'gpt-4o' });
  assert.equal(m.pipelineVersion, ANALYSIS_PIPELINE_VERSION);
  assert.equal(m.schemaVersion, ANALYSIS_SCHEMA_VERSION);
  assert.deepEqual(m.promptVersions, STAGED_PROMPT_VERSIONS);
  assert.equal(m.modelDeployment, 'gpt-4o');
});

test('RAI-ACCT-001: a fresh analysis defaults to awaiting clinician review', () => {
  const m = buildAnalysisMetadata();
  assert.equal(m.reviewStatus, 'awaiting_review');
  assert.equal(reviewStatusLabel(m.reviewStatus), 'Clinical review pending');
  assert.notEqual(reviewStatusLabel('reviewed'), 'AI approved');
});

test('RAI-TRANS-003: metadata never falls back to a secret and gives a stable id', () => {
  const m = buildAnalysisMetadata();
  assert.equal(m.modelDeployment, 'default');
  assert.match(m.analysisId, /^axr-/);
  assert.ok(!Number.isNaN(Date.parse(m.generatedAt)));
});

test('RAI-SAFE-002: image-quality band is derived honestly', () => {
  assert.equal(deriveImageQualityBand(undefined, undefined), 'unknown');
  assert.equal(deriveImageQualityBand(true, []), 'good');
  assert.equal(deriveImageQualityBand(true, ['slight glare']), 'limited');
  assert.equal(deriveImageQualityBand(false, ['blur']), 'limited');
  assert.equal(deriveImageQualityBand(false, ['blur', 'dark']), 'insufficient');
});

test('deterministic calculations are only listed when applied', () => {
  assert.deepEqual(buildAnalysisMetadata({}).deterministicCalculations, []);
  assert.deepEqual(
    buildAnalysisMetadata({ parklandIndicated: true }).deterministicCalculations,
    ['Parkland fluid estimate (weight-gated)'],
  );
});
