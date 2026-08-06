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
- Abacus runtime-dependency guard: `nextjs_space/tests/network/no-abacus.spec.ts` +
  `nextjs_space/playwright.network.config.ts` (script `test:network`). Loads every public route
  in a real browser and fails if any browser request targets an Abacus-owned domain
  (`apps.abacus.ai`, `abacus.ai`, or any `*.abacus.ai` / `*.abacusai.*` asset host).
- Portable AI provider layer under `nextjs_space/lib/ai/` so the app is no longer hard-wired to
  Abacus.AI. Provider-neutral interfaces (`AiProvider`, `AiMessage`, `AiChatRequest`,
  `AiStreamResponse`, `AiError`) support text chat, multimodal image analysis, streaming text and
  streaming structured JSON, model selection, max output tokens, correlation IDs, timeout, retry,
  cancellation, and structured errors. Two interchangeable providers — `AbacusProvider`
  (current) and `AzureFoundryProvider` (Azure OpenAI target) — share one OpenAI-compatible
  transport. A new `AI_PROVIDER` env var selects the backend (`abacus` | `azure`); it defaults
  to `abacus` for now and becomes `azure` on Azure once Azure OpenAI is provisioned. System
  prompts were moved verbatim into `lib/ai/prompts/`; the four API routes now call the
  abstraction. No API keys are exposed to the browser and the streamed output is byte-identical.
- Real Microsoft Foundry / Azure OpenAI model integration (the `azure` provider is now
  production-ready; `AI_PROVIDER` still defaults to `abacus` until cutover):
  - Managed-identity authentication via `lib/ai/azure-credential.ts` (`DefaultAzureCredential`,
    Cognitive Services scope, in-process token cache; user-assigned identity via `AZURE_CLIENT_ID`;
    Azure CLI locally). `AZURE_AI_API_KEY` is an explicit temporary fallback only.
  - `azure-foundry-provider.ts` rewritten to read `AZURE_AI_ENDPOINT` / `AZURE_AI_PROJECT_ENDPOINT`
    / `AZURE_AI_MODEL_DEPLOYMENT` / `AZURE_AI_API_VERSION` / `AZURE_AI_AUTH` / `AZURE_CLIENT_ID`
    (legacy `AZURE_OPENAI_*` names still accepted), with 60 s timeout + 2 retries by default and
    `stream_options.include_usage` for exact token telemetry.
  - Resilient transport: exponential backoff with jitter, 429 handling (honours `Retry-After`),
    per-request timeout, correlation-ID propagation, and a byte-identical stream wrapper recording
    latency + token metrics.
  - `lib/ai/telemetry.ts`: structured, privacy-safe request/response telemetry (correlation ID,
    provider, model, route, attempts, latency, tokens) that never logs image or message content.
  - `lib/ai/validation/image-input.ts`: MIME-type allow-list + max decoded image size
    (`AZURE_AI_MAX_IMAGE_MB`, default 10) enforced before any provider call.
  - Zod-validated structured results (`hcpWoundAnalysisSchema`, `communityWoundAnalysisSchema`,
    derived from the front-end fields) with an explicit "assessment could not be completed" safe
    fallback that preserves the medical disclaimer and never fabricates clinical findings.
  - Added `@azure/identity@4.13.1`. New `AZURE_AI_*` variables documented in `.env.example`.
- Connected the Prisma data layer to **Azure Database for PostgreSQL Flexible Server** (database
  plumbing only; the dashboard/articles UI still renders the original demo content, preserving
  visible parity):
  - Health/readiness routes `GET /api/health` (liveness) and `GET /api/health/db` (`SELECT 1`
    readiness, 503 when unavailable).
  - Initial migration `prisma/migrations/20260806120000_init` (+ `migration_lock.toml`), offline
    validation `scripts/validate-migration.ts` (`npm run db:migrate:validate`) and a `db-validate`
    CI job, plus a controlled `prisma migrate deploy` workflow
    `.github/workflows/db-migrate.yml` (`workflow_dispatch`, `environment: production`).
  - Idempotent, fictional, non-destructive, clearly-marked seed `scripts/seed.ts` (48 `Case` rows +
    5 `Article` rows via `upsert`) run through the hardened `scripts/safe-seed.ts` guard.
  - Gated integration test `tests/integration/db.integration.test.ts` (`npm run test:integration`,
    skips without `DATABASE_URL`) and new `db:*` npm scripts.
  - Reference doc `docs/data/postgresql-data-model.md`.
- Azure-native storage layer `nextjs_space/lib/storage/` (`types.ts`, `azure-blob-provider.ts`,
  `storage-provider.ts`) as the sanctioned replacement for the removed AWS S3 helpers. Server-only:
  managed identity (`DefaultAzureCredential`, no account key), private container, short-lived
  read-only **user delegation SAS**, MIME + max-size validation, unique UUID/date-partitioned blob
  paths, sanitised metadata, safe deletion, and an optional server-side upload-progress callback. It
  is deliberately **not wired** into any UI workflow — no current Phoenix AI workflow persists files
  (wound/burn images are handled as ephemeral base64) — so there is no visible UX change.
- Isolated the demo HCP login behind an `AUTH_MODE` feature flag (`demo` default, `entra`
  placeholder) and an authentication abstraction `nextjs_space/lib/auth/` (`AuthProvider` contract,
  `DemoAuthProvider`, `EntraAuthProvider` placeholder, `getAuthProvider()` factory). Demo credentials
  moved server-side (`lib/auth/demo-users.ts`, overridable via `DEMO_AUTH_PASSWORD` /
  `DEMO_AUTH_ADMIN_PASSWORD`) and verified through a new `POST /api/auth/login` route; passwords no
  longer appear in browser source and quick-login no longer writes a plaintext password into the
  form. The visual login, quick-login cards, `/hcp-login` + `/hcp` routes, `sessionStorage` session,
  and "Demo Mode" label are preserved (no visible UX change). New `docs/security/authentication.md`
  documents why `sessionStorage` auth is not suitable for production healthcare use and how to protect
  the demo at the platform level (App Service Easy Auth / Entra, access restrictions).
- Added **optional Microsoft Entra ID authentication** for HCP users (`AUTH_MODE=entra`, opt-in and
  **not** enabled by default). Real OpenID Connect sign-in (authorization code + PKCE with
  `state`/`nonce`), server-validated signed **httpOnly** session cookie (`hcp_session`, HS256 via
  `jose`, `SESSION_SECRET`), and JWT-`exp` session expiration (`AUTH_SESSION_TTL_MINUTES`, default
  60). Role mapping to Doctor / Nurse / Administrator via Entra **App Roles** (preferred) or security
  **groups** (`AZURE_ENTRA_GROUP_*`), precedence Administrator > Doctor > Nurse; unmapped users are
  Forbidden. New routes `nextjs_space/app/api/auth/entra/{login,callback}`, `.../auth/logout`,
  `.../auth/session`, and `nextjs_space/middleware.ts` server-enforcing HCP page + API protection
  (`/hcp`, `/hcp/*`, `/api/hcp-chat`, `/api/analyze-wound`) with **no client-only route guard** — the
  community portal and its APIs stay public, and middleware is a no-op in demo mode. The login page
  preserves its appearance while redirecting the sign-in action to Entra and surfacing explicit
  Unauthorised / Forbidden states. `.env.example` and `docs/security/authentication.md` document the
  Entra app registration, role mapping, and session configuration (server-only, no secrets committed).
- Added **Azure infrastructure as code** (Bicep) under `infra/`: a subscription-scoped
  `main.bicep` that creates the `rg-phoenixai-demo` resource group and provisions App Service
  (Linux Node 22 hosting the Next.js server), PostgreSQL Flexible Server, Blob Storage, Key Vault,
  Application Insights, Log Analytics, and a user-assigned managed identity with least-privilege
  role assignments — plus operational alerts. The existing Microsoft Foundry `gpt-4o` deployment
  (`aif-yfjw6y`) is **reused read-only** (cross-resource-group `Cognitive Services OpenAI User`
  role) instead of provisioning a new model. All resources are tagged (`Application=PhoenixAI`,
  `Environment=Demo`, `Workload=BurnAndWoundCare`, `ManagedBy=Bicep`, `Owner`, `CostCentre`) and
  use managed identity — no account keys or secrets. Added `.github/workflows/infra.yml`
  (GitHub Actions OIDC: PR lint + build + what-if, gated manual deploy). Bicep lints and builds
  cleanly; subscription what-if validated the template (the only blocker is 0 App Service compute
  quota in the sandbox subscription, an environment limitation).
- Prepared the Next.js runtime for **Azure App Service (Linux, Node 22)**: pinned the supported
  Node LTS via `package.json` `engines` (`>=22 <23`); a standalone production build (`node server.js`)
  that binds to Azure's `PORT` and keeps deep links working after refresh. Added Kubernetes-style
  health probes `GET /api/health/live` (liveness, no dependencies) and `GET /api/health/ready`
  (readiness — checks only runtime, PostgreSQL when enabled, Azure AI endpoint *configuration*, and
  Blob Storage when enabled; never calls the AI model). Added a server-only runtime config +
  environment-validation module (`lib/config/environment.ts`) surfaced at boot via Next.js
  instrumentation (`instrumentation.ts`, warns but never crashes), and removed the hard `localhost`
  dependency from `metadataBase` (derives the site URL from `WEBSITE_HOSTNAME`). Hardened the
  streaming AI routes for App Service (`runtime = 'nodejs'`, `maxDuration`, a `Content-Length`
  body-size guard returning 413 for oversized image uploads, and a 110 s request timeout on image
  analysis). Reviewed Next.js image configuration and deliberately kept `images.unoptimized: true`
  (all images are local static assets, the logo requires pixel fidelity, and visual baselines assert
  parity) — optimisation is left off until proven non-destructive.
- Added **privacy-conscious Azure observability** with Application Insights across every tier, a
  no-op when unconfigured (local dev / demo) so the visible experience is unchanged. Server side uses
  the classic `applicationinsights` SDK via a manually-constructed `TelemetryClient` (no
  auto-instrumentation) initialised at startup (`lib/telemetry/server.ts`, `instrumentation.ts`);
  the browser uses `@microsoft/applicationinsights-web` via a `TelemetryProvider` mounted in the root
  layout (`lib/telemetry/client.ts`, `components/telemetry-provider.tsx`). Instruments page load,
  route transitions, API/AI request duration, AI streaming completion, AI errors, image-analysis and
  chat requests, TBSA + Parkland calculations, language changes, demo login mode, PostgreSQL and Blob
  latency, and JavaScript + server exceptions. Custom events (`hcp_chat_requested`,
  `hcp_analysis_requested`, `community_chat_requested`, `community_analysis_requested`,
  `tbsa_calculated`, `parkland_calculated`, `language_changed`, `demo_login_completed`) carry
  **counts + non-sensitive metadata only**. A correlation ID threads browser → API route → AI
  provider → PostgreSQL → Blob Storage via an `x-correlation-id` header + W3C distributed tracing.
  All telemetry passes through a sanitiser that drops blocked keys and never forwards uploaded
  images, base64, medical descriptions, chat transcripts, sensitive prompts/responses, tokens,
  passwords, API keys or connection strings. Added the browser
  `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING` app setting (Bicep) and documented both
  variables in `.env.example`.
- Added a **complete functional regression suite** covering the clinical logic, configuration and
  the three end-user journeys, with **no test skipped because a workflow is unavailable**:
  - **Unit tests** (`nextjs_space/tests/unit/*.test.ts`, `tsx --test`, 76 tests): TBSA and Parkland
    calculations, language switching, AI response parsing, wound-analysis schema validation,
    environment/configuration validation, authentication mode + demo users, storage validation, and
    the deterministic demo-data/DB mappings.
  - **Integration tests** (`nextjs_space/tests/integration/*.integration.test.ts`, `tsx --test`,
    14 tests): readiness aggregation for the health endpoints, Blob Storage config/validation gating
    (disabled ≠ broken), and PostgreSQL `buildDatasourceUrl` hardening (live DB layer runs only when
    `DATABASE_URL` is set). HTTP-level integration for the four AI routes + health probes runs via
    Playwright (`nextjs_space/tests/api/routes.spec.ts`, 14 tests): `/api/hcp-chat`,
    `/api/community-chat`, `/api/analyze-wound`, `/api/community-analyze` are exercised for input
    validation (400 invalid, 413 oversized body) and asserted to reach a **deterministic terminal
    response** — a stream when Azure OpenAI is configured, an explicit error status otherwise.
  - **Playwright user journeys** (`nextjs_space/tests/e2e/*.spec.ts`, 3 specs): the public landing
    journey (Phoenix + KKM/HKL logos, HCP + community entries, language switching, responsive nav),
    the HCP journey (demo login → analysis + image upload + AI assessment → chat → TBSA canvas
    calculation → Parkland fluid calculation → guidelines → mobile nav → logout), and the community
    journey (first aid, articles, assessment, image-check upload, chat, EN/BM switch, mobile nav).
    AI-backed steps assert the loading state then **either** the structured result **or** the app's
    explicit failure/fallback state, so they verify the workflow without ever skipping.
  - New Playwright configs `playwright.e2e.config.ts` and `playwright.api.config.ts`; new scripts
    `test:unit`, `test:api`, a repointed `test:e2e`, and a `test:integration` that globs all
    integration files; `test` now runs unit + integration. Verified: `typecheck` ✅ 0,
    `lint` ✅ 0/0, `build` ✅ 21 routes, `test:unit` ✅ 76, `test:integration` ✅ 14,
    `test:api` ✅ 14, `test:e2e` ✅ 3, `test:network` ✅ 1.
- Audited **every visibly clickable control** across all 14 routes and the shared shells, and
  recorded the result in `docs/testing/clickable-control-register.md` (columns: Route, Control,
  Label, Expected action, Actual action, Status, Automated test, Defect, Resolution). Finding:
  every rendered control performs a real, wired action — no `href="#"`, empty handlers, placeholder
  alerts, dead links, animate-only buttons, or silently-failing controls. Categories absent from the
  original (report/export, theme switch, tablists, modal dialogs) were **not fabricated**, and the
  unused `theme-provider` / `theme-toggle` / `layouts/*` starter scaffolding was left unrendered
  rather than wired in (no fake actions added). Added a deterministic guard,
  `nextjs_space/tests/e2e/clickable-controls.spec.ts` (14 cases), that fails if any route gains a
  placeholder anchor or an unresolvable in-app link. Verified: `typecheck` ✅ 0, `lint` ✅ 0/0,
  `build` ✅ 21 routes, `test:e2e` ✅ 17 (3 journeys + 14 guard cases).
- Ran **strict visual parity testing** against the captured source baseline. Re-captured the Azure
  production build across every route/viewport/language/state (143 PNGs → `tests/visual/current/`)
  via a new `VISUAL_OUT_DIR` switch on the existing capture spec, then pixel-diffed each state with
  `pixelmatch` (`scripts/visual-parity-diff.ts` → `tests/visual/diff/` masks + `parity-results.json`)
  and generated `docs/testing/visual-parity-report.md` (`scripts/visual-parity-report.ts`) with the
  required columns (Route, Viewport, Baseline, Azure, Difference image, Difference %, Pass/fail,
  Accepted exception, Explanation), a design-token/layout parity table, and a 12-row release-blocker
  checklist. **Result: visual parity achieved** — 141/143 states pixel-identical (max diff 0.7368%);
  Phoenix logo SHA-256/size/aspect ratio and the KKM/HKL logo verified; **all 12 release blockers
  CLEAR**. Two mobile HCP-dashboard states are **accepted exceptions** (Recharts entrance-animation
  frame — chart arc anti-aliasing only; every value/label/card/text pixel-identical), documented
  **without altering the UI**. Added dev deps `pixelmatch`/`pngjs` (+ types). Verified: `typecheck`
  ✅ 0, `lint` ✅ 0/0, `build` ✅ 21 routes.
- `npm install --legacy-peer-deps` succeeds (1064 packages).
- `npm ci --legacy-peer-deps` succeeds (exit 0) with Node v22.19.0 / npm 10.9.3.
- `npx tsc --noEmit` passes with 0 type errors.
- `npm run build` (`next build`) compiles successfully â€” 17/17 routes generated.
- Development server serves all 14 application routes with HTTP 200 and no server errors.

### Changed
- Hardened the Prisma client (`nextjs_space/lib/db.ts`): auto-applies `sslmode=require` and modest
  connection-pool defaults (`connection_limit`/`pool_timeout`/`connect_timeout`) to `DATABASE_URL`,
  and adds a transient-failure retry helper (`withDbRetry`) and readiness check
  (`checkDatabaseReady`).
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
- `package.json`: added `test:network` (runs the Abacus guard). `tsconfig.json` also excludes
  `playwright.network.config.ts` from the Next app type project.
- The four AI API routes (`analyze-wound`, `hcp-chat`, `community-analyze`, `community-chat`) now
  call the `lib/ai` provider abstraction instead of `fetch`-ing `apps.abacus.ai` directly. Error
  strings, status codes, SSE/text streaming framing, the two community-analyze fallbacks, and all
  clinical prompts are preserved unchanged; the default backend stays Abacus (`AI_PROVIDER=abacus`).
- Wound-analysis result parsing now validates the model output with Zod and, on invalid data,
  returns an explicit "assessment could not be completed" safe-fallback state (with the medical
  disclaimer) instead of echoing the raw model buffer or fabricating fields. This replaces the
  source app's prior raw-buffer fallbacks (including the community route's two `[DONE]` vs
  end-of-stream wordings); the fallback is still delivered as the existing `status: 'completed'`
  SSE result event, so no front-end change is required.
- The analysis routes now validate image MIME type and size before calling the provider, and all
  four routes attach a correlation ID (echoed via the `x-correlation-id` response header).
- `.env.example`: added `AI_PROVIDER` and the Azure OpenAI settings (`AZURE_OPENAI_ENDPOINT`,
  `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`) — templates only,
  no secrets.
- Azure OpenAI (Microsoft Foundry) is now the single, default AI backend. `getAiProvider()`
  returns the Azure provider directly (the `AI_PROVIDER` selector and the `abacus` branch are gone).
  The model/deployment name comes solely from configuration (`AZURE_AI_MODEL_DEPLOYMENT` /
  `AZURE_OPENAI_DEPLOYMENT`); no model name is hard-coded in any route. Streaming framing, error
  wording, status codes, and clinical prompts are unchanged.
- `.env.example`: removed `AI_PROVIDER` and `ABACUSAI_API_KEY`; the AI section now documents only
  the Azure OpenAI settings (managed-identity default). Templates only, no secrets.

### Removed
- Removed the unused AWS S3 storage helpers after confirming no page, route, or component imported
  them: deleted `nextjs_space/lib/s3.ts` and `nextjs_space/lib/aws-config.ts`, and uninstalled
  `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` (26 transitive packages). Replaced by the
  Azure-native `lib/storage/` layer. `.env.example` swapped the `AWS_*` storage variables for
  `AZURE_STORAGE_*`.
- Removed the Abacus.AI runtime provider entirely: deleted `lib/ai/abacus-provider.ts` (the
  `https://apps.abacus.ai/v1/chat/completions` call, `ABACUSAI_API_KEY` credential, hard-coded
  `gpt-5.4-mini` default model, and Abacus-specific error/config wording). Narrowed
  `AiProviderName` to `'azure'` and dropped the provider-selection compatibility code. No
  production runtime dependency on Abacus.AI remains (the browser guard test is retained). The
  historical migration record continues to reference Abacus.AI where relevant.
- Removed the Abacus-hosted browser script `https://apps.abacus.ai/chatllm/appllm-lib.js` from
  `app/layout.tsx` (the Abacus platform preview/chat-widget loader). A full codebase search
  confirmed no application code references any global, function, or object it provides, so no
  page functionality changes and no replacement behaviour was required. Server-side AI calls
  (`app/api/*` → `apps.abacus.ai`) are intentionally left for a later step.

### Fixed
- `app/hcp/analysis/_components/analysis-client.tsx`: added the missing `stopCamera` dependency
  to the `capturePhoto` `useCallback` (behaviour-preserving) — the only lint defect.
- AI API routes now emit a clear development configuration error and server log when
  `ABACUSAI_API_KEY` is absent, instead of a terse "API key not configured" (response shape and
  500 status unchanged).

### Known issues / follow-ups
- `next@14.2.28` security advisory — to be addressed in a dedicated dependency-hardening change.
- Abacus.AI **server-side** LLM endpoint (`app/api/*` → `apps.abacus.ai`) still to be migrated to
  Azure OpenAI. The injected browser chat widget has been removed (see Removed, above).
