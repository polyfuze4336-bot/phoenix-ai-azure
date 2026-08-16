# Phoenix AI — PostgreSQL data model

Phoenix AI persists to **Azure Database for PostgreSQL Flexible Server** via Prisma.
This document describes the schema, connection configuration, migration workflow, and
seed data.

> **Live baseline (2026-08-16):** PostgreSQL `17.10`, database `phoenix`, verified by the
> read-only [PostgreSQL version audit](../database/postgresql-version-audit.md). The deployed major
> version already matches Bicep, so no upgrade is required.

> Parity note: the database layer is provisioned and seeded, but the visible UI
> (HCP dashboard, community articles) still renders the original in-app demonstration
> content. The seed makes matching data available for a future wiring step without
> changing what users currently see.

## Connection

- **Datasource:** `provider = "postgresql"`, `url = env("DATABASE_URL")` (see
  [nextjs_space/prisma/schema.prisma](../../nextjs_space/prisma/schema.prisma)).
- **DATABASE_URL** is **server-only** and must never reach the browser. On Azure it is
  supplied through App Service / Container Apps app settings sourced from Key Vault.
- **Format** (TLS required by Azure):
  ```
  postgresql://<user>:<password>@<server>.postgres.database.azure.com:5432/phoenix?sslmode=require
  ```
- **Automatic hardening** in [nextjs_space/lib/db.ts](../../nextjs_space/lib/db.ts): if the
  connection string omits them, the client appends:
  - `sslmode=require` — enforce TLS.
  - `connection_limit=5` — modest pool suited to App Service / Container Apps sharing a
    Flexible Server (Burstable tiers have low `max_connections`).
  - `pool_timeout=15`, `connect_timeout=15` — bounded waits.
  Override any of these by specifying them explicitly in `DATABASE_URL`.
- **Transient-failure retry:** `withDbRetry()` retries connection blips (Prisma
  `P1001/P1002/P1008/P1017`, `PrismaClientInitializationError`, and
  `ECONNRESET/ETIMEDOUT/ECONNREFUSED/Connection terminated/server closed`) with
  exponential backoff + jitter. Non-transient errors are rethrown immediately.
- **Pooler (optional):** when routing through PgBouncer, point `DATABASE_URL` at the
  pooler with `?pgbouncer=true` and set `DIRECT_DATABASE_URL` to the direct endpoint for
  migrations. Not required for the default Flexible Server setup.

## Health & readiness

| Endpoint | Purpose | Success | Failure |
| --- | --- | --- | --- |
| `GET /api/health` | Liveness (process up, no DB) | `200 {"status":"ok"}` | — |
| `GET /api/health/db` | DB readiness (`SELECT 1`) | `200 {"status":"ready"}` | `503 {"status":"unavailable"}` |

Both routes run on the Node.js runtime and are never cached. `checkDatabaseReady()` also
returns latency for observability.

CLI equivalent for deploy gates: `npm run db:readiness` (exit 0 = ready, 1 = not).

## Tables

There are no foreign-key relations between tables; each is queried independently.

### `Case`

Per-assessment analytics rows powering the HCP dashboard aggregates.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `TEXT` PK | cuid in app; `seed-case-*` for demo rows |
| `caseType` | `TEXT` NOT NULL | `BURN`, `DIABETIC_ULCER`, `PRESSURE_ULCER`, `TRAUMATIC_WOUND`, `SURGICAL_WOUND` |
| `burnDegree` | `TEXT` NULL | `1ST`, `2ND_SUPERFICIAL`, `2ND_DEEP`, `3RD`, `4TH` (burns only) |
| `severity` | `TEXT` NOT NULL | `MILD`, `MODERATE`, `SEVERE`, `CRITICAL` |
| `tbsaPercent` | `DOUBLE PRECISION` NULL | Total body surface area (burns) |
| `bodyRegion` | `TEXT` NULL | `Head/Neck`, `Trunk`, `Upper Limb`, `Lower Limb`, `Perineum` |
| `confidence` | `DOUBLE PRECISION` NULL | Model confidence 0–1 |
| `ageGroup` | `TEXT` NULL | `0-5`, `6-12`, `13-18`, `19-40`, `41-60`, `60+` |
| `outcome` | `TEXT` NULL | `HEALED`, `ONGOING`, `REFERRED`, `COMPLICATED` |
| `characteristics` | `TEXT` NULL | Free text |
| `recommendations` | `TEXT` NULL | Free text |
| `imageKey` | `TEXT` NULL | Object-storage key (unused at runtime today) |
| `createdAt` | `TIMESTAMP(3)` NOT NULL | default `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` NOT NULL | `@updatedAt` |

Indexes: `Case_caseType_idx(caseType)`, `Case_createdAt_idx(createdAt)`.

### `ChatMessage`

Conversation turns for the HCP and community chat portals. Defined for parity; **not
seeded** (no conversational content is stored by the seed).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `TEXT` PK | |
| `portal` | `TEXT` NOT NULL | `hcp` / `community` |
| `role` | `TEXT` NOT NULL | `user` / `assistant` |
| `content` | `TEXT` NOT NULL | |
| `imageKey` | `TEXT` NULL | |
| `sessionId` | `TEXT` NOT NULL | |
| `createdAt` | `TIMESTAMP(3)` NOT NULL | default `CURRENT_TIMESTAMP` |

Indexes: `ChatMessage_sessionId_idx(sessionId)`, `ChatMessage_portal_idx(portal)`.

### `AnalysisRecord`

Persisted HCP AI wound-analysis results for authorized history access. The structured assessment is
stored as JSONB; summary fields support list rendering without reading the full result.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `TEXT` PK | cuid generated in app |
| `clinicianName` / `clinicianEmail` | `TEXT` NULL | authorized clinical context |
| `imageKey` / `imageMimeType` | `TEXT` NULL | private image reference and media type |
| `woundCategory` / `woundType` | `TEXT` NULL | analysis summary |
| `burnDegree` / `severity` | `TEXT` NULL | analysis summary |
| `confidence` / `tbsaEstimate` | `TEXT` NULL | display-form summary values |
| `isBurn` | `BOOLEAN` NOT NULL | default `false` |
| `result` | `JSONB` NOT NULL | complete structured assessment |
| `createdAt` | `TIMESTAMP(3)` NOT NULL | default `CURRENT_TIMESTAMP` |

Index: `AnalysisRecord_createdAt_idx(createdAt)`.

### `Article`

Bilingual community education articles.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `TEXT` PK | `seed-article-*` for demo rows |
| `titleEn` / `titleBm` | `TEXT` NOT NULL | English / Bahasa Melayu title |
| `contentEn` / `contentBm` | `TEXT` NOT NULL | Body |
| `summaryEn` / `summaryBm` | `TEXT` NOT NULL | Summary |
| `category` | `TEXT` NOT NULL | `prevention`, `wound_care`, `nutrition`, `infection` |
| `imageUrl` | `TEXT` NULL | |
| `published` | `BOOLEAN` NOT NULL | default `true` |
| `createdAt` | `TIMESTAMP(3)` NOT NULL | default `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` NOT NULL | `@updatedAt` |

Index: `Article_category_idx(category)`.

## Migrations

- Initial migration:
  [nextjs_space/prisma/migrations/20260806120000_init/migration.sql](../../nextjs_space/prisma/migrations/20260806120000_init/migration.sql).
- Analysis history migration:
  [nextjs_space/prisma/migrations/20260807090000_analysis_records/migration.sql](../../nextjs_space/prisma/migrations/20260807090000_analysis_records/migration.sql).
- **Validation:** the direct-main deployment generates Prisma Client, typechecks, runs fast unit
  tests, and produces a Next.js production build before Azure deployment.
- **Execution (controlled):** on pushes to `main`,
  [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) runs database readiness and
  `npm run db:migrate:deploy` (`prisma migrate deploy`) when `DATABASE_URL` is configured. Rollback
  dispatches explicitly skip migrations. The command applies only pending migrations and **never**
  resets or drops data.
- Destructive migrations are never run automatically in production.

## Verified deployed baseline

The 2026-08-16 read-only audit found five tables, eleven indexes, no sequences/triggers/user views/
user routines, and both committed Prisma migrations finished successfully. Exact row counts were:
`AnalysisRecord=11`, `Article=0`, `Case=0`, `ChatMessage=0`, `_prisma_migrations=2`. No record content
was selected. See the [data-integrity check](../database/postgresql-data-integrity-check.md) and
[upgrade compatibility report](../database/postgresql-upgrade-compatibility.md).

## Seed data

`npm run db:seed` runs the guard
[scripts/safe-seed.ts](../../nextjs_space/scripts/safe-seed.ts) (which aborts if
[scripts/seed.ts](../../nextjs_space/scripts/seed.ts) contains any delete / truncate / drop
/ raw-SQL operation), then the seed itself. The seed is:

- **Idempotent** — every row is written with `upsert` keyed on a stable `seed-*` id; re-runs
  never duplicate rows.
- **Fictional** — no real patients, no patient-identifiable data.
- **Non-destructive** — upserts only; no deletes/truncates.
- **Clearly marked** — `seed-case-*` / `seed-article-*` ids; each demo `Case` carries a
  `[DEMO]` marker in its free-text fields.

Contents:

| Data | Rows | Mirrors |
| --- | --- | --- |
| `Case` | 48 (deterministic) | HCP dashboard aggregates ([app/hcp/_components/dashboard-charts.tsx](../../nextjs_space/app/hcp/_components/dashboard-charts.tsx)) |
| `Article` | 5 (`seed-article-1..5`) | Community articles ([app/community/articles/_components/articles-client.tsx](../../nextjs_space/app/community/articles/_components/articles-client.tsx)) |
| `ChatMessage` | 0 | not seeded |

Article seed copy is kept verbatim to the existing in-app content so the visible text is
unchanged if the UI is later wired to the database.

## Integration test

`npm run test:integration`
([tests/integration/db.integration.test.ts](../../nextjs_space/tests/integration/db.integration.test.ts))
asserts readiness and idempotent upsert against a live database. It **skips** (exit 0) when
`DATABASE_URL` is unset, so CI without a database still passes.
