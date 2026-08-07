# Architecture Changelog

All notable changes to the Phoenix AI **architecture** are recorded here. This file tracks the
architecture version declared in [ARCHITECTURE_VERSION](./ARCHITECTURE_VERSION), which is
independent of the application's package version.

Versioning follows semantic versioning applied to architecture:

- **MAJOR** — a component, external integration, or deployment topology is added, removed, or
  replaced; a data/identity/storage strategy changes; a cross-cutting policy is introduced.
- **MINOR** — a component is extended or reconfigured in a backward-compatible way (new route,
  new optional dependency wired, new diagram) without changing the overall topology.
- **PATCH** — documentation corrections, clarifications, or diagram tidy-ups with no change to the
  described architecture.

Every architecture-impacting pull request MUST bump this version and add an entry, and SHOULD
reference the relevant ADR and change record.

## [1.0.0] — 2024

### Added
- Established the authoritative AS-IS architecture baseline for Phoenix AI:
  - `current-architecture.md` (8-layer AS-IS model, source-vs-deployment section).
  - Diagrams: `current-architecture.mmd`, `current-data-flow.mmd`, `current-deployment.mmd`,
    `current-ai-architecture.mmd`.
  - `component-inventory.md`, `integration-inventory.md`, `azure-resource-map.md`.
- Introduced architecture-first governance (see
  [ADR-0002](./decisions/ADR-0002-architecture-first-governance.md)):
  ADR process, this changelog, `ARCHITECTURE_VERSION`, change records, PR template,
  governance CI (docs-sync gate + Mermaid validation), and drift-detection script.
- Recorded the founding hosting decision (see
  [ADR-0001](./decisions/ADR-0001-use-nextjs-app-service.md)).

### Notes
- No functional application behaviour was changed in this version; it documents the existing
  implementation and installs the governance framework.
