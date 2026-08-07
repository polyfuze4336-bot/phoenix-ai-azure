# CHANGE-20240101: Establish architecture-first governance and AS-IS baseline

- **Date:** 2024
- **Author:** Phoenix AI migration team
- **Related ADR:** [ADR-0002](../decisions/ADR-0002-architecture-first-governance.md)
- **Architecture version:** (none) -> 1.0.0
- **Impact level:** MEDIUM (governance framework; no functional application behaviour changed)

## Summary

Introduced the architecture-first governance framework and captured the authoritative AS-IS
architecture of Phoenix AI. No application runtime behaviour was modified.

## Before

- `docs/architecture/ARCHITECTURE.md` and migration docs existed, but there was no authoritative
  AS-IS model, no component/integration inventories, no ADR process, no architecture versioning,
  no change history, and no CI enforcement of documentation synchronization.

## After

- Authoritative AS-IS set: `current-architecture.md`; diagrams `current-architecture.mmd`,
  `current-data-flow.mmd`, `current-deployment.mmd`, `current-ai-architecture.mmd`;
  `component-inventory.md`, `integration-inventory.md`, `azure-resource-map.md`.
- Governance: `decisions/` (README + ADR-0001, ADR-0002), `ARCHITECTURE_VERSION` (1.0.0),
  `ARCHITECTURE_CHANGELOG.md`, `changes/` (this record), `.github/PULL_REQUEST_TEMPLATE.md`,
  `.github/workflows/architecture-governance.yml`, `nextjs_space/scripts/validate-architecture.mjs`,
  and the architecture-first policy appended to `.github/copilot-instructions.md` and `AGENTS.md`.

## Components affected

Added: GOV-CI, GOV-VALIDATE. All other components documented (no change to their behaviour).

## Integrations affected

Added: INT-GHA-AZURE reference for the governance workflow (build-time). No runtime integrations changed.

## Diagrams updated

Created all four `docs/architecture/diagrams/*.mmd`.

## Validation

Typecheck, build, unit/integration/e2e/api tests, Mermaid `.mmd` validation, and
`scripts/validate-architecture` drift check. See the pull request checks.
