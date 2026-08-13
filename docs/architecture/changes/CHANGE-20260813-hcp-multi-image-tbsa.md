# CHANGE-20260813: HCP multi-image analysis and TBSA severity component

- **Date:** 2026-08-13
- **Author:** Phoenix AI migration team
- **Related ADR:** None; backward-compatible capability extension inside existing analysis architecture
- **Architecture version:** 2.2.1 -> 2.3.0
- **Impact level:** MEDIUM
- **Status:** COMPLETE

## Summary

Extended the HCP wound-analysis flow so a clinician can submit one or many images for a single case.
The staged pipeline now consolidates overlapping or duplicate views into a single total TBSA estimate
for that case and exposes a deterministic TBSA severity component:

- `Major burn (>=15% TBSA)`
- `Minor burn (<15% TBSA)`

Single-image requests remain supported without contract breakage.

## Affected components and integrations

| ID | Change |
| --- | --- |
| UI-HCP | Original HCP analysis uploader now supports multiple images and displays TBSA category |
| UI-V2-HCP | v2 assessment uploader now supports multiple images |
| API-HCP-ANALYSIS | `/api/analyze-wound` accepts `images[]` (backward-compatible with `image`) |
| AI-ANALYSIS-PIPELINE | Multi-image case consolidation for TBSA + deterministic major/minor TBSA classification |
| AI-VALIDATION | Added batch image validation (count + per-image MIME/size) |
| INT-BROWSER-APP | Browser-to-app payload updated to allow one-or-many ephemeral base64 image payloads |

## Boundaries

- No new Azure resources or runtime integrations were added.
- Existing telemetry remains privacy-safe (no image bytes or clinical text in logs).
- The optional single-pass pipeline fallback remains available and backward-compatible.
- This extension improves context quality but does **not** claim diagnostic certification or removal of
  known imaging limitations.

## Responsible AI impact

LOW (controlled extension). Updated RAI evidence/documentation for input validation and image-related
limitations; control statuses remain unchanged (Active/Partial/Planned are still honest).

## Validation

- PASS: Unit tests covering image-input validation and deterministic pipeline behavior.
- PASS: RAI test suite.
- PASS: Typecheck + production build.
- PASS: Architecture docs sync updates (current architecture, component/integration inventories,
  architecture changelog/version, change record, and AI/data-flow diagrams).
