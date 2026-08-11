# Part 3 — Additions

> Everything that exists in the current Azure codebase but did **not** exist in the original
> Abacus.AI source. Evidence: `git diff --name-status abacus-source-baseline..HEAD` (status `A`).
> 545 files were added in total; the hand-written additions are grouped below (generated
> visual-baseline PNG fixtures are omitted for readability and counted separately in
> [file-change-summary.md](file-change-summary.md)).

## 1. Portable AI provider layer — `nextjs_space/lib/ai/`

| File | Purpose |
| --- | --- |
| `ai-provider.ts` | Provider selection / entry point |
| `azure-foundry-provider.ts` | Azure OpenAI (Foundry) implementation |
| `azure-credential.ts` | `DefaultAzureCredential` token acquisition |
| `openai-compatible.ts` | OpenAI-compatible request/response mapping |
| `telemetry.ts` | AI-request telemetry hooks |
| `types.ts` | Shared provider types |
| `prompts/{hcp-chat,community-chat,hcp-wound-analysis,community-wound-analysis}.ts` | Extracted system prompts |
| `streaming/{sse,text-stream}.ts` | Streaming response helpers |
| `validation/{image-input,wound-analysis-schema}.ts` | Zod input/output validation |

## 2. Azure Blob storage layer — `nextjs_space/lib/storage/`

`azure-blob-provider.ts`, `storage-provider.ts`, `types.ts` — managed-identity Blob access,
private container, user-delegation SAS reads. Sanctioned replacement for the removed AWS S3 helpers.

## 3. Authentication abstraction — `nextjs_space/lib/auth/`

10 files: `auth-config.ts`, `auth-provider.ts`, `current-session.ts`, `demo-provider.ts`,
`demo-users.ts`, `entra-config.ts`, `entra-flow.ts`, `entra-provider.ts`, `session.ts`, `types.ts`.
Plus API routes `app/api/auth/{login,logout,session}/route.ts` and
`app/api/auth/entra/{login,callback}/route.ts`, and `middleware.ts` (HCP route protection),
`app/hcp-login/_components/login-client.tsx`.

## 4. Observability — telemetry & health

| Area | Files |
| --- | --- |
| Telemetry | `lib/telemetry/{client,correlation,server}.ts`, `components/telemetry-provider.tsx`, `instrumentation.ts` |
| Health | `app/api/health/{live,ready,db}/route.ts` + `app/api/health/route.ts`, `lib/health/readiness.ts` |

## 5. HCP analysis history feature (post-parity)

`app/hcp/history/page.tsx`, `app/hcp/history/_components/history-client.tsx`,
`app/api/hcp/analyses/route.ts`, `app/api/hcp/analyses/[id]/route.ts`,
`lib/analysis/history.ts`, Prisma `AnalysisRecord` model + migration.

## 6. Clinical calculation modules

`lib/clinical/tbsa.ts`, `lib/clinical/parkland.ts` — extracted, unit-tested TBSA and Parkland logic.

## 7. Configuration & environment helpers

`lib/config/environment.ts`, `components/phoenix-logo.tsx`, `nextjs_space/.eslintrc.json`.

## 8. Infrastructure as code — `infra/`

`main.bicep`, `main.bicepparam`, and 11 modules under `infra/modules/`:
`managed-identity`, `log-analytics`, `application-insights`, `key-vault`, `storage`,
`postgresql`, `app-service-plan`, `app-service`, `role-assignments`, `foundry-connection`, `alerts`.

## 9. CI/CD — `.github/workflows/`

`deploy-demo.yml`, `deploy-dev.yml`, `infrastructure.yml`, `db-migrate.yml`
(the original had only the newly-added `ci.yml`). Uses GitHub OIDC federation.

## 10. Prisma migrations & scripts

`prisma/migrations/20260806120000_init/migration.sql`,
`prisma/migrations/20260807090000_analysis_records/migration.sql`, `migration_lock.toml`.
Scripts: `scripts/{db-readiness,seed,seed-data,validate-migration,visual-parity-diff,visual-parity-report}.ts`
and `scripts/make-standalone-zip.py`.

## 11. Test suites — `nextjs_space/tests/`

| Suite | Location |
| --- | --- |
| Unit | `tests/unit/*.test.ts` (ai-parsing, auth, config, db-mappings, image-input, language, parkland, storage, tbsa, wound-schema) |
| Integration | `tests/integration/{db,health,storage}.integration.test.ts` |
| E2E | `tests/e2e/{public-landing,hcp-journey,community-journey,clickable-controls}` + `_helpers` |
| API | `tests/api/routes.spec.ts` |
| Network | `tests/network/no-abacus.spec.ts` |
| Playwright configs | `playwright.{,e2e,api,network}.config.ts` |

## 12. Documentation

`docs/data/postgresql-data-model.md`, `docs/migration/{brand-parity-checklist,build-health-report,final-migration-audit,persistence-gap-assessment,source-baseline-manifest,source-code-audit}.md`,
`docs/security/authentication.md`, `docs/testing/{clickable-control-register,visual-baseline,visual-parity-report}.md`.

## 13. New runtime dependencies

Added packages (see [dependency-changes.md](dependency-changes.md)): `@azure/identity`,
`@microsoft/applicationinsights-web`, `applicationinsights`, `jose`, `@playwright/test`,
`pixelmatch`, `pngjs`, `@types/pixelmatch`, `@types/pngjs`.

## 14. Live Azure resources (12)

Provisioned by the Bicep IaC — see [deployment-and-operations-changes.md](deployment-and-operations-changes.md)
for the full inventory (App Service, plan, PostgreSQL, Storage, Key Vault, UAMI, Log Analytics,
App Insights, 2 alerts, action group, smart-detector storage).
