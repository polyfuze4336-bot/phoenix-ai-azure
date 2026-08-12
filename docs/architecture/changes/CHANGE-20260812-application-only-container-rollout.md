# CHANGE-20260812: Application-only Container Apps rollout

- **Date:** 2026-08-12
- **Author:** Phoenix AI migration team
- **Related ADR:** None; the Azure Container Apps + ACR topology selected by ADR-0007 is unchanged
- **Architecture version:** 2.2.1 -> 2.3.0
- **Impact level:** MEDIUM
- **Status:** IMPLEMENTED; Azure rollout pending

## Summary

Extend the existing GitHub deployment workflows with an application-only mode that resolves the
deployed ACR and Container App, remotely builds an immutable `phoenixai:<git-sha>` image, and updates
only the Container App revision. This mode is the default for application changes. Full
subscription-scoped Bicep reconciliation remains available only as an explicit workflow choice.

## Before

`DEVOPS-GHA` always ran full Bicep what-if and bootstrap before building or promoting an image. The
live PostgreSQL server is version 16 while Bicep requests 15 and the current Azure API accepts only
17/18 for new declarations, so infrastructure bootstrap stops before the image build.

## After

`DEVOPS-GHA` defaults to an existing-resource rollout through `INT-DEPLOY-ACR` and
`INT-GHA-AZURE`. It validates Bicep syntax but does not submit a Bicep deployment, mutate Azure
resources, or reconcile PostgreSQL. An operator must explicitly select full infrastructure mode to
run what-if and Bicep reconciliation.

## Components affected

- `DEVOPS-GHA` — extended with default application-only and explicit full-infrastructure modes.
- `INFRA-ACR`, `INFRA-CONTAINERAPP` — unchanged resources used by the application-only mode.

## Integrations affected

- `INT-GHA-AZURE` — extended to update an existing Container App revision directly through ARM.
- `INT-DEPLOY-ACR` — unchanged remote-build channel, now used before both rollout modes.

## Diagrams updated

- `docs/architecture/diagrams/current-architecture.mmd`
- `docs/architecture/diagrams/current-deployment.mmd`

## Security and data impact

OIDC federation, Azure RBAC scopes, Key Vault-backed runtime secrets, and managed identities are
unchanged. No credential is added. The application-only path does not modify PostgreSQL version,
configuration, schema, or data. App Service, Kudu, and ZIP deployment remain unused.

## Responsible AI impact

NONE. The rollout mode does not change AI behavior, prompts, models, safety controls,
transparency, telemetry content, clinical oversight, or RAI control status.

## Validation

- PASS: `actionlint` validates both changed deployment workflows.
- PASS: Node 22 typecheck; 105 unit, 22 RAI, and 14 integration tests; production build (74 pages).
- PASS: Bicep compile/lint, architecture drift validation, and all five architecture Mermaid
	diagrams.
- PENDING: successful ACR build, Container App revision health, smoke tests, and critical journeys.