/**
 * Unit tests — database seed-data mappings (Prisma model field shape).
 * Tests the pure demo-data builders (scripts/seed-data.ts) without a database.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDemoCases,
  DEMO_ARTICLES,
  CASE_TYPES,
  SEVERITIES,
  REGIONS,
  AGE_GROUPS,
  OUTCOMES,
  BURN_DEGREES,
} from '../../scripts/seed-data';

test('buildDemoCases: produces 48 deterministic rows with stable ids', () => {
  const a = buildDemoCases();
  const b = buildDemoCases();
  assert.equal(a.length, 48);
  assert.deepEqual(a, b, 'seed builder must be deterministic/idempotent');
  assert.equal(a[0].id, 'seed-case-0001');
  assert.equal(a[47].id, 'seed-case-0048');
  assert.ok(a.every((c) => /^seed-case-\d{4}$/.test(c.id)));
});

test('buildDemoCases: enum fields only use allowed values', () => {
  for (const c of buildDemoCases()) {
    assert.ok((CASE_TYPES as readonly string[]).includes(c.caseType), c.caseType);
    assert.ok((SEVERITIES as readonly string[]).includes(c.severity), c.severity);
    assert.ok((REGIONS as readonly string[]).includes(c.bodyRegion), c.bodyRegion);
    assert.ok((AGE_GROUPS as readonly string[]).includes(c.ageGroup), c.ageGroup);
    assert.ok((OUTCOMES as readonly string[]).includes(c.outcome), c.outcome);
  }
});

test('buildDemoCases: burn-only fields are null for non-burn cases', () => {
  for (const c of buildDemoCases()) {
    if (c.caseType === 'BURN') {
      assert.notEqual(c.burnDegree, null);
      assert.ok((BURN_DEGREES as readonly string[]).includes(c.burnDegree as string));
      assert.equal(typeof c.tbsaPercent, 'number');
      assert.ok((c.tbsaPercent as number) > 0);
    } else {
      assert.equal(c.burnDegree, null);
      assert.equal(c.tbsaPercent, null);
    }
  }
});

test('buildDemoCases: confidence stays within 0.70..0.94', () => {
  for (const c of buildDemoCases()) {
    assert.ok(c.confidence >= 0.7 && c.confidence <= 0.94, String(c.confidence));
  }
});

test('DEMO_ARTICLES: 5 bilingual articles with stable ids and valid categories', () => {
  assert.equal(DEMO_ARTICLES.length, 5);
  const categories = new Set(['prevention', 'wound_care', 'nutrition', 'infection']);
  DEMO_ARTICLES.forEach((a, i) => {
    assert.equal(a.id, `seed-article-${i + 1}`);
    assert.ok(categories.has(a.category), a.category);
    // Both languages present and non-empty for every rendered field.
    for (const field of ['titleEn', 'titleBm', 'summaryEn', 'summaryBm', 'contentEn', 'contentBm'] as const) {
      assert.equal(typeof a[field], 'string');
      assert.ok(a[field].length > 0, `${a.id}.${field} must be non-empty`);
    }
    assert.notEqual(a.titleEn, a.titleBm, 'title should be translated');
  });
});
