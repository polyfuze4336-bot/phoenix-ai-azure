# ADR-0012: Direct-main rapid-prototype workflow

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** Phoenix AI prototype maintainers
- **Related components:** DEVOPS-GHA, GOV-CI, GOV-VALIDATE
- **Related integrations:** INT-GHA-AZURE
- **Supersedes:** ADR-0002 only for mandatory GitHub pull-request and architecture-CI enforcement

## Context

Phoenix AI is a prototype/demo repository. The live GitHub repository already has no `main` branch
protection, rulesets, or environment reviewers, but repository instructions and workflows still
promote pull requests and run a separate architecture gate. That mismatch slows Codespaces and
Copilot iteration without protecting a production release process.

## Decision

Allow maintainers, Codespaces, and Copilot to commit and push reviewed changes directly to `main`.
Keep application CI as a non-gating push/manual signal and keep automatic Development deployment on
every `main` push. Keep Demo, infrastructure, and database operations manually dispatchable. Remove
pull-request triggers, the separate Architecture Governance workflow, and the report-only dependency
audit job.

Architecture-first documentation, change records, ADRs, local drift validation, tests, and
Conventional Commits remain required before a direct-main push. Pull requests remain available but
are optional.

## Alternatives considered

- **Keep required PR and status checks:** rejected for the requested rapid-prototype workflow.
- **Remove all CI and deploy automation:** rejected because it would reduce repeatability and remove
  automatic Azure delivery.
- **Make deployment depend on CI:** rejected because it would recreate a blocking status gate; the
  deployment workflow already performs its own Bicep validation, immutable build, health check, and
  critical journeys.

## Consequences

- Faster direct iteration and no approval queue.
- Pushes to `main` continue to create auditable GitHub runs and immutable Azure images.
- Architecture synchronization and dependency review rely on contributor discipline and local tools;
  this reduced server-side enforcement is recorded as `LIM-011`.
- No Azure, OIDC, RBAC, secret, application, AI, clinical, or data-flow change.

## Rollback

Restore `.github/workflows/architecture-governance.yml`, pull-request triggers, and branch/ruleset
requirements from Git history; update architecture versioning and supersede this ADR.