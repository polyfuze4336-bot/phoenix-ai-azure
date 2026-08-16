# CHANGE-20260816 — HCP image-analysis fixes

## Impact

- **Level:** MEDIUM
- **Architecture version:** `6.1.1` → `6.2.0`
- **ADR:** None. The changes extend existing HCP analysis, Azure AI, telemetry, language, and
  deterministic-clinical-calculation components without changing topology or resource strategy.

## Changes

- Removed the browser `MediaStream` camera path; the standard upload control remains the only image
  selection path and retains compatible mobile camera/photo selection.
- Added a protected text-only translation operation for completed live and History results. Images
  are not resent; canonical and numeric values are validated unchanged; EN/MS results are cached.
- Separated Parkland indication from calculation. Image Analysis uses explicit clinician-selected
  adult (`TBSA >=15%`) or child (`TBSA >=10%`) thresholds, with no inferred category or weight.
- Added safe Azure content-filter classification for input/output stops using allowlisted
  source/category/severity only. Raw provider errors and image content are not logged.

## Boundaries

- No authentication, credential, dependency, database schema, Community feature, deployment
  workflow, Azure resource, or content-filter policy change.
- The standalone Parkland calculator and deterministic formula are unchanged.
- Any live Azure policy adjustment is manual and must use the least-permissive supported
  configuration after confirming the actual blocking category.

## Validation

PASS: unit `121/121`, RAI `31/31`, integration `14/14`, API `26/26`, bilingual HCP/Community
journeys `4/4`, HCP retry E2E `1/1`, typecheck, lint, production build, and architecture/Mermaid
drift validation. The build used Next.js's temporary test-only Google-font response hook because
the sandbox could not resolve `fonts.googleapis.com`; production source is unchanged.

Manual de-identified clinical-image and mobile-upload checks remain required because they depend on
browser hardware and live Azure policy.
