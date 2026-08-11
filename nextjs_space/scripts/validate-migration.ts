/**
 * Migration validation (offline-safe).
 *
 * Validates the committed Prisma migrations WITHOUT needing a live database, so it
 * can run on every pull request:
 *   1. `prisma/migrations/migration_lock.toml` exists and targets postgresql.
 *   2. At least one migration directory with a non-empty `migration.sql` exists.
 *   3. `prisma validate` passes (schema is well-formed).
 *
 * Full drift detection against the target/shadow database happens in the
 * controlled deploy step via `prisma migrate status`.
 *
 * Usage: npm run db:migrate:validate
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function fail(message: string): never {
  console.error(`[validate-migration] FAIL: ${message}`);
  process.exit(1);
}

const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations');
if (!fs.existsSync(migrationsDir)) fail('prisma/migrations directory is missing.');

const lockFile = path.join(migrationsDir, 'migration_lock.toml');
if (!fs.existsSync(lockFile)) fail('prisma/migrations/migration_lock.toml is missing.');
if (!/provider\s*=\s*"postgresql"/.test(fs.readFileSync(lockFile, 'utf-8'))) {
  fail('migration_lock.toml provider is not "postgresql".');
}

const migrationDirs = fs
  .readdirSync(migrationsDir)
  .filter((entry) => fs.statSync(path.join(migrationsDir, entry)).isDirectory());
if (migrationDirs.length === 0) fail('No migration directories found.');

for (const dir of migrationDirs) {
  const sqlPath = path.join(migrationsDir, dir, 'migration.sql');
  if (!fs.existsSync(sqlPath) || fs.readFileSync(sqlPath, 'utf-8').trim() === '') {
    fail(`Missing or empty migration.sql in ${dir}.`);
  }
}

// `prisma validate` needs the env var to be *present* (it does not connect here).
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db?schema=public&sslmode=require';
}

try {
  execSync('npx prisma validate', { stdio: 'inherit' });
} catch {
  fail('prisma validate failed.');
}

console.log(`[validate-migration] OK: ${migrationDirs.length} migration(s) validated.`);
