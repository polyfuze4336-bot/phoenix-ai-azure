# CHANGE-20260812: Rapid-prototype deployment policy

- **Date:** 2026-08-12
- **Author:** Phoenix AI migration team
- **Related ADR:** None; no topology, identity, or runtime decision changes
- **Architecture version:** 2.2.0 -> 2.2.1
- **Impact level:** LOW
- **Status:** COMPLETE

## Summary

Use the existing `Demo` and `Development` GitHub environments without required reviewers,
environment protection rules, or deployment branch policies while Phoenix AI is in rapid
prototyping. Demo remains manual-dispatch only. Development continues to deploy from `main` and by
manual dispatch.

## Affected components and integrations

| ID | Change |
| --- | --- |
| DEVOPS-GHA | Records the reviewer-free rapid-prototype workflow policy |
| INT-GHA-AZURE | Records that both OIDC-bound environments are reviewer-free |

## Boundaries

- OIDC issuer, audience, immutable subjects, and GitHub environment names are unchanged.
- Azure RBAC scopes and the dedicated `github-phoenixai-deploy` identity are unchanged.
- Workflow validation, migration safety, health checks, smoke tests, and critical journeys remain.
- This is not a production approval model. Production use requires a separate governance review.

## Responsible AI impact

NONE. The change only removes a deployment approval wait state. It does not affect AI behavior,
prompts, models, limitations, clinical oversight, transparency, telemetry, or any RAI control.

## Validation

- PASS: `Demo` and `Development` each report zero protection rules and no deployment branch policy.
- PASS: deployment and infrastructure workflows contain no reviewer or approval-gate instructions;
	VS Code reports no workflow diagnostics.
- PASS: architecture drift validation and all seven Mermaid diagrams.
- PASS: TypeScript typecheck, Next.js production build, 104 unit tests, 22 RAI tests, and
	14 integration tests.
