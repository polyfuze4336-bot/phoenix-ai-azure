# ADR-0015: Retire standalone Community image analysis

- **Status:** Accepted
- **Date:** 2026-08-17
- **Deciders:** Phoenix AI prototype owner
- **Related components:** UI-COMMUNITY, API-COMMUNITY-ANALYSIS, PROMPT-COMMUNITY-ANALYSIS
- **Related integrations:** INT-BROWSER-APP, INT-APP-FOUNDRY

## Context

The Community portal exposed a standalone Image Check page and a dedicated
`/api/community-analyze` model route. The prototype owner requires this Community-only capability
to be removed while preserving Community education, self-assessment, articles and chat, and all HCP
image-analysis and chat attachment behavior.

## Current Architecture

UI-COMMUNITY linked to API-COMMUNITY-ANALYSIS from a home card and desktop/mobile navigation.
The dedicated API used PROMPT-COMMUNITY-ANALYSIS and the shared Azure AI provider. HCP analysis uses
separate routes, clients and prompts; only validation/provider utilities were shared.

## Decision

Remove the Community Image Check client, navigation entry points and dedicated API route. Keep
`/community/image-check` as a server redirect to `/community` so old bookmarks cannot access a
hidden feature. Retain the unused Community analysis prompt source without modification because
prompt changes are outside this task.

## Alternatives Considered

- Leave the API route active after hiding the UI: rejected because the standalone capability would
  remain callable.
- Return not found from the former page: valid, but a Community Home redirect provides a cleaner
  path for existing bookmarks.
- Reuse the HCP analysis route: rejected because it would broaden Community access and couple
  distinct clinical behavior.

## Rationale

This is the smallest complete retirement: Community access and its dedicated backend are removed,
the old page is safe, and shared HCP analysis code remains untouched.

## Architecture Impact

API-COMMUNITY-ANALYSIS and PROMPT-COMMUNITY-ANALYSIS become LEGACY. UI-COMMUNITY remains ACTIVE
without image analysis. The active API count changes from 16 to 15. Architecture version becomes
`7.0.0`.

## Security Impact

The public image-upload endpoint and its model invocation are removed, reducing public image-data
and model-call surface. Authentication, identity, credentials and secret handling do not change.

## Operational Impact

No Azure resource, deployment workflow, monitoring configuration or database changes. Existing
Azure AI capacity remains shared by the retained HCP and chat routes.

## Cost Impact

Community image-analysis model calls can no longer incur inference cost. No resource SKU changes.

## Risks

Existing bookmarks must redirect correctly, navigation must reflow without a gap, and shared HCP
image analysis must remain buildable. Automated route, journey and build checks cover these risks;
responsive visual confirmation remains manual.

## Rollback

Revert this ADR's implementation commit to restore the Community page, API route and entry points.

## Validation

Run typecheck, lint, unit/RAI/integration/API tests, targeted Community and HCP chat journeys,
production build, Mermaid checks and architecture drift validation.
