# CHANGE-20261007 — Wound-analysis timeout fallback

## Summary

Reduce the default `AI_ANALYSIS_TIMEOUT_MS` from 90 seconds to 30 seconds so a transient Acute Burn
stage failure enters the existing validated single-pass fallback promptly.

## Impact

- **Level:** LOW
- **Components:** `API-HCP-ANALYSIS`, `AI-ANALYSIS-PIPELINE`, `AI-PROVIDER`
- **Integrations:** `INT-BROWSER-APP`, `INT-APP-FOUNDRY` (behavior only; no boundary change)
- **Azure resources:** None
- **Data / identity / storage:** No change
- **Responsible AI controls:** `RAI-REL-001`, `RAI-SAFE-010`

## Safety boundaries

- The fallback is attempted only after transient staged failures and only for Acute Burn.
- Content-filter, safety, authentication, invalid-input, and refinement failures do not use it.
- The fallback output must pass the existing core-field/schema validation before completion.
- A second timeout remains an explicit safe failure with manual-assessment guidance.

## Decision

No ADR is required. This is a backward-compatible reliability correction within the accepted
staged-pipeline design in ADR-0003 and uses its existing single-pass fallback.

## Validation

- Targeted timeout and fallback unit tests
- Full unit and RAI suites
- TypeScript typecheck and production build
- Architecture drift and Mermaid validation
- Deployed API and browser smoke verification after direct-main deployment
