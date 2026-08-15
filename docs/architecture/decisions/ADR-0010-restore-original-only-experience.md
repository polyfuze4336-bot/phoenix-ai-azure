# ADR-0010: Restore the Original-only Phoenix AI experience

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** Phoenix AI prototype maintainers
- **Related components:** UI-LANDING, UI-HCP, UI-COMMUNITY, UI-V2-HCP, UI-V2-COMMUNITY, UI-V2-SHELL, LIB-V2
- **Related integrations:** INT-BROWSER-APP, INT-APP-FOUNDRY

## Context

The deployed August 14 change made v2 the public entry and removed the Original community image-check
journey. The prototype owner requires the verified Original Phoenix AI application and explicitly
does not want a redesign. Git and Azure evidence is recorded in
`docs/migration/rollback-assessment.md`.

## Decision

Restore the Original application from deployment-tagged commit `7298f21`, publish `/` as its landing,
restore `/community/image-check`, and retire `/v2/*` from the runtime. Preserve the current Azure
Container Apps deployment, integrations, data, and Git history.

## Alternatives Considered

- Keep the August 14 v2 landing: rejected because it conflicts with the Original-only requirement.
- Restore the latest pre-August-14 deployment `5f065529`: rejected because it had already removed
  `/community/image-check`.
- Rewrite `main` to an old SHA: rejected because it would obscure newer recoverable history.

## Architecture Impact

Architecture version becomes `3.0.0`. v2 UI component IDs become `LEGACY`; no Azure component or
integration is removed. Current architecture and client/AI/data-flow diagrams are updated.

## Security And Operational Impact

No identity, secret, RBAC, database, or network boundary changes. Deployment continues through the
existing GitHub OIDC and Azure Container Apps pipeline. The backup branch and tag retain the previous
runtime for emergency recovery.

## Risks

Later bilingual, notice, and image-analysis fixes are not implicitly carried into the restored
baseline. They must be reapplied to Original routes with focused tests. Database migrations remain
forward-only and are not reverted.

## Rollback

Redeploy `pre-rollback-20260815` or branch `backup/pre-rollback-20260815`.

## Validation

The baseline passed clean install with the repository-required peer flag, Prisma generation,
production build, typecheck, landing smoke, HCP/community journeys, and 68 visual captures.