# CHANGE-20260831 — Community first-aid video library

## Impact

- **Level:** LOW
- **Architecture version:** `8.0.0` → `8.1.0`
- **ADR:** [ADR-0016](../decisions/ADR-0016-runtime-community-first-aid-video.md), amended

## Changes

- Added `https://youtu.be/qcADGBwSgC8` as the enabled featured Community first-aid video.
- Extended the existing server-side URL validation into an ordered, deduplicated video library.
- Preserved `FIRST_AID_VIDEO_URL` as the optional featured override.
- Added bilingual active-video details and conditional selection cards when more than one enabled
  video is available.

## Boundaries

- Existing Phoenix AI branding, Community layout, written first-aid guidance and disclaimer remain.
- The browser receives only normalized `youtube-nocookie.com` embed URLs from validated YouTube IDs.
- No Azure resource, identity, API, database, storage, AI behavior, RAI control, dependency,
  deployment workflow or HCP behavior changed.

## Validation

- PASS: parser/library unit `6/6`; full unit `127/127`; RAI `31/31`; typecheck; production build;
  architecture drift validation; single-video Community browser `3/3`; two-video selection `1/1`;
  Desktop Chrome `3/3`; Desktop Edge profile `3/3`; WebKit 18.2 `3/3`; mobile Chromium `3/3`;
  direct player inspection at 16:9 with no horizontal overflow, Play and fullscreen controls.
- PASS: GitHub Actions run `33365612250` deployed commit `eb0b110` as healthy Container Apps
  revision `ca-phoenixai-oaprp7dte7bw2--eb0b110-12-1`. Live verification confirmed the embedded
  `qcADGBwSgC8` player, Play and fullscreen controls, EN/MS switching, preserved branding/guidance/
  disclaimer, and 390 px mobile 16:9 containment without horizontal overflow.