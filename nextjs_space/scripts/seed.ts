/**
 * Phoenix AI - database seed.
 *
 * =====================================================================
 *  FICTIONAL DEMONSTRATION DATA ONLY.
 *  - Idempotent: every row is written with `upsert` keyed on a stable
 *    `seed-*` id, so re-running never duplicates and never mutates real data.
 *  - Non-destructive: this script performs upserts only (no destructive ops).
 *  - Fictional: no real patients, no patient-identifiable information.
 *  - Clearly marked: case ids are prefixed `seed-case-*`, article ids
 *    `seed-article-*`, and each demonstration case carries a `[DEMO]` marker
 *    in its free-text fields.
 *  - Purpose: representative rows for the HCP analytics dashboard and the
 *    community education articles list.
 * =====================================================================
 *
 * Runs through `scripts/safe-seed.ts` (guard) via `npm run db:seed`.
 */

import { prisma } from '../lib/db';
import { buildDemoCases, DEMO_ARTICLES } from './seed-data';

async function main() {
  console.log('[seed] Phoenix AI - seeding FICTIONAL DEMONSTRATION data (idempotent, non-destructive).');

  const cases = buildDemoCases();
  for (const c of cases) {
    const { id, ...data } = c;
    await prisma.case.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  console.log(`[seed] Cases upserted: ${cases.length} (ids seed-case-0001..).`);

  for (const a of DEMO_ARTICLES) {
    const { id, ...data } = a;
    await prisma.article.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  console.log(`[seed] Articles upserted: ${DEMO_ARTICLES.length} (ids seed-article-1..).`);

  console.log('[seed] Done. All rows are demonstration data and safe to re-run.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[seed] FAILED:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
