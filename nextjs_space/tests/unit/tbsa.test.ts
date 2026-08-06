/**
 * Unit tests — TBSA (Total Body Surface Area) calculation, Lund & Browder chart.
 * Pure logic extracted from the TBSA calculator UI (lib/clinical/tbsa.ts).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMaxForRegion,
  getSeverity,
  formatFraction,
  round1,
  computeTbsaBreakdown,
  REGION_KEYS,
  type Counts,
} from '../../lib/clinical/tbsa';

function emptyCounts(): Counts {
  return { total: {}, ptl: {}, ftl: {} };
}

test('getMaxForRegion: head doubles the ½-head area (adult 3.5 -> 7)', () => {
  assert.equal(getMaxForRegion('head', 'adult'), 7);
  assert.equal(getMaxForRegion('head', '0'), 19); // 9.5 * 2
});

test('getMaxForRegion: leg = thigh*2 + lowerLeg*2 + 3.5 (adult -> 20.0)', () => {
  // adult: thigh 4.75, lowerLeg 3.5 => 9.5 + 7 + 3.5 = 20
  assert.equal(getMaxForRegion('rightLeg', 'adult'), 20);
  assert.equal(getMaxForRegion('leftLeg', 'adult'), 20);
});

test('getMaxForRegion: fixed regions are age-independent', () => {
  assert.equal(getMaxForRegion('antTrunk', 'adult'), 13);
  assert.equal(getMaxForRegion('antTrunk', '0'), 13);
  assert.equal(getMaxForRegion('neck', 'adult'), 2);
  assert.equal(getMaxForRegion('genitalia', 'adult'), 1);
});

test('getMaxForRegion: paediatric head is larger than adult head', () => {
  assert.ok(getMaxForRegion('head', '0') > getMaxForRegion('head', 'adult'));
});

test('getSeverity: banding boundaries', () => {
  assert.equal(getSeverity(0).label, 'Minor (<10%)');
  assert.equal(getSeverity(9.9).label, 'Minor (<10%)');
  assert.equal(getSeverity(10).label, 'Moderate (10-20%)');
  assert.equal(getSeverity(20).label, 'Moderate (10-20%)');
  assert.equal(getSeverity(20.1).label, 'Major (20-40%)');
  assert.equal(getSeverity(40).label, 'Major (20-40%)');
  assert.equal(getSeverity(40.1).label, 'Critical (>40%)');
});

test('formatFraction: whole numbers and quarters', () => {
  assert.equal(formatFraction(3), '3');
  assert.equal(formatFraction(0.25), '¼');
  assert.equal(formatFraction(0.5), '½');
  assert.equal(formatFraction(0.75), '¾');
  assert.equal(formatFraction(3.5), '3½');
  assert.equal(formatFraction(7.25), '7¼');
  assert.equal(formatFraction(2.75), '2¾');
});

test('round1: rounds to one decimal place', () => {
  assert.equal(round1(1.24), 1.2);
  assert.equal(round1(1.25), 1.3);
  assert.equal(round1(10), 10);
});

test('computeTbsaBreakdown: empty counts -> all zero', () => {
  const b = computeTbsaBreakdown(emptyCounts(), emptyCounts(), 'adult');
  assert.equal(b.total, 0);
  assert.equal(b.ptlTotal, 0);
  assert.equal(b.ftlTotal, 0);
  assert.equal(b.rows.length, REGION_KEYS.length);
  assert.ok(b.rows.every((r) => r.ptlPct === 0 && r.ftlPct === 0));
});

test('computeTbsaBreakdown: fully partial-thickness region scales to region max', () => {
  const ant = emptyCounts();
  // Entire anterior trunk painted, all partial-thickness.
  ant.total.antTrunk = 100;
  ant.ptl.antTrunk = 100;
  ant.ftl.antTrunk = 0;
  const b = computeTbsaBreakdown(ant, emptyCounts(), 'adult');
  const row = b.rows.find((r) => r.region === 'antTrunk')!;
  assert.equal(row.ptlPct, 13); // full region -> max 13
  assert.equal(row.ftlPct, 0);
  assert.equal(b.ptlTotal, 13);
  assert.equal(b.total, 13);
});

test('computeTbsaBreakdown: half partial / half full splits the region max', () => {
  const ant = emptyCounts();
  ant.total.antTrunk = 100;
  ant.ptl.antTrunk = 50;
  ant.ftl.antTrunk = 50;
  const b = computeTbsaBreakdown(ant, emptyCounts(), 'adult');
  const row = b.rows.find((r) => r.region === 'antTrunk')!;
  assert.equal(row.ptlPct, 6.5);
  assert.equal(row.ftlPct, 6.5);
  assert.equal(b.total, 13);
});

test('computeTbsaBreakdown: anterior + posterior counts are summed per region', () => {
  const ant = emptyCounts();
  const post = emptyCounts();
  ant.total.head = 50;
  ant.ptl.head = 50;
  post.total.head = 50;
  post.ftl.head = 50;
  // head adult max = 7; ratio ptl 50/100 -> 3.5, ftl 50/100 -> 3.5
  const b = computeTbsaBreakdown(ant, post, 'adult');
  const row = b.rows.find((r) => r.region === 'head')!;
  assert.equal(row.ptlPct, 3.5);
  assert.equal(row.ftlPct, 3.5);
  assert.equal(b.total, 7);
});
