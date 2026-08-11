/**
 * Unit tests — Phoenix AI v2.0 presentation helpers + first-aid parity.
 *
 * Guards the pure v2 formatting utilities and confirms the v2 first-aid content
 * mirrors the original community first-aid guides (same ids). Runs via tsx.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { caseTypeLabel, confidenceLabel, formatRelative } from '../../lib/v2/format';
import { FIRST_AID_GUIDES } from '../../lib/v2/first-aid';

test('caseTypeLabel: converts SNAKE_CASE to Title Case', () => {
  assert.equal(caseTypeLabel('DIABETIC_ULCER'), 'Diabetic Ulcer');
  assert.equal(caseTypeLabel('BURN'), 'Burn');
});

test('confidenceLabel: bands map correctly', () => {
  assert.equal(confidenceLabel(0.9), 'High');
  assert.equal(confidenceLabel(0.8), 'Moderate');
  assert.equal(confidenceLabel(0.5), 'Low');
});

test('formatRelative: same-day is Today, one day back is Yesterday', () => {
  const now = new Date('2026-08-07T12:00:00Z').getTime();
  assert.equal(formatRelative('2026-08-07T09:00:00Z', now), 'Today');
  assert.equal(formatRelative('2026-08-06T09:00:00Z', now), 'Yesterday');
});

test('first-aid parity: preserves the original five guide topics', () => {
  const ids = FIRST_AID_GUIDES.map((g) => g.id);
  assert.deepEqual(ids, ['burn', 'wound', 'chemical', 'electrical', 'sunburn']);
});

test('first-aid parity: every guide has bilingual dos, donts and steps', () => {
  for (const g of FIRST_AID_GUIDES) {
    assert.ok(g.dosEn.length > 0 && g.dosBm.length === g.dosEn.length, `${g.id} dos mismatch`);
    assert.ok(g.dontsEn.length > 0 && g.dontsBm.length === g.dontsEn.length, `${g.id} donts mismatch`);
    assert.ok(g.stepsEn.length > 0 && g.stepsBm.length === g.stepsEn.length, `${g.id} steps mismatch`);
  }
});
