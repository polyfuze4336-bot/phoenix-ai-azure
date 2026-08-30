# ADR-0016: Runtime-configured Community first-aid video

- **Status:** Accepted
- **Date:** 2026-08-29
- **Deciders:** Phoenix AI prototype owner
- **Related components:** UI-COMMUNITY, UI-I18N, CFG-ENV, APP-NEXT
- **Related integrations:** INT-BROWSER-APP, INT-COMMUNITY-YOUTUBE

## Context

The Community portal needs an educational YouTube video whose owner can replace the URL through
Azure runtime configuration without changing source or rebuilding the client bundle. The public
browser must not receive arbitrary environment values or arbitrary iframe URLs.

## Current Architecture

UI-COMMUNITY is a Next.js App Router experience using the global UI-I18N language provider.
APP-NEXT supports server and client components, and CFG-ENV already owns server-side operational
configuration. No video integration previously existed.

## Decision

Read `FIRST_AID_VIDEO_URL` in the dynamic First Aid Video Server Component through CFG-ENV on every
request. Accept only recognized HTTPS YouTube hosts and valid 11-character video IDs. Normalize a
valid value to `https://www.youtube-nocookie.com/embed/<id>?autoplay=0&controls=1` and pass only that
URL to the client presentation component. Render bilingual unavailable content without an iframe
when the setting is absent or invalid.

The browser loads YouTube only on this route. The existing global EN/MS provider controls all page
copy without changing the video.

## Alternatives Considered

- `NEXT_PUBLIC_FIRST_AID_VIDEO_URL`: rejected because Next.js would inline it at build time.
- A public runtime-config API: valid but unnecessary because a Server Component can pass the single
  sanitized value directly.
- Arbitrary iframe URLs: rejected because they would permit untrusted third-party origins.
- A local video file or player dependency: rejected to avoid repository media and unnecessary code.

## Rationale

The Server Component is the smallest runtime pattern. It preserves immediate client-side language
switching while keeping raw configuration server-side and constraining the only new browser origin.

## Architecture Impact

UI-COMMUNITY and CFG-ENV are extended. INT-COMMUNITY-YOUTUBE is added as an optional external
integration. Architecture version becomes `8.0.0`; current architecture and data-flow diagrams are
updated.

## Security Impact

No secret is added. Exact host, HTTPS, credentials, port and video-ID checks prevent arbitrary iframe
injection. The browser receives only the normalized privacy-enhanced embed URL; no unrelated
environment values are exposed.

## Operational Impact

Operators update `FIRST_AID_VIDEO_URL` in Azure Container App configuration. A new revision or
restart is required for the container process to receive a changed environment value; after that, a
browser refresh reads it without source changes or a frontend rebuild. No global cache is disabled.

## Cost Impact

No Azure resource cost changes. YouTube streaming follows the hosting provider's normal behavior.

## Risks

YouTube availability and its standard player behavior are external dependencies. Missing, malformed
or unsupported values degrade to a visible educational page without playback.

## Rollback

Remove the setting or revert the Community video route and integration documentation. Other
Community and HCP functionality remains independent.

## Validation

Run parser unit tests, bilingual and responsive Community browser tests, typecheck, lint, production
build, architecture validation, code review and security scanning.
