# Part 10 — File Change Summary

> Quantitative summary of file-level changes from `abacus-source-baseline` to HEAD (`4c47623`).
> Evidence: `git diff --stat`, `git diff --name-status`, and `git log`.

## 1. Totals

| Metric | Value |
| --- | --- |
| Commits since baseline | 24 |
| Files changed | 574 |
| Insertions | +20,827 |
| Deletions | −1,713 |
| Added (A) | 545 |
| Modified (M) | 27 |
| Deleted (D) | 2 |
| Renamed/Copied | 0 |
| Hand-written code+docs lines (excl. visual PNGs + lockfile) | 13,539 |
| `package-lock.json` | +4,478 / −882 |

The 545 additions are dominated by generated visual-baseline PNG fixtures under
`nextjs_space/tests/visual/`; the reviewable source surface is the ~120 hand-written files
enumerated in [additions.md](additions.md).

## 2. Deleted files (2)

- `nextjs_space/lib/aws-config.ts`
- `nextjs_space/lib/s3.ts`

## 3. Modified files (27)

`.env.example`, `.github/workflows/ci.yml`, `.gitignore`, `CHANGELOG.md`,
`docs/migration/MIGRATION.md`, and under `nextjs_space/`:
`app/_components/landing-client.tsx`, `app/api/analyze-wound/route.ts`,
`app/api/community-analyze/route.ts`, `app/api/community-chat/route.ts`,
`app/api/hcp-chat/route.ts`, `app/community/_components/community-layout-client.tsx`,
`app/hcp-login/page.tsx`, `app/hcp/_components/hcp-layout-client.tsx`,
`app/hcp/analysis/_components/analysis-client.tsx`,
`app/hcp/parkland/_components/parkland-client.tsx`,
`app/hcp/tbsa/_components/tbsa-client.tsx`, `app/layout.tsx`,
`components/language-provider.tsx`, `components/pwa-install-prompt.tsx`, `lib/db.ts`,
`lib/i18n.ts`, `next.config.js`, `package-lock.json`, `package.json`,
`prisma/schema.prisma`, `scripts/safe-seed.ts`, `tsconfig.json`.

## 4. Added files by area (hand-written)

| Area | Count (approx.) |
| --- | --- |
| `lib/ai/*` | 14 |
| `lib/auth/*` | 10 |
| `lib/storage/*` | 3 |
| `lib/telemetry/*` | 3 |
| `lib/clinical/*`, `lib/config/*`, `lib/health/*`, `lib/analysis/*` | 5 |
| `app/api/*` (auth, health, hcp/analyses) | 11 |
| `app/hcp/history/*`, `app/hcp-login/_components/*`, `components/*`, `instrumentation.ts`, `middleware.ts` | ~7 |
| `infra/*` (main + 11 modules + param) | 13 |
| `.github/workflows/*` (new) | 4 |
| `prisma/migrations/*` | 3 |
| `scripts/*` | 7 |
| `tests/*` (specs + configs) | ~25 |
| `docs/*` (new) | ~12 |

## 5. Commit list (24, newest first)

| Commit | Subject |
| --- | --- |
| `4c47623` | Merge feature/hcp-analysis-history: retain HCP AI analyses in a clinician history page |
| `7e642ed` | feat: retain HCP AI analyses in a clinician history page |
| `643dbbc` | docs: complete Phoenix AI Azure migration audit |
| `f924733` | deploy: release Phoenix AI parity build to Azure |
| `1b1a1d0` | ci: add Azure deployment pipelines using GitHub OIDC |
| `079924b` | fix: achieve Phoenix AI visual parity on Azure |
| `5a71c7c` | fix: complete Phoenix AI interactive control behaviour |
| `bf38989` | test: add complete Phoenix AI functional regression suite |
| `91659e2` | feat: add privacy-conscious Azure observability |
| `77a2991` | feat: prepare Phoenix AI Next.js runtime for Azure App Service |
| `baaa0ea` | feat: add Azure infrastructure as code |
| `27a8b34` | feat: add optional Entra ID authentication for HCP users |
| `b657f65` | refactor: isolate demo authentication for Azure parity release |
| `d486abd` | feat: replace AWS storage helpers with Azure Blob Storage |
| `9a0f3c1` | feat: connect Phoenix AI to Azure PostgreSQL |
| `8909419` | docs: assess Phoenix AI persistence requirements |
| `177107d` | refactor: remove remaining Abacus AI runtime dependencies |
| `3cda1bd` | feat: migrate Phoenix AI model calls to Microsoft Foundry |
| `a45bc92` | refactor: introduce portable AI provider layer |
| `73a3225` | refactor: remove Abacus browser runtime dependency |
| `a51b2df` | test: capture Phoenix AI visual and route baseline |
| `c03aed3` | refactor: preserve Phoenix AI branding and visual system |
| `7378462` | fix: remove Abacus build and filesystem assumptions |
| `3fcd03c` | test: establish Phoenix AI source build baseline |
