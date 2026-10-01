# CHANGE-20261001 — HCP clinical-image reliability

## Impact

- **Level:** MEDIUM
- **Architecture version:** `8.4.0` → `8.5.0`
- **ADR:** None; existing mode-specific API, Azure provider and RAI controls are extended without
  changing topology or clinical-calculation strategy.

## Changes

- Separate General Wound core-field validation from Acute Burn structured interpretation; General
  Wound never needs TBSA, Parkland, Lund & Browder or Rule of Nines fields.
- Invalid single-pass Acute Burn output and incomplete client streams no longer appear successful.
- Clinical prompts explicitly support necessary wound observations on private body regions while
  excluding unrelated anatomy. Input validation remains content-neutral.
- Azure refusals retain the platform filter and are surfaced as neutral EN/BM manual-assessment
  guidance with retry. Provider responses and images are never logged by this analysis path.
- The existing Container App supplies AI endpoint, deployment, API version and managed identity at
  runtime; no new resource, diagnostic endpoint, image storage or automatic configuration change.

## Evidence and limits

Repository review cannot identify the exact deployed failure without sanitized request-stage logs
and a presence-only comparison of the running revision's environment and Azure permissions.
Mocked model tests prove the revised paths, not live clinical accuracy or universal filter acceptance.
See `docs/migration/MIGRATION.md` for required operator checks.

## Validation

TypeScript, lint, architecture drift, unit, RAI, integration, API and targeted HCP
Playwright tests passed. The production build passed with Next's test-only Google
Fonts mock because this sandbox cannot resolve `fonts.googleapis.com`.
