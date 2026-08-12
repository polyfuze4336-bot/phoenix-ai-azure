# CHANGE-20260812: Multi-image TBSA assessment

- **Date:** 2026-08-12
- **Author:** Phoenix AI migration team
- **Related ADR:** ADR-0008
- **Architecture version:** 2.3.0 -> 2.4.0
- **Impact level:** HIGH
- **Status:** IMPLEMENTED; Azure rollout pending

## Summary

Extend the HCP analysis experience and existing multimodal pipeline to jointly assess up to five
photographs, deduplicate probable repeated views, aggregate distinct anatomical regions, and display
a deterministic Minor/Major band for the aggregate AI-estimated TBSA.

## Before

`UI-HCP`, `UI-V2-HCP`, and `API-HCP-ANALYSIS` accept one image. The pipeline reports a model-estimated
TBSA but has no explicit multi-view coverage contract or deterministic 15% classification.

## After

The existing components accept one to five validated images. `AI-ANALYSIS-PIPELINE` sends all views
through observation and interpretation, records coverage and probable duplicates, and returns one
deduplicated estimate. Application code bounds the estimate and computes the size category.

## Components affected

UI-HCP, UI-V2-HCP, API-HCP-ANALYSIS, AI-ANALYSIS-PIPELINE, AI-ANALYSIS-SCHEMA,
AI-PROMPT-VERSIONS, LIB-RAI, RAI-TESTS.

## Integrations affected

- `INT-BROWSER-APP` — request may contain a bounded `images[]` collection.
- `INT-APP-FOUNDRY` — a staged analysis may include up to five image content parts.

## Diagrams updated

- `docs/architecture/diagrams/current-data-flow.mmd`
- `docs/architecture/diagrams/current-ai-architecture.mmd`

## Responsible AI impact

Add Active `RAI-SAFE-013` (deterministic photographic TBSA bounds/banding) and Partial
`RAI-TRANS-006` (multi-view coverage and duplicate-view disclosure). Duplicate recognition remains
Partial by design because it is model-assisted, not geometric registration.

## Validation

- PASS: Node 22 typecheck; 112 unit, 25 RAI, and 14 integration tests.
- PASS: production build (74 pages), 14 API tests, and both critical journeys. The HCP journey
	selects two identical fixture views and reaches a deterministic terminal state.
- PASS: focused production-browser interaction verifies two previews, plural analysis action, and
	individual image removal.
- PASS: architecture drift and all five Mermaid diagrams.
- LIMITATION: the structural evaluation harness ran in rubric-only mode and honestly skipped all
	four cases because no consented live images or committed result fixtures were available; no
	diagnostic-accuracy conclusion is claimed.
- PENDING: Azure ACR build, Container App rollout, live two-image analysis, and browser verification.