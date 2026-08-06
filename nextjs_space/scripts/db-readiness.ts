/**
 * Database readiness check (CLI).
 *
 * Verifies the app can reach Azure Database for PostgreSQL Flexible Server before
 * a deployment applies migrations or before traffic is shifted. Exits 0 when the
 * database is reachable, 1 otherwise. Intended for CI/CD gates and local checks.
 *
 * Usage: npm run db:readiness
 */

import { checkDatabaseReady, prisma } from '../lib/db';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[db-readiness] DATABASE_URL is not set. Configure it before checking readiness.');
    process.exit(1);
  }

  const readiness = await checkDatabaseReady();
  console.log(
    JSON.stringify({ status: readiness.ok ? 'ready' : 'unavailable', ...readiness }),
  );

  await prisma.$disconnect();
  process.exit(readiness.ok ? 0 : 1);
}

main().catch(async (err) => {
  console.error('[db-readiness] FAILED:', err);
  await prisma.$disconnect();
  process.exit(1);
});
