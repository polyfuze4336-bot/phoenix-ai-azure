# CHANGE-20260817 — Community image retirement and HCP chat layout

## Impact

- **Level:** HIGH
- **Architecture version:** `6.2.0` → `7.0.0`
- **ADR:** [ADR-0015](../decisions/ADR-0015-retire-community-image-analysis.md)

## Changes

- Removed Community Image Check home/navigation entry points, client and
  `/api/community-analyze`; `/community/image-check` redirects to Community Home.
- Kept Community chat independent and unchanged; it has no image attachment.
- Kept HCP Image Analysis and HCP chat image attachments unchanged.
- Moved the bilingual Confidentiality and Personal Data notices below and outside the fixed-height
  HCP Specialist Chat panel, preserving their text/icons while increasing message space.
- Used a dynamic viewport height on mobile and retained the existing desktop height calculation.

## Boundaries

- No authentication, credential, dependency, database schema, Parkland/TBSA logic, AI prompt,
  deployment workflow, GitHub Actions, Azure resource or automatic deployment change.
- The retained Community analysis prompt source is unmodified and has no active runtime caller.
- RAI control statuses are unchanged; evidence links now describe the active HCP image route and
  the strengthened HCP notice layout test.

## Validation

PASS: typecheck, lint, production build, unit `121/121`, RAI `31/31`, integration `14/14`, API
`22/22`, Community journeys `2/2`, HCP journeys `2/2`, responsive chat layout `1/1`, clickable
controls `13/13`, and architecture drift validation. The build used a temporary test-only Google
font response because sandbox DNS could not resolve `fonts.googleapis.com`.

The full bilingual route suite is `5/7`: its two HCP route cases have a pre-existing stale Image
Analysis expectation (“Upload or capture” versus the current “Upload”). That unrelated, explicitly
out-of-scope HCP Image Analysis language check is unchanged. Mermaid CLI is not installed, so
changed diagrams received source review and repository drift validation but not CLI rendering.
Manual device-specific viewport and bottom-navigation confirmation remains required.
