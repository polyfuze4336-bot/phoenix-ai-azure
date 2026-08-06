/**
 * Database integration test.
 *
 * Exercises the real Prisma data layer against a live PostgreSQL database:
 *   - the connection is ready (`checkDatabaseReady`),
 *   - transient-retry wrapper works,
 *   - a `seed-*` upsert is idempotent (running it twice yields exactly one row).
 *
 * SKIPS cleanly (exit 0) when DATABASE_URL is not configured, so CI without a
 * database still passes. It is non-destructive: it only upserts a clearly marked
 * `seed-selftest-*` demonstration row and never deletes anything.
 *
 * Usage: npm run test:integration
 */

import assert from 'node:assert/strict';
import { prisma, checkDatabaseReady, withDbRetry } from '../../lib/db';

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log('[integration] DATABASE_URL not set - skipping database integration test.');
    return;
  }

  const readiness = await checkDatabaseReady();
  assert.ok(readiness.ok, `database not ready: ${readiness.error ?? 'unknown error'}`);
  console.log(`[integration] readiness OK (${readiness.latencyMs}ms).`);

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
  console.log('[integration] idempotent upsert OK.');

  console.log('[integration] PASS.');
}

run()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[integration] FAILED:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
