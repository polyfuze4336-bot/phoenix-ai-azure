# CHANGE-20260812: align PostgreSQL default major version to 16

- **Date:** 2026-08-12
- **Author:** Copilot Task Agent
- **Related ADR:** None
- **Architecture version:** 2.2.1 -> 2.3.0
- **Impact level:** LOW

## Summary
Aligned infrastructure defaults to PostgreSQL major version 16 so new deployments match the
existing customer environment baseline and avoid deployment drift from 15→16 mismatches.

## Before
- `infra/modules/postgresql.bicep` defaulted `postgresVersion` to `15`.
- `infra/main.bicep` did not expose a top-level PostgreSQL version parameter.
- Architecture docs/inventories/diagrams described PostgreSQL without the explicit v16 baseline.

## After
- `infra/modules/postgresql.bicep` now defaults `postgresVersion` to `16`.
- `infra/main.bicep` now exposes `postgresVersion` (default `16`) and passes it to the PostgreSQL module.
- `infra/main.bicepparam` now pins `postgresVersion = '16'`.
- Architecture artifacts now state PostgreSQL Flexible Server v16 as the default baseline.

## Components affected
- Changed: `DB-POSTGRES`, `INFRA-POSTGRES`, `INFRA-BICEP`

## Integrations affected
- Changed: `INT-APP-POSTGRES` (baseline version annotation only; protocol/auth/data unchanged)

## Diagrams updated
- `docs/architecture/diagrams/current-architecture.mmd`
- `docs/architecture/diagrams/current-deployment.mmd`
- `docs/architecture/diagrams/current-data-flow.mmd`

## Validation
- `az bicep build --file infra/main.bicep`
- `node nextjs_space/scripts/validate-architecture.mjs`
- `npm run build` (nextjs_space)
