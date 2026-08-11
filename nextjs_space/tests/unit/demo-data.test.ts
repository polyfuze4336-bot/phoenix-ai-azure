/**
 * Unit tests — Phoenix AI v2.0 synthetic demo dataset.
 *
 * The v2 experience renders only deterministic, clearly-labelled synthetic data
 * (no real patients). These tests lock in that determinism and the invariants the
 * v2 dashboards/insights rely on. Runs via tsx: npm run test:unit
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDemoCases,
  getDemoCaseById,
  getDashboardStats,
  getCaseTypeDistribution,
  getSeverityDistribution,
  getStatusDistribution,
  getWeeklyVolume,
} from '../../lib/v2/demo-data';

test('demo cases: exactly 42 cases with stable sequential ids', () => {
  const cases = getDemoCases();
  assert.equal(cases.length, 42);
  assert.equal(cases[0].id, 'v2-case-001');
  assert.equal(cases[41].id, 'v2-case-042');
});

test('demo cases: ids are unique', () => {
  const cases = getDemoCases();
  const ids = new Set(cases.map((c) => c.id));
  assert.equal(ids.size, cases.length);
});

test('demo cases: deterministic across repeated calls', () => {
  const a = getDemoCases();
  const b = getDemoCases();
  assert.deepEqual(
    a.map((c) => ({ id: c.id, type: c.caseType, status: c.status, sev: c.severity })),
    b.map((c) => ({ id: c.id, type: c.caseType, status: c.status, sev: c.severity })),
  );
});

test('getDemoCaseById: resolves a known id and rejects an unknown one', () => {
  assert.ok(getDemoCaseById('v2-case-001'));
  assert.equal(getDemoCaseById('does-not-exist'), undefined);
});

test('dashboard stats: status counts partition the full caseload', () => {
  const s = getDashboardStats();
  const cases = getDemoCases();
  assert.equal(s.totalCases, cases.length);
  assert.equal(s.activeCases + s.monitoring + s.referred + s.healed, cases.length);
});

test('dashboard stats: confidence is a fraction in [0,1]', () => {
  const s = getDashboardStats();
  assert.ok(s.avgConfidence >= 0 && s.avgConfidence <= 1);
});

test('case-type distribution: values sum to the total caseload', () => {
  const total = getCaseTypeDistribution().reduce((sum, d) => sum + d.value, 0);
  assert.equal(total, getDemoCases().length);
});

test('severity distribution: 4 buckets summing to the total caseload', () => {
  const dist = getSeverityDistribution();
  assert.equal(dist.length, 4);
  assert.equal(dist.reduce((s, d) => s + d.value, 0), getDemoCases().length);
});

test('status distribution: 4 buckets summing to the total caseload', () => {
  const dist = getStatusDistribution();
  assert.equal(dist.length, 4);
  assert.equal(dist.reduce((s, d) => s + d.value, 0), getDemoCases().length);
});

test('weekly volume: 8 weekly buckets with non-negative values', () => {
  const weeks = getWeeklyVolume();
  assert.equal(weeks.length, 8);
  for (const w of weeks) assert.ok(w.value >= 0);
});
