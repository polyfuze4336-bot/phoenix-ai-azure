# CHANGE-20260814: v2 analysis parity, bilingual AI output and safety notices

- **Date:** 2026-08-14
- **Author:** Phoenix AI migration team
- **Related ADR:** [ADR-0008](../decisions/ADR-0008-v2-default-public-entry.md) for root landing behavior
- **Architecture version:** 2.3.0 -> 2.4.0
- **Impact level:** MEDIUM
- **Status:** COMPLETE

## Summary

The public landing now presents Phoenix AI v2.0 without advertising the original experience. Original
routes remain available for compatibility. Original and v2 HCP assessment clients share the same
image preparation, `/api/analyze-wound` request and SSE completion path.

The existing EN/BM selection now travels through HCP chat and wound analysis. Machine-readable JSON
keys and enum values remain stable; clinician-facing narrative values and deterministic guidance use
the selected language. HCP analysis and chat surfaces also share a bilingual notice requiring patient
data and images to be handled under Malaysia's PDPA 2010 and applicable Malaysian law, and stating
that AI output is clinical decision support only.

## Affected components and integrations

| ID | Change |
| --- | --- |
| UI-LANDING | v2.0 becomes the enabled public landing; original links are removed from that surface |
| UI-HCP / UI-V2-HCP | Shared analysis request/stream path and EN/BM response preference |
| UI-CLINICAL-NOTICE | New shared bilingual legal/safety notice |
| UI-PWA | Existing language state now governs HCP AI output |
| API-HCP-CHAT | Validates and applies `en` / `bm` |
| API-HCP-ANALYSIS | Validates and applies `en` / `bm` in staged and single-pass modes |
| AI-ANALYSIS-PIPELINE | Localizes narrative and deterministic clinician-facing output |
| AI-STREAMING | Handles trailing SSE data and supplies one client completion parser |
| APP-MIDDLEWARE / API-HCP-ANALYSES* | Retained analysis records require a verified Entra HCP session; demo auth cannot retain or read them |
| INT-BROWSER-APP | Carries the non-sensitive language code with existing chat/image requests |
| INT-APP-FOUNDRY | Receives the selected-language instruction with existing model requests |

## Boundaries

- No Azure resource, external integration, authentication or storage mechanism changes.
- Analysis images remain ephemeral request payloads; the analysis path does not persist them.
- The notice communicates data-handling obligations; it does not claim legal certification or that
  technical controls alone establish PDPA compliance.
- AI output remains clinical decision support requiring qualified clinician review.
- ADR-0008 records the root navigation decision; topology, provider choice and API routes remain unchanged.

## Responsible AI impact

- `RAI-INCL-001` expands from bilingual public guidance to bilingual HCP analysis/chat output.
- `RAI-PRIV-007` records the implemented, user-visible patient-data legal handling notice.
- `RAI-PRIV-008` records server-authorized access to retained analysis records.
- `RAI-SAFE-006` now gates Parkland volumes on an age-aware indication threshold as well as weight.
- Prompt/pipeline versions are bumped and evidence/tests updated.
- `LIM-008` remains unchanged: AI output is decision support only.

## Validation

- Unit, RAI, API and targeted browser-flow tests.
- Typecheck and production build.
- Mermaid parse validation and `nextjs_space/scripts/validate-architecture.mjs`.
