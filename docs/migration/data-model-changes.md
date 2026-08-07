# Part 13 — Data Model Changes

> Prisma schema and database changes between the original source and the current codebase.
> Evidence: `git show <ref>:nextjs_space/prisma/schema.prisma`, migration files, and live
> readiness (`postgresql=ok, 3 ms`).

## 1. Generator & datasource

| Setting | Original | Current | Change type |
| --- | --- | --- | --- |
| `binaryTargets` | `["native", "linux-musl-arm64-openssl-3.0.x"]` | `["native", "debian-openssl-3.0.x"]` | Modified (App Service Linux arch) |
| `output` | `/home/ubuntu/phoenix_ai/.../.prisma/client` (hardcoded) | default (portable) | Removed hardcoded path |
| `provider` | `postgresql` | `postgresql` | Retained unchanged |
| `url` | `env("DATABASE_URL")` | `env("DATABASE_URL")` (Azure PostgreSQL) | Retained w/ config change |

## 2. Models

| Model | Original | Current | Change type |
| --- | --- | --- | --- |
| `Case` | present | unchanged | Retained unchanged |
| `ChatMessage` | present | unchanged | Retained unchanged |
| `Article` | present | unchanged | Retained unchanged |
| `AnalysisRecord` | — | added | Added |

### `AnalysisRecord` (new)

Backs the post-parity HCP analysis history feature (`/hcp/history`). It persists AI wound/burn
analyses so clinicians can revisit prior assessments. Indexed by `createdAt`. Full column detail:
[docs/data/postgresql-data-model.md](../data/postgresql-data-model.md).

## 3. Migrations

| Migration | Purpose | Change type |
| --- | --- | --- |
| `20260806120000_init` | Creates `Case`, `ChatMessage`, `Article` | Added |
| `20260807090000_analysis_records` | Creates `AnalysisRecord` | Added |
| `migration_lock.toml` | Migration provider lock | Added |

The original source tracked **no** migrations (schema existed but was not deployed).

## 4. Runtime wiring status

| Model | Wired to visible UI? | Notes |
| --- | --- | --- |
| `Case` | No | Retained for parity; dashboards render original demo content |
| `ChatMessage` | No | Retained for parity |
| `Article` | No | Retained for parity |
| `AnalysisRecord` | Yes (partial) | Read/written by the HCP history feature |

This is the **partial persistence** position: the database is provisioned, migrated, and seeded,
and one feature uses it, but most screens still render the original demo/mock content to preserve
parity. See [persistence-gap-assessment.md](persistence-gap-assessment.md).

## 5. Seed & health tooling

| Item | Purpose |
| --- | --- |
| `scripts/seed.ts`, `scripts/seed-data.ts`, `scripts/safe-seed.ts` | Fictional demonstration seed data |
| `scripts/validate-migration.ts`, `scripts/db-readiness.ts` | Migration validation + readiness probe |
| `lib/db.ts` | Azure PostgreSQL client (auto `sslmode=require`, pool defaults) |

## 6. Live evidence

- `/api/health/ready` reports `postgresql=ok` with a 3 ms round-trip against
  `psql-phoenixai-yun55ezsi4yoq`.
- All seed data is fictional; no real patient data is stored.
