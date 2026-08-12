# CHANGE-20260812: align PostgreSQL default major version to platform-supported baseline

- **Date:** 2026-08-12
- **Author:** Copilot Task Agent
- **Related ADR:** None
- **Architecture version:** 2.3.0 -> 2.3.1
- **Impact level:** LOW

## Summary
Aligned infrastructure defaults to PostgreSQL major version 17 to match current Azure deployment
validation constraints (`Version` allowed range `[17,18]`) and remove deployment failures caused
by unsupported 15/16 provisioning requests in this environment.

## Before
- IaC requested unsupported lower major versions for new provisioning in this environment, causing
  deployment failures (`ParameterOutOfRange: Version should be in [17,18]`).
- Architecture docs/inventories/diagrams needed to reflect the deployable baseline.

## After
- `infra/modules/postgresql.bicep` now defaults `postgresVersion` to `17`.
- `infra/main.bicep` exposes `postgresVersion` (default `17`) and passes it to the PostgreSQL module.
- `infra/main.bicepparam` now pins `postgresVersion = '17'`.
- Architecture artifacts now state PostgreSQL Flexible Server v17 as the default baseline.

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
