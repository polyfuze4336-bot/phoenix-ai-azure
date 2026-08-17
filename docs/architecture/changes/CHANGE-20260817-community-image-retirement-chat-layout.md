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

Typecheck, lint, production build, targeted mobile notice and bilingual Community journeys, full
unit/RAI/integration/API suites, architecture/Mermaid validation, secret scan, review and CodeQL.
Manual responsive checks remain required for device-specific viewport and bottom-navigation
behavior.
