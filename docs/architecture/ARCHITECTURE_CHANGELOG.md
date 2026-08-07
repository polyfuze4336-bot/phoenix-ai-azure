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

## [1.1.0] — 2026-08-07

### Added
- **Staged wound-analysis pipeline** for `/api/analyze-wound` (`lib/ai/analysis/pipeline.ts`):
  four sequential model stages (visual observation → clinical interpretation & quantification →
  management & referral → consistency/safety critic) with deterministic post-processing.
  Default behaviour; `AI_ANALYSIS_PIPELINE=single` reverts to the original single-pass call.
- **Purpose-specific model selection** (`lib/ai/model-config.ts`):
  `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` / `AZURE_AI_CHAT_MODEL_DEPLOYMENT`, both defaulting to
  `AZURE_AI_MODEL_DEPLOYMENT` so existing configuration is unchanged.
- **Rich analysis schema + back-compat adapter** (`lib/ai/schemas/burn-wound-analysis.ts`):
  observation-vs-interpretation separation, per-field confidence, and explicit information gaps,
  mapped back to the existing 22-field contract so the SSE envelope and existing client are
  unchanged; the full structure travels under `result.structured`.
- **Staged prompts** (`lib/ai/prompts/wound-visual-observation`, `-clinical-interpretation`,
  `-management`, `-analysis-critic`) and streaming collector (`lib/ai/streaming/collect.ts`).
- **Enhanced HCP analysis UI** (`app/hcp/analysis/_components/structured-analysis.tsx`):
  analysis-quality banner, "Why this assessment?" evidence/confidence, and a REFINE second-pass.
- **Evaluation harness** (`tests/evaluation/burn-wound/`) and analysis unit tests
  (`tests/unit/analysis-pipeline.test.ts`) for deterministic safety rules.

### Changed
- `/api/analyze-wound` route wired to the staged pipeline (flagged) with `maxDuration` raised to
  match multi-stage latency; deterministic Parkland now requires a supplied weight (no assumed
  70 kg), Fitzpatrick reported only when clinician-supplied, measurements only with a scale.
- Diagram `current-ai-architecture.mmd` and `current-architecture.md` §3.3 updated to describe
  the staged pipeline, model split, and deterministic clinical calculation.

### Notes
- No fabricated accuracy figures: diagnostic accuracy is **not** certified. The evaluation harness
  is scaffolded but requires live Azure calls against a labelled, consented dataset.
- See change record
  [`changes/CHANGE-20260807-improve-ai-analysis-accuracy.md`](./changes/CHANGE-20260807-improve-ai-analysis-accuracy.md)
  and [ADR-0003](./decisions/ADR-0003-staged-wound-analysis-pipeline.md).

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
