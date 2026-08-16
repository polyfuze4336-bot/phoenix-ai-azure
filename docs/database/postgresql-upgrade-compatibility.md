# PostgreSQL Upgrade Compatibility

## Outcome

**Upgrade compatibility gate: NOT REQUIRED.** The deployed server is PostgreSQL 17.10, so the exact
decision rule requires no major-version upgrade. This report records the inspected compatibility
surface for future reference; it does not authorize an upgrade to PostgreSQL 18.

## Application and Client

| Area | Finding |
| --- | --- |
| ORM | Prisma Client and CLI `6.7.0` |
| Node PostgreSQL client | No direct `pg` dependency; Prisma owns the PostgreSQL wire client |
| Connection | TLS with `sslmode=require`; bounded Prisma pool settings in `lib/db.ts` |
| Raw SQL | One parameterized Prisma tagged query, `SELECT 1`, for readiness |
| Migration command | `prisma migrate deploy`; no reset/drop/recreate command in deployment |

## Schema and Migration Surface

- Two finished migrations: `20260806120000_init` and `20260807090000_analysis_records`.
- Five tables: `AnalysisRecord`, `Article`, `Case`, `ChatMessage`, `_prisma_migrations`.
- Standard PostgreSQL types only: `TEXT`, `DOUBLE PRECISION`, `BOOLEAN`, `TIMESTAMP(3)`, and one
  `JSONB` result column.
- Application identifiers are CUID text values; there is no PostgreSQL UUID type or UUID extension.
- Eleven ordinary B-tree primary/secondary indexes.
- No sequences, triggers, user views, user routines, full-text search, GIN/GiST indexes, or custom
  PostgreSQL types.
- The only installed extension is built-in `plpgsql 1.0`, already running on PostgreSQL 17.10.

## Compatibility Result

No incompatibility exists with the current PostgreSQL 17.10 deployment. An Azure target-version
extension-matrix check and major-version precheck are intentionally not run because there is no
target upgrade. Any future PostgreSQL 18 proposal must repeat the live extension/object audit,
confirm Azure regional support, perform PITR restore testing, run Azure prechecks, and pass full
application/data-integrity validation before touching this server.