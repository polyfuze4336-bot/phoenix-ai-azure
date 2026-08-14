# CHANGE-20260814: PostgreSQL supported major version baseline

- **Date:** 2026-08-14
- **Author:** Phoenix AI migration team
- **Related ADR:** None; compatibility remediation within existing `INFRA-POSTGRES` component
- **Architecture version:** 2.4.0 -> 2.5.0
- **Impact level:** LOW
- **Status:** COMPLETE

## Summary

Fix deployment failures in GitHub Actions (`Provision, deploy & promote`) by updating the PostgreSQL
Flexible Server major-version baseline in `infra/modules/postgresql.bicep` from unsupported `15` to
supported values (`17`/`18`, default `17`) for API version `2024-08-01`.

## Components and integrations

| ID | Change |
| --- | --- |
| INFRA-POSTGRES | Major-version parameter constrained to supported values; default updated to `17` |
| DEVOPS-GHA | Existing deployment workflow now provisions infrastructure without PostgreSQL version validation failure |
| INT-GHA-AZURE | Existing ARM/Bicep deployment path no longer sends an out-of-range PostgreSQL major version |

## Responsible AI impact

NONE. This change does not alter models, prompts, inference behavior, confidence/limitation handling,
human oversight, telemetry semantics, or any RAI control status.

## Validation

- PASS: Failing GitHub Actions job logs (`94709419204`) show root cause
  `ParameterOutOfRange: The value of the 'Version' should be in: [17,18]`.
- PASS: Bicep now enforces allowed PostgreSQL versions (`17`, `18`) and defaults to `17`.
- PASS: `az bicep build --file infra/main.bicep` succeeds after the change.
- PASS: `node nextjs_space/scripts/validate-architecture.mjs` reports no drift.
