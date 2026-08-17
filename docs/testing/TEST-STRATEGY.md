# Test & UI-Parity Strategy — Phoenix AI (Azure migration)

The migration's success criterion is **parity**: the Azure version must look and behave like
the original Abacus.AI application. This document defines how we verify that.

## Levels of verification

### 1. Build & type checks (every step)
- `npm run build` (`next build`) must compile with **0 errors** and generate all routes.
- TypeScript type-checking runs as part of the build (`typescript.ignoreBuildErrors: false`).
- `npm run lint` is advisory (the source sets `eslint.ignoreDuringBuilds: true`).

### 2. UI parity (visual + behavioural)
Compared against the live source: https://phoenixai-burnandwound.abacusai.app/hcp

Check, per page/route, that the following are preserved:
- Phoenix AI name, **original logo** (proportions, placement, treatment), and branding.
- Page structure, navigation, colour palette (`#8B0000` primary), typography hierarchy,
  spacing, border radii, shadows, cards, buttons, forms, icons.
- Charts, animations, and responsive behaviour (mobile/tablet/desktop breakpoints).
- Clinical terminology and user journeys.
- Mock/seeded data behaviour (dashboards, articles, guidelines, quick-login users).
- English / Bahasa Melayu language toggle.
- PWA install/registration behaviour.

Routes in scope:

| Portal | Routes |
| --- | --- |
| Landing | `/`, `/hcp-login` |
| HCP | `/hcp`, `/hcp/analysis`, `/hcp/chat`, `/hcp/guidelines`, `/hcp/parkland`, `/hcp/tbsa` |
| Community | `/community`, `/community/articles`, `/community/assessment`, `/community/chat`, `/community/first-aid`; `/community/image-check` redirects home |

### 3. Functional checks (AI cutover)
When the LLM is migrated to Azure OpenAI, verify identical behaviour of the API routes:
- `POST /api/analyze-wound` — streaming SSE, JSON result schema unchanged.
- `POST /api/hcp-chat`, `POST /api/community-chat` — streaming text responses.
Vision (image) inputs and streaming must continue to work end-to-end.

## Tooling (planned)

- **Playwright** for automated UI smoke tests and screenshot-based parity checks across
  breakpoints. Local browsers only for development/CI; the deployed app has no such dependency.
- Manual side-by-side comparison against the live source for pixel/branding fidelity.

## Reporting

At the end of every migration step, record in [../migration/MIGRATION.md](../migration/MIGRATION.md):
1. Checks run and results.
2. Files added / modified / deleted.
3. Tests executed and their results.
4. Unresolved issues.

## Current status

- ✅ Build verification passing (17/17 routes) as of repository initialisation.
- ⬜ Playwright harness — not yet added.
- ⬜ Azure OpenAI functional parity — pending AI cutover step.
