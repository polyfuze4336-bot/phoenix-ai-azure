# ADR-0002: Establish architecture-first governance

- **Status:** Accepted
- **Date:** 2024
- **Deciders:** Phoenix AI migration team
- **Related components:** GOV-CI, GOV-VALIDATE, DEVOPS-GHA
- **Related integrations:** INT-GHA-AZURE

## Context

Phoenix AI is evolving beyond the initial parity migration (new features, backend wiring). Without
a discipline that ties change to architecture understanding, documentation drifts from
implementation and undocumented complexity accumulates. The team requires that **no material
change be implemented until the current architecture is understood, documented, and
impact-assessed**, and that architecture documentation stays synchronized with the code.

## Current Architecture

Prior to this ADR the repository had `docs/architecture/ARCHITECTURE.md` and assorted migration
docs, but no authoritative AS-IS model, component/integration inventories, ADR process,
versioning, change history, or CI enforcement.

## Decision

Adopt an **architecture-first governance framework**:

- An authoritative AS-IS set: `current-architecture.md`, four Mermaid diagrams,
  `component-inventory.md`, `integration-inventory.md`, `azure-resource-map.md`.
- An ADR process (`decisions/`), architecture versioning (`ARCHITECTURE_VERSION`,
  `ARCHITECTURE_CHANGELOG.md`), and change records (`changes/`).
- A pre-change policy in `.github/copilot-instructions.md` and `AGENTS.md`, a pull request
  template with architecture-impact gates, a governance CI workflow that fails PRs which change
  architecture-impacting paths without updating `docs/architecture/**`, Mermaid validation, and a
  lightweight drift-detection script.

## Alternatives Considered

- **Documentation-only (no CI enforcement):** relies on memory; drifts quickly.
- **Heavyweight architecture tooling (e.g. Structurizr/C4 model tooling):** more machinery than a
  demonstration project needs; Mermaid-in-repo is sufficient and reviewable.

## Rationale

Lightweight, in-repo, reviewable artifacts plus a CI gate give durable synchronization between
code and architecture at low overhead, and integrate with the existing GitHub Actions + PR flow.

## Architecture Impact

Adds governance components GOV-CI and GOV-VALIDATE. No functional application behaviour changes.
Architecture version `1.0.0` (initial baseline established alongside this framework).

## Security Impact

None to the running application. CI uses existing OIDC federation; no new secrets.

## Operational Impact

Adds a required status check on pull requests. Contributors must update architecture docs when
touching architecture-impacting paths.

## Cost Impact

Negligible (CI minutes only).

## Risks

- False positives when non-structural edits touch gated paths. Mitigation: the check explains how
  to satisfy it (update `docs/architecture/**` or record why no change is needed).

## Rollback

Remove the governance workflow and policy sections. Documentation artifacts can remain.

## Validation

Validated by the governance workflow running on this pull request, Mermaid diagram validation
passing, and `scripts/validate-architecture` reporting no drift.
