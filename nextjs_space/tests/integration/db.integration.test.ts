/**
 * Database (PostgreSQL) integration test.
 *
 * Two layers:
 *   1. Pure, always-run assertions on `buildDatasourceUrl` — the TLS + connection-pool
 *      hardening applied to every DATABASE_URL. No database required.
 *   2. Live data-layer assertions (readiness + idempotent upsert) that run ONLY when
 *      DATABASE_URL is configured. When there is no database URL the live tests are not
 *      registered — this reflects the absence of an external resource, NOT a broken
 *      workflow, and the pure layer still exercises the code path.
 *
 * The live layer is non-destructive: it upserts a single clearly-marked
 * `seed-selftest-*` demonstration row and never deletes anything.
 *
 * Runs under: npm run test:integration  (tsx --test)
 */

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma, checkDatabaseReady, withDbRetry, buildDatasourceUrl } from '../../lib/db';

test('buildDatasourceUrl adds sslmode=require and pool defaults', () => {
  const out = buildDatasourceUrl('postgresql://user:pass@host:5432/phoenix');
  assert.ok(out);
  const url = new URL(out!);
  assert.equal(url.searchParams.get('sslmode'), 'require');
  assert.equal(url.searchParams.get('connection_limit'), '5');
  assert.equal(url.searchParams.get('pool_timeout'), '15');
  assert.equal(url.searchParams.get('connect_timeout'), '15');
});

test('buildDatasourceUrl preserves explicit query settings', () => {
  const out = buildDatasourceUrl('postgresql://u:p@h:5432/db?sslmode=verify-full&connection_limit=20');
  assert.ok(out);
  const url = new URL(out!);
  assert.equal(url.searchParams.get('sslmode'), 'verify-full', 'explicit sslmode is not clobbered');
  assert.equal(url.searchParams.get('connection_limit'), '20', 'explicit pool size is not clobbered');
});

test('buildDatasourceUrl passes through undefined and unparseable input', () => {
  assert.equal(buildDatasourceUrl(undefined), undefined);
  assert.equal(buildDatasourceUrl('not-a-url'), 'not-a-url');
});

// --- Live database layer (only when DATABASE_URL is configured) ---------------
if (process.env.DATABASE_URL) {
  test('live database is ready (checkDatabaseReady)', async () => {
    const readiness = await checkDatabaseReady();
    assert.ok(readiness.ok, `database not ready: ${readiness.error ?? 'unknown error'}`);
  });

  test('seed upsert is idempotent (non-destructive self-test row)', async () => {
    const id = 'seed-selftest-article';
    const payload = {
      titleEn: '[DEMO] Integration self-test',
      titleBm: '[DEMO] Ujian integrasi',
      contentEn: 'Fictional self-test row created by the integration test.',
      contentBm: 'Baris ujian rekaan yang dicipta oleh ujian integrasi.',
      summaryEn: 'Self-test row.',
      summaryBm: 'Baris ujian.',
      category: 'selftest',
      published: false,
    };
    await withDbRetry(() => prisma.article.upsert({ where: { id }, update: payload, create: { id, ...payload } }));
    await withDbRetry(() => prisma.article.upsert({ where: { id }, update: payload, create: { id, ...payload } }));
    const count = await withDbRetry(() => prisma.article.count({ where: { id } }));
    assert.equal(count, 1, 'upsert should be idempotent (exactly one row expected)');
  });

  after(async () => {
    await prisma.$disconnect();
  });
}
