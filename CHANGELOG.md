# Changelog

All notable changes to the Phoenix AI Azure migration are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to migration-step-based versioning. Detailed, per-step
technical notes live in [docs/migration/MIGRATION.md](docs/migration/MIGRATION.md).

## [Unreleased]

### Added
- Initialised the Phoenix AI Azure migration repository:
  - `.gitignore`, `.editorconfig`, `.nvmrc` (Node 22), `.env.example` (no secrets).
  - `README.md` stating this is a parity migration of Phoenix AI from Abacus.AI to Azure.
  - `CONTRIBUTING.md` (workflow + recommended `main` branch protection rules).
  - `CHANGELOG.md` (this file).
  - `docs/migration/`, `docs/architecture/`, `docs/testing/` documentation.
  - `.github/workflows/ci.yml` (install + build verification).
  - `.github/copilot-instructions.md` (migration guardrails for AI assistance).
- Imported the pristine Phoenix AI source from the Abacus.AI archive into `nextjs_space/`.
- `docs/migration/source-code-audit.md`: complete read-only audit of the imported source —
  architecture, all 13 pages and 4 API routes, design tokens, dependencies, environment
  variables, security risks, and Azure migration blockers, with the 12 known issues confirmed.
- `docs/migration/source-baseline-manifest.md`: SHA-256 manifest of all 162 tracked files
  establishing an immutable source baseline. Canonical `public/logo.png` SHA-256 recorded
  (`dfb40a3e…917d8241`). Tag `abacus-source-baseline` + branch `migration/azure-port` created.
- `docs/migration/build-health-report.md`: build-health baseline of the unmodified source on
  Node 22 / npm 10.9.3 â€” install, type-check, build, and runtime (14/14 routes HTTP 200) all
  pass; lint is blocked by an inherited `eslint@9` / `next lint` incompatibility; `npm audit`
  records 25 vulnerabilities (2 low, 1 moderate, 21 high, 1 critical). No source code changed.
- `components/phoenix-logo.tsx`: a reusable `PhoenixLogo` component wrapping `/logo.png`
  (`next/image` `fill` + `object-contain`, no filters/recolour), adopted at all 11 logo render
  sites with zero visual change.
- `docs/migration/brand-parity-checklist.md`: brand-asset inventory, the 14 confirmed logo /
  metadata placements, the `PhoenixLogo` contract, and the preserved `STYLE_GUIDE.md` design
  system (fonts, colour tokens, gradients, radius/spacing/shadow scales, animation timing).
- Playwright visual + route baseline: `nextjs_space/playwright.config.ts` (four viewport
  projects — 1440×1000, 1280×800, 768×1024, 390×844), `nextjs_space/tests/visual/baseline.spec.ts`
  (all 14 routes × EN/BM × states), and 143 committed baseline PNGs under
  `nextjs_space/tests/visual/baseline/`. Added `@playwright/test` dev dependency + Chromium.
- `docs/testing/visual-baseline.md`: how the baseline is captured, dimensions, routes, states,
  demo-auth handling, and the run command.

### Verified
- `npm install --legacy-peer-deps` succeeds (1064 packages).
- `npm ci --legacy-peer-deps` succeeds (exit 0) with Node v22.19.0 / npm 10.9.3.
- `npx tsc --noEmit` passes with 0 type errors.
- `npm run build` (`next build`) compiles successfully â€” 17/17 routes generated.
- Development server serves all 14 application routes with HTTP 200 and no server errors.

### Changed
- Removed Abacus build and filesystem assumptions so the source builds outside Abacus:
  - Prisma generator restored to the standard `provider = "prisma-client-js"` (dropped the
    hardcoded `/home/ubuntu/...` `output` path and `linux-musl-arm64` `binaryTargets`);
    PostgreSQL retained. `prisma generate` now writes to the default `node_modules/@prisma/client`.
  - Pinned `eslint@8.57.1` + `eslint-config-next@14.2.28` (matching Next.js 14.2.28) and added a
    minimal `.eslintrc.json` so `next lint` runs. `npm run lint` reports 0 warnings / 0 errors.
  - Removed `eslint.ignoreDuringBuilds` from `next.config.js` (build now lints for real);
    `typescript.ignoreBuildErrors` stays `false`.
  - Completed the npm script set: added `typecheck`, `test`, `test:e2e`, `format:check`
    (test/e2e/format are honest placeholders until real suites exist).
- Extracted the inline logo markup at 11 sites (landing header + hero, HCP login, HCP loading
  splash, HCP desktop/mobile nav + mobile top bar, Community desktop/mobile nav + mobile top
  bar, PWA install prompt) into the shared `PhoenixLogo` component. Pure extraction — wrapper
  sizes, alt text, `drop-shadow-lg`, and animation classes are unchanged; the design system
  (`STYLE_GUIDE.md`) and all brand assets are untouched.
- `package.json`: `test:e2e` now runs `playwright test` (was a placeholder); added `test:visual`.
  `tsconfig.json` excludes `tests/` + `playwright.config.ts` from the Next app type project.
  `.gitignore` ignores Playwright `test-results/` / `playwright-report/` anywhere while keeping
  the committed visual baseline tracked. No application code or UI changed.

### Fixed
- `app/hcp/analysis/_components/analysis-client.tsx`: added the missing `stopCamera` dependency
  to the `capturePhoto` `useCallback` (behaviour-preserving) — the only lint defect.
- AI API routes now emit a clear development configuration error and server log when
  `ABACUSAI_API_KEY` is absent, instead of a terse "API key not configured" (response shape and
  500 status unchanged).

### Known issues / follow-ups
- `next@14.2.28` security advisory — to be addressed in a dedicated dependency-hardening change.
- Abacus.AI platform artifacts (LLM endpoint, injected chat widget) to be migrated/removed.
