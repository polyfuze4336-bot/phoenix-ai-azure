# Phoenix AI — Visual & Route Baseline

This document describes the automated screenshot baseline captured for the Phoenix AI
Azure migration. The baseline is a **parity reference**: it records exactly how the app
looks and behaves before further migration work (e.g. the Azure OpenAI cutover) so any
later change can be checked against it. Capturing the baseline **does not change the UI**.

## What is captured

Screenshots are produced with [Playwright](https://playwright.dev) driving the
**production build** (`next start`), so images are free of dev-only overlays.

- **Tool:** `@playwright/test` (Chromium).
- **Config:** [nextjs_space/playwright.config.ts](../../nextjs_space/playwright.config.ts)
- **Spec:** [nextjs_space/tests/visual/baseline.spec.ts](../../nextjs_space/tests/visual/baseline.spec.ts)
- **Output:** `nextjs_space/tests/visual/baseline/<route>/<viewport>-<lang>-<state>.png`
  (full-page PNGs, committed to the repo).

## Dimensions (Playwright projects)

| Project name | Dimensions | Class |
|--------------|-----------|-------|
| `desktop-1440` | 1440 × 1000 | Desktop |
| `desktop-1280` | 1280 × 800 | Desktop |
| `tablet-768` | 768 × 1024 | Responsive |
| `mobile-390` | 390 × 844 | Responsive |

## Routes covered

All 14 accessible routes:

| Route | Auth | Notes |
|-------|------|-------|
| `/` | public | Landing page |
| `/hcp-login` | public | Demo login (mock, client-side) |
| `/hcp` | HCP | Dashboard |
| `/hcp/analysis` | HCP | AI wound analysis (image upload) |
| `/hcp/chat` | HCP | AI clinical chat |
| `/hcp/guidelines` | HCP | Clinical guidelines |
| `/hcp/parkland` | HCP | Parkland/Brooke fluid calculator |
| `/hcp/tbsa` | HCP | TBSA (Lund–Browder) diagram |
| `/community` | public | Community dashboard |
| `/community/articles` | public | Health articles |
| `/community/assessment` | public | Burn self-assessment quiz |
| `/community/chat` | public | Community AI chat |
| `/community/first-aid` | public | First-aid guidance |

### HCP authentication during capture

The HCP portal is gated by a **mock, client-side** auth check that reads the
`hcp_auth` object from `sessionStorage` (see `app/hcp-login/page.tsx`). Per the task,
the baseline uses the **existing demo login flow only**: the spec seeds the same
session object the demo "quick login" writes (demo user `doctor@phoenix.my`) via
`page.addInitScript` before navigating. No real credentials or backend are involved.

## States captured

The `<state>` suffix in each filename records the captured state:

| State suffix | Meaning |
|--------------|---------|
| `initial` | Page as first rendered (English) |
| `initial-empty` | Empty form (login) |
| `nav-open` | Mobile drawer navigation open (captured on `mobile-390`) |
| `completed-result` | Form completed → result panel shown (Parkland, assessment) |
| `user-menu` | HCP account dropdown open (dialog-like) |
| `error` | Error state (invalid login submission) |

Language is captured as a filename prefix:

- `en-*` — English (default on load).
- `bm-*` — Bahasa Malaysia (the in-app language toggle is clicked once; language is
  React state only and resets to English on each fresh load).

Coverage of the requested states:

- **Initial state** — every route, every viewport (`*-initial`).
- **Navigation open / closed** — closed is the initial state; open is captured on
  `mobile-390` for the HCP and Community portal layouts (`*-nav-open`).
- **English / Bahasa Malaysia** — `en-*` and `bm-*` for every route.
- **Mobile state** — the `mobile-390` (and `tablet-768`) projects.
- **Empty forms** — login (`initial-empty`), Parkland/assessment initial.
- **Completed forms** — Parkland (`completed-result`), assessment (`completed-result`).
- **Loading indicators** — the mock login applies a 1.2s delay; the AI routes surface
  spinners; these are transient and best observed live via `--headed`.
- **Result panels** — Parkland fluid results, assessment triage result.
- **Dialogs** — HCP account dropdown (`user-menu`); the PWA install prompt is
  conditional and does not appear during automated capture.
- **Error states** — invalid login (`hcp-login/*-error`). The four AI routes return a
  JSON 500 when `ABACUSAI_API_KEY` is unset (see the migration notes); that error path
  is exercisable but not committed as an image because it depends on backend absence.

## Running the capture

```powershell
cd nextjs_space
npm install --legacy-peer-deps      # if not already installed
npx playwright install chromium     # one-time browser download
$env:NEXTAUTH_URL = "http://localhost:3000"
npm run build                       # production build (required by next start)
npm run test:visual                 # or: npx playwright test
```

Playwright starts `next start` automatically (see `webServer` in the config) and reuses
an already-running server if one is present. Screenshots are written under
`tests/visual/baseline/`. Transient Playwright artifacts (`test-results/`,
`playwright-report/`) are git-ignored; the committed baseline images are not.

## Notes & assumptions

- Motion is reduced (`reducedMotion: 'reduce'`) and animations are disabled at capture
  time for deterministic images; the app's animation timing is unchanged.
- Timezone is pinned to `Asia/Kuala_Lumpur` and colour scheme to `light` for stability.
- No UI, styling, or content was modified in this step. This is capture-only.
