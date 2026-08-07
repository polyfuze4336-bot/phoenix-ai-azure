# Part 4 — Modifications and Enhancements

> Files that existed in the original source and were changed (not replaced wholesale) during
> the migration, plus enhancements layered onto retained behaviour. Evidence:
> `git diff --name-status abacus-source-baseline..HEAD` (status `M`, 27 files) and per-file diffs.

Distinction used here:
- **Modified** — the file's job is the same; its internals were adapted for Azure/Next 14.
- **Enhanced** — retained behaviour plus new, opt-in capability that preserves the original UX.

## 1. API routes (behaviour-preserving backend swap)

| File | Change | Type |
| --- | --- | --- |
| `app/api/analyze-wound/route.ts` | Abacus `fetch` + `ABACUSAI_API_KEY` replaced by `lib/ai` provider call; request/response shape and streaming preserved | Modified |
| `app/api/hcp-chat/route.ts` | Same provider swap; prompt moved to `lib/ai/prompts/hcp-chat.ts` | Modified |
| `app/api/community-chat/route.ts` | Same provider swap; prompt moved to `lib/ai/prompts/community-chat.ts` | Modified |
| `app/api/community-analyze/route.ts` | Same provider swap + Zod validation | Modified |

The visible clinical output contract (assessment JSON, streaming behaviour) is unchanged — only
the backend the routes call changed.

## 2. Client components (auth + telemetry integration)

| File | Change | Type |
| --- | --- | --- |
| `app/hcp-login/page.tsx` | Mock `sessionStorage` login refactored to call the auth abstraction; quick-login cards preserved | Enhanced |
| `app/hcp/_components/hcp-layout-client.tsx` | Session-aware layout; same visual shell | Modified |
| `app/community/_components/community-layout-client.tsx` | Telemetry hooks; same layout | Modified |
| `app/_components/landing-client.tsx` | Telemetry + logo component; same landing UX | Modified |
| `app/hcp/analysis/_components/analysis-client.tsx` | Wired to history persistence; same analysis UX | Enhanced |
| `app/hcp/tbsa/_components/tbsa-client.tsx` | Uses extracted `lib/clinical/tbsa.ts`; identical calculator output | Modified |
| `app/hcp/parkland/_components/parkland-client.tsx` | Uses extracted `lib/clinical/parkland.ts`; identical output | Modified |
| `app/layout.tsx` | `metadataBase` derives from `WEBSITE_HOSTNAME` on Azure; telemetry provider mounted | Modified |
| `components/language-provider.tsx`, `components/pwa-install-prompt.tsx` | Minor Azure-compatibility adjustments; EN/BM + PWA behaviour preserved | Modified |

## 3. Data & persistence

| File | Change | Type |
| --- | --- | --- |
| `prisma/schema.prisma` | Portable generator output, Linux binary target, new `AnalysisRecord` model | Enhanced |
| `lib/db.ts` | Azure PostgreSQL connection (auto `sslmode=require`, pool defaults) | Modified |
| `scripts/safe-seed.ts` | Fictional demo seed adapted for Azure PostgreSQL | Modified |
| `lib/i18n.ts` | Retained EN/BM content; minor structural adjustment | Modified |

## 4. Build & tooling

| File | Change | Type |
| --- | --- | --- |
| `next.config.js` | `output: "standalone"`, Azure hostname handling | Modified |
| `tsconfig.json` | Portable path/base settings for case-sensitive Linux build | Modified |
| `package.json` | Azure deps, test/db scripts, `engines: node >=22 <23`, ESLint alignment | Modified |
| `package-lock.json` | Regenerated (+4,478 / −882) | Modified |
| `.github/workflows/ci.yml` | Build/typecheck/lint/test pipeline | Modified |
| `.gitignore`, `.env.example` | Azure-oriented ignores and variable template | Modified |

## 5. Documentation

| File | Change | Type |
| --- | --- | --- |
| `docs/migration/MIGRATION.md` | Running migration audit log | Modified |
| `CHANGELOG.md` | Keep-a-Changelog migration history | Modified |

## Enhancement summary

The enhancements are **additive and preserve the original visible UX**:
- HCP login gains a real server-verified session while keeping the same quick-login cards.
- Analysis screens gain optional history persistence without changing the assessment flow.
- Layouts gain privacy-safe telemetry with no visible change.

No enhancement removes or redesigns an original user-facing behaviour. See
[retained-functionality.md](retained-functionality.md) for the parity evidence and
[ui-change-report.md](ui-change-report.md) for the visual-parity result.
