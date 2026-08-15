# CHANGE-20260815: Restore Original-only Phoenix AI

- **Architecture version:** 2.5.0 -> 3.0.0
- **Impact level:** HIGH
- **ADR:** [ADR-0010](../decisions/ADR-0010-restore-original-only-experience.md)
- **Azure resource impact:** NONE
- **Responsible AI impact:** Product assurance page retired with v2; code/test/document evidence remains

## Before

`/` rendered v2, `/v2/*` was published, and `/community/image-check` was absent. Azure ran commit
`f050416` while all recovery history remained in Git.

## After

`/` renders the Original landing, Original HCP and Community journeys are active, and
`/community/image-check` is restored. v2 runtime routes are retired. Container Apps, ACR, Azure AI,
PostgreSQL, Blob Storage, Key Vault, managed identity, telemetry, and OIDC deployment are unchanged.

## Evidence And Rollback

See `docs/migration/rollback-assessment.md`. Previous code is preserved at
`backup/pre-rollback-20260815` and `pre-rollback-20260815`.

## Validation

- `npm ci` documented pre-existing peer-resolution failure; `npm ci --legacy-peer-deps` passed.
- Baseline build and typecheck passed.
- Public smoke and HCP/community journey suites passed.
- 68 visual captures passed; two known Recharts timing differences remained documented exceptions.