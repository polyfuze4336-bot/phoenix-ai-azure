/**
 * Responsible AI — unsupported-inference guards (RAI-FAIR-001 / RAI-FAIR-002).
 *
 * A photograph cannot establish ethnicity, race, Fitzpatrick skin type, age, pain or
 * sensation. These tests assert the staged prompts explicitly forbid such inference,
 * so the guardrails are not silently dropped in a future prompt edit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { WOUND_VISUAL_OBSERVATION_PROMPT } from '../../lib/ai/prompts/wound-visual-observation';
import { WOUND_CLINICAL_INTERPRETATION_PROMPT } from '../../lib/ai/prompts/wound-clinical-interpretation';

test('RAI-FAIR-001: the visual prompt forbids assigning Fitzpatrick from a photo', () => {
  const p = WOUND_VISUAL_OBSERVATION_PROMPT.toLowerCase();
  assert.match(p, /do not assign a fitzpatrick/i);
  assert.match(p, /cannot be determined from a photograph/i);
});

test('RAI-FAIR-001: the interpretation prompt defaults Fitzpatrick to unknown', () => {
  const p = WOUND_CLINICAL_INTERPRETATION_PROMPT.toLowerCase();
  assert.match(p, /do not assign a fitzpatrick type from the image/i);
  assert.match(p, /'unknown'/i);
});

test('RAI-SAFE-007: the interpretation prompt forbids invented measurements', () => {
  const p = WOUND_CLINICAL_INTERPRETATION_PROMPT.toLowerCase();
  assert.match(p, /do not invent measurements/i);
  assert.match(p, /'unavailable'/i);
});

test('RAI-SAFE-006: the interpretation prompt defers fluid resuscitation to deterministic calc', () => {
  const p = WOUND_CLINICAL_INTERPRETATION_PROMPT.toLowerCase();
  assert.match(p, /do not compute fluid resuscitation/i);
});
