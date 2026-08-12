# CHANGE-20260812 — HCP multi-image TBSA consolidation

## Summary

Extended the existing HCP wound-analysis flow to support multi-image uploads for a single case and
updated TBSA estimation behavior to consolidate overlapping/duplicate views instead of double-counting.

## Impact

- **Impact level:** LOW
- **Architecture version:** 2.1.0 → 2.2.0
- **ADR required:** No (backward-compatible behavior extension within existing components)

## Components / integrations

- Component: `API-HCP-ANALYSIS`
- Component: `AI-ANALYSIS-PIPELINE`
- Component: `AI-VALIDATION`
- Component: `UI-HCP`
- Integration: `INT-BROWSER-APP`
- Integration: `INT-APP-FOUNDRY`

## Notes

- No new Azure resources or external dependencies were introduced.
- Existing single-image request shape remains supported for backward compatibility.
