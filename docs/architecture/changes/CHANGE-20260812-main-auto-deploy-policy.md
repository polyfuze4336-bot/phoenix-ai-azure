# CHANGE-20260812: Mainline auto-deploy policy for Demo and Development

- **Date:** 2026-08-12
- **Author:** Phoenix AI migration team
- **Related ADR:** None; no topology, identity, or runtime decision changes
- **Architecture version:** 2.3.1 -> 2.4.0
- **Impact level:** LOW
- **Status:** COMPLETE

## Summary

Enable automated Azure deployment for both rapid-prototype environments from `main` updates.
`deploy-demo.yml` now runs on push-to-`main` (in addition to manual dispatch), matching
`deploy-dev.yml` trigger behavior.

## Affected components and integrations

| ID | Change |
| --- | --- |
| DEVOPS-GHA | Deployment trigger policy now includes push-to-`main` for Demo and Development |
| INT-GHA-AZURE | Trigger model documented as push-to-`main` + manual dispatch for both environments |

## Boundaries

- OIDC issuer, audience, immutable subjects, and GitHub environment names are unchanged.
- Azure RBAC scopes and the dedicated `github-phoenixai-deploy` identity are unchanged.
- Deployment pipeline stages (Bicep validation, remote ACR build, rollout, health checks, smoke and
  journey tests) are unchanged.
- No new Azure resources or runtime dependencies are introduced.

## Responsible AI impact

NONE. This change only updates deployment triggers and does not affect AI behavior, prompts, models,
limitations, clinical oversight, transparency, telemetry, or any RAI control.

## Validation

- PASS: `deploy-demo.yml` trigger now includes `push.branches: [main]` and `workflow_dispatch`.
- PASS: Architecture docs, inventories, and diagrams updated to reflect the same trigger policy.
- PASS: Architecture drift script, Mermaid validation, and application build/test checks completed.
