# CHANGE-20260829 — Bilingual Community education

## Impact

- **Level:** HIGH
- **Architecture version:** `7.0.0` → `8.0.0`
- **ADR:** [ADR-0016](../decisions/ADR-0016-runtime-community-first-aid-video.md)

## Changes

- Added bilingual First Aid Video and Burn Injury Prevention Community routes, Home cards, desktop
  sidebar entries and mobile drawer entries.
- Kept the five existing mobile bottom-navigation destinations rather than compressing seven labels.
- Added server-side per-request validation of `FIRST_AID_VIDEO_URL` and a route-local,
  privacy-enhanced YouTube iframe.
- Added approved bilingual burn first-aid key points, five prevention categories, educational
  limitations and a callout to the existing First Aid route.
- Extended the existing global EN/MS resources and provider without adding language state.

## Boundaries

- No HCP, authentication, credential, AI prompt or behavior, database schema, TBSA/Parkland,
  dependency, GitHub Actions, deployment workflow or Azure resource change.
- No media file or hardcoded real YouTube URL is committed.
- Responsible AI control statuses are unchanged because no AI behavior or governed control changed.

## Validation

Parser unit tests cover missing, valid watch/share/embed formats, invalid origins and runtime value
changes. Community browser tests cover exact content, immediate EN/MS switching, all five prevention
categories, First Aid navigation and viewport containment from 320 px through desktop. Typecheck,
lint, build, existing tests and architecture validation are run before completion.
