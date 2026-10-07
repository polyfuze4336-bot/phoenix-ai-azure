# CHANGE-20261007 — Privacy-safe content-filter diagnostics

## Summary

Return a safe wound-analysis correlation ID in the JSON failure body and `x-correlation-id` header,
retain only allowlisted Azure content-filter source/category/severity fields, and record those same
dimensions consistently for Acute Burn, General Wound, and route-level failures.

## Impact

- **Level:** LOW
- **Components:** `API-HCP-ANALYSIS`, `AI-PROVIDER`, `AI-TELEMETRY`
- **Integrations:** `INT-BROWSER-APP`, `INT-APP-APPINSIGHTS` (existing channels only)
- **Azure resources:** None
- **Data / identity / storage:** No change
- **Responsible AI controls:** `RAI-PRIV-003`, `RAI-SAFE-010`

## Privacy and safety boundaries

- No image bytes, Base64, prompts, patient context, clinical output, or raw provider response are
  returned or recorded.
- Filter diagnostics remain limited to the typed input/output source, four Azure harm categories,
  and four severity values already parsed by `lib/ai/content-filter.ts`.
- The correlation ID is a validated opaque request token, not a patient or analysis-content value.
- Azure filtering remains terminal and the deployed `phoenix-clinical-imagery` policy is unchanged.
- Azure may omit structured filter evidence; the response does not invent missing classifications.

## Decision

No ADR is required. This is a backward-compatible extension of the existing error and telemetry
contracts and introduces no component, integration boundary, Azure resource, or policy decision.

## Validation

- Focused AI transport and HCP provider/route unit tests
- Full unit and RAI suites
- TypeScript typecheck and production build
- Architecture drift and Mermaid validation
