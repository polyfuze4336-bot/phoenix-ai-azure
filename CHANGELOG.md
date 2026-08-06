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
