# CHANGE-20260903 — Demo login and Community referral guidance

## Impact

- **Level:** LOW
- **Architecture version:** `8.1.0` → `8.2.0`
- **ADR:** Not required; the existing demo authentication boundary and Community assessment
  component are narrowed/extended without changing topology or strategy.

## Changes

- Restricted `AUTH-DEMO` to one server-verified DEMO/TEST-only account.
- Removed the passwordless quick-login API path and all demo identity/credential disclosure from
  the login UI.
- Added an EN/MS recommended-next-step message to each existing Community Self-Assessment result:
  community/primary care for minor, hospital/appropriate facility for moderate, and urgent
  hospital/emergency care for emergency.

## Boundaries

- Self-Assessment questions, scores, thresholds (`minor <= 3`, `moderate <= 7`, `emergency >= 8`),
  first-aid copy, and the emergency `tel:999` action remain.
- Entra remains opt-in. Demo sessions remain client-side and are not production authentication.
- No Azure resource, deployment workflow, database, dependency, AI behavior, prompt, image
  analysis, TBSA/Parkland rule, or RAI control changed.

## Validation

- PASS: unit `126/126`; Responsible AI `31/31`; integration `14/14`; production HTTP API
  `23/23`; focused login/Self-Assessment browser tests `9/9`; TypeScript; ESLint; production build
  (using Next.js's test-only offline font responses because Google Fonts DNS was unavailable);
  architecture drift validation.
- Existing unrelated bilingual-route assertions remain stale for the HCP analysis subtitle
  ("Upload or capture..." vs the rendered "Upload..."): full E2E `38/40`; all tests changed or added
  by this task pass.
