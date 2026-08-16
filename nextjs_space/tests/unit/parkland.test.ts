/**
 * Unit tests — Parkland / Modified Brooke fluid-resuscitation calculation.
 *
 * Runs under the Node.js built-in test runner via tsx (no browser needed):
 *   npm run test:unit
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateResuscitation,
  determineParklandIndication,
  type PatientCategory,
} from '../../lib/clinical/parkland';

function indication(tbsaPercent: number, patientCategory?: PatientCategory, isBurn = true) {
  return determineParklandIndication({ isBurn, tbsaPercent, patientCategory }).indicated;
}

test('adult Parkland indication starts at exactly 15% TBSA', () => {
  assert.equal(indication(14.9, 'adult'), 'no');
  assert.equal(indication(15.0, 'adult'), 'yes');
  assert.equal(indication(15.1, 'adult'), 'yes');
});

test('child Parkland indication starts at exactly 10% TBSA', () => {
  assert.equal(indication(9.9, 'child'), 'no');
  assert.equal(indication(10.0, 'child'), 'yes');
  assert.equal(indication(10.1, 'child'), 'yes');
});

test('Parkland indication is no for a non-burn or zero TBSA', () => {
  assert.equal(indication(20, 'adult', false), 'no');
  assert.equal(indication(0, 'child'), 'no');
});

test('Parkland indication is uncertain without an adult/child category', () => {
  assert.equal(indication(20), 'uncertain');
});

test('Parkland: total 24h = 4 x weight x TBSA', () => {
  const r = calculateResuscitation({ weightKg: 70, tbsaPercent: 25, formula: 'parkland' });
  assert.ok(r);
  assert.equal(r.total24h, 7000); // 4 * 70 * 25
});

test('Parkland: splits 50/50 across 8h and 16h with correct rates', () => {
  const r = calculateResuscitation({ weightKg: 70, tbsaPercent: 25, formula: 'parkland' })!;
  assert.equal(r.first8h, 3500);
  assert.equal(r.next16h, 3500);
  assert.equal(r.rate8h, 3500 / 8);
  assert.equal(r.rate16h, 3500 / 16);
});

test('Modified Brooke: total 24h = 2 x weight x TBSA', () => {
  const r = calculateResuscitation({ weightKg: 80, tbsaPercent: 30, formula: 'brooke' })!;
  assert.equal(r.total24h, 4800); // 2 * 80 * 30
});

test('Adult urine target is 0.5 mL/kg/hr and isChild is false', () => {
  const r = calculateResuscitation({ weightKg: 70, tbsaPercent: 20, formula: 'parkland' })!;
  assert.equal(r.urineTarget, 35); // 0.5 * 70
  assert.equal(r.isChild, false);
});

test('Child (<30 kg) urine target is 1 mL/kg/hr and isChild is true', () => {
  const r = calculateResuscitation({ weightKg: 20, tbsaPercent: 15, formula: 'parkland' })!;
  assert.equal(r.urineTarget, 20); // 1 * 20
  assert.equal(r.isChild, true);
});

test('30 kg is treated as an adult (boundary is strictly <30)', () => {
  const r = calculateResuscitation({ weightKg: 30, tbsaPercent: 10, formula: 'parkland' })!;
  assert.equal(r.isChild, false);
  assert.equal(r.urineTarget, 15); // 0.5 * 30
});

test('Returns null when weight is zero or negative', () => {
  assert.equal(calculateResuscitation({ weightKg: 0, tbsaPercent: 25, formula: 'parkland' }), null);
  assert.equal(calculateResuscitation({ weightKg: -5, tbsaPercent: 25, formula: 'parkland' }), null);
});

test('Returns null when TBSA is zero or negative', () => {
  assert.equal(calculateResuscitation({ weightKg: 70, tbsaPercent: 0, formula: 'parkland' }), null);
  assert.equal(calculateResuscitation({ weightKg: 70, tbsaPercent: -1, formula: 'parkland' }), null);
});
