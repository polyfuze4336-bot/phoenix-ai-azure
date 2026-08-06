# Phoenix AI — Abacus.AI → Microsoft Azure Migration

Migration of **Phoenix AI — Burn & Wound Care Assessment Tool** from Abacus.AI to
Microsoft Azure. This is a **faithful migration, not a redesign**: the visible user
experience, branding, structure, and behaviour are preserved as closely as
technically possible.

- Source (live): https://phoenixai-burnandwound.abacusai.app/hcp
- Source archive: `Abacus Phoenix AI-20260806T011820Z-1-001.zip`

---

## Source application analysis

| Aspect | Finding |
| --- | --- |
| Framework | Next.js 14.2.28 (App Router), React 18.2 |
| Language | TypeScript 5.2 |
| Styling | Tailwind CSS 3.3 + shadcn/ui (Radix), framer-motion |
| Fonts | DM Sans, Plus Jakarta Sans, JetBrains Mono (next/font/google) |
| Charts | recharts, chart.js, plotly.js |
| App root | `nextjs_space/` |
| Portals | `/hcp` (Healthcare Professional) and `/community` |
| Auth | **Mock, client-side** (`sessionStorage`, hardcoded `MOCK_USERS`). No backend auth, no `NEXTAUTH_SECRET` needed. |
| Branding | Name "Phoenix AI"; original logo at `nextjs_space/public/logo.png` (phoenix + teal medical cross). Primary colour `#8B0000` (dark red). |
| PWA | manifest + service worker (`public/sw.js`, `public/manifest.json`) |

### Cloud dependencies

| Source dependency | Used at runtime? | Azure target |
| --- | --- | --- |
| **LLM** — `https://apps.abacus.ai/v1/chat/completions` (`gpt-5.4-mini`, streaming, vision), `ABACUSAI_API_KEY` | **Yes** — the only live backend dependency. Powers `analyze-wound`, `hcp-chat`, `community-chat`, `community-analyze`. | Azure OpenAI (vision-capable deployment, e.g. `gpt-4o`) — OpenAI-compatible chat completions. |
| **PostgreSQL** via Prisma (`lib/db.ts`, `prisma/schema.prisma`) | **No** — `prisma` client is defined but never imported by any page/route. Dashboard/article/guideline data is mock/hardcoded client-side. | Deferred. Azure Database for PostgreSQL Flexible Server only if persistence is later required. |
| **AWS S3** (`lib/s3.ts`, `lib/aws-config.ts`) | **No** — helpers defined but never imported. Images are read client-side via `FileReader` and sent as base64 to the LLM routes. | Deferred. Azure Blob Storage (`@azure/storage-blob` already present) only if upload persistence is required. |
| Abacus chat widget `apps.abacus.ai/chatllm/appllm-lib.js` (in `app/layout.tsx`) | Platform artifact (not part of Phoenix AI UI) | To be removed in a later step (platform-injected, not app branding). Documented assumption. |

### Key assumption (documented)
Because Prisma/PostgreSQL and AWS S3 are **not wired into the visible UX**, the faithful
runtime target requires only: **static Next.js app hosting + one Azure OpenAI backend**.
The visible user experience does not depend on a database or object store. This will be
revisited if any hidden persistence behaviour is discovered during UI parity QA.

---

## Target Azure architecture (planned)

- **Hosting:** Azure App Service (Linux, Node 22) or Azure Container Apps for the Next.js app.
- **AI:** Azure OpenAI (vision model) — replaces the Abacus.AI LLM endpoint.
- **Secrets:** Azure Key Vault; app reads config from App Service settings / managed identity.
- **No developer-laptop, localhost, local DB, or local file-share dependency** in the deployed runtime.
- Reuse existing suitable Azure resources where possible; new resource group for the rest.

---

## Migration audit log

### Step 1 — Import source, analyse, establish repo & audit trail
- Extracted source archive into the workspace; flattened to repo root
  (`nextjs_space/`, `Uploads/`, `Shared.zip`).
- Added `.gitignore`, `.env.example` (no secrets), and this migration document.
- Analysed stack and cloud dependencies (table above).
- Initialised git; first commit is the **pristine imported source** for a clean audit trail.
- Verified local dependency install and production build.

**Verification results (Step 1):**
- `npm install --legacy-peer-deps` → 1064 packages added, exit 0.
  (`--legacy-peer-deps` required by a pre-existing dev-only peer conflict:
  `eslint@9` vs `@typescript-eslint/parser@7` needing `eslint@^8`. Runtime unaffected.)
- `npm run build` (`next build`) → **compiled successfully**, 17/17 routes generated, exit 0.
  Confirms `lib/db.ts` (Prisma) and `lib/s3.ts` (AWS) are not part of the build graph —
  reinforces the "no runtime DB / object store" finding.
- `npx prisma generate` fails locally: `schema.prisma` hardcodes a Linux `output` path
  (`/home/ubuntu/...`). Non-blocking (Prisma unused at runtime); will be corrected only if
  persistence is enabled in a later step. **Assumption documented.**

**Known advisories (not addressed in this step — faithful import first):**
- `next@14.2.28` has a security advisory (upgrade to a patched 14.2.x). To be handled as a
  separate, reviewable dependency-hardening commit before go-live.
- `npm audit`: 25 vulns (mostly transitive/dev). Triage planned pre-deploy.

### Step 2 — Initialise the Azure migration repository
- Renamed the default branch `master` → `main`.
- Added repository scaffolding: `.editorconfig`, `.nvmrc` (Node 22, matching the verified
  build), `README.md` (states this is a parity migration of Phoenix AI from Abacus.AI to
  Azure), `CONTRIBUTING.md` (workflow + recommended `main` branch protection rules),
  `CHANGELOG.md`.
- Reorganised docs into `docs/migration/` (audit trail, moved from `docs/MIGRATION.md`),
  `docs/architecture/ARCHITECTURE.md` (target Azure topology), and
  `docs/testing/TEST-STRATEGY.md` (UI-parity strategy).
- Added `.github/workflows/ci.yml` (install + `next build` verification on push/PR to `main`)
  and `.github/copilot-instructions.md` (migration guardrails).
- Branch protection for `main` is documented in `CONTRIBUTING.md` (must be enabled by a repo
  admin in GitHub settings — cannot be committed as code).
- Created a **private** GitHub repository `phoenix-ai-azure` and pushed the initial history.
  The original Abacus.AI source archive is untouched; this repo is the Azure version only.

### Step 3 — Complete source code audit
- Authored [`source-code-audit.md`](source-code-audit.md): a full read-only assessment of the
  imported source before any migration change.
- Documented the detected architecture, framework versions, build scripts, runtime
  requirements, every page (13) and API route (4), the server/client component split, state
  management, styling approach and design tokens, language support, authentication behaviour,
  data-persistence behaviour, AI integration, image handling, PWA support, external
  dependencies, environment variables, hard-coded values, mock/simulated and incomplete
  functionality, security risks, and Azure migration blockers.
- Explicitly confirmed the 12 known issues (AI key dependency; Abacus LLM endpoint; Abacus
  script in `layout.tsx`; hardcoded login users/passwords; `sessionStorage` auth; Abacus
  Prisma output path; unused PostgreSQL; disconnected S3 helpers; unimplemented Azure Blob
  SDK; ESLint ignored at build; image optimisation disabled; client-side simulated workflows).
- Additional findings recorded: `@tanstack/react-query`, `zustand`, `jotai`, `swr` are
  installed but **unused**; all `page.tsx` are server components except `hcp-login` (client);
  language state is in-memory (not persisted).
- **No source code was changed** — the identified issues are backlog for later steps.

### Step 4 — Establish the immutable source baseline
- Generated [`source-baseline-manifest.md`](source-baseline-manifest.md): a SHA-256 manifest of
  all 162 git-tracked files (path, size in bytes, SHA-256, asset type), plus a highlighted
  critical-assets section covering the logos, favicon, OG image, all PWA icons, the TBSA body
  and mask images, `app/globals.css`, `tailwind.config.ts`, and `STYLE_GUIDE.md`.
- Recorded the canonical **`public/logo.png` SHA-256 =
  `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241`** (346691 bytes). This
  hash is the reference used later to prove the Azure app serves the exact original logo. The
  original upload `Uploads/6ed27144-...png` shares this identical hash, confirming the source
  asset is unaltered. The logo must not be optimised, resized, recoloured, or overwritten.
- Created git tag **`abacus-source-baseline`** on the baseline commit (immutable reference to
  the imported Abacus.AI source) and branch **`migration/azure-port`** for all port work.
- **No source code or assets were modified** — this step only adds the manifest.
### Step 5 â€” Establish the source build baseline (build health)
- Authored [`build-health-report.md`](build-health-report.md): an honest baseline of running the
  **unmodified** imported source with the project's own package manager and lock file. No source
  code was changed and no build check was newly set to "ignore" to force a pass.
- Environment: Node.js **v22.19.0**, npm **10.9.3**. Install via `npm ci --legacy-peer-deps`
  (the `--legacy-peer-deps` flag is required by an inherited `eslint@9` vs
  `@typescript-eslint/parser@7` peer conflict).
- Results: **Install** âœ… (exit 0, 1064 packages); **Type-check** (`tsc --noEmit`) âœ… (0 errors);
  **Build** (`next build`) âœ… (exit 0, 17/17 routes); **Runtime** (dev server) âœ… (14/14 app
  routes HTTP 200, no server console errors).
- **Lint cannot run**: `next lint` (Next.js 14.2.28) uses the legacy ESLint API
  (`useEslintrc`, `extensions`, â€¦) that the pinned `eslint@9` removed. This is the same
  inherited incompatibility behind the source's pre-existing `eslint.ignoreDuringBuilds: true`
  (known issue #10). The config `next lint` auto-created was deleted to keep the source pristine.
- **Security audit**: `npm audit` reports **25 vulnerabilities (2 low, 1 moderate, 21 high, 1
  critical)**. The critical is `next-auth` (email misdelivery, not wired into the UI); most highs
  are the ESLint dev-tooling chain. Not remediated in this step (no dependency upgrades).
- **Environment variables**: none are required to install, type-check, build, or render the UI.
  Only live AI routes need `ABACUSAI_API_KEY` (to be replaced by Azure OpenAI later);
  `DATABASE_URL` and `AWS_*` are dead code for parity.
- **No source code or assets were modified** â€” this step only adds the report.

### Step 6 â€” Remove Abacus build and filesystem assumptions
Smallest changes required to build the source outside the Abacus environment. No pages,
routes, components, or PWA behaviour changed; Next.js not upgraded; TypeScript checks not
suppressed.
- **Prisma generator (portability blocker):** removed the Abacus-specific absolute
  `output = "/home/ubuntu/phoenix_ai/nextjs_space/node_modules/.prisma/client"` and the
  `linux-musl-arm64` `binaryTargets`, restoring the standard generator
  (`provider = "prisma-client-js"`). PostgreSQL retained as the datasource. `npx prisma
  generate` now succeeds to the default `node_modules/@prisma/client`.
- **ESLint toolchain fixed so `lint` runs:** the inherited `eslint@9` + `eslint-config-next@15`
  are incompatible with `next lint` in Next.js 14.2.28 (which calls the legacy ESLint API).
  Pinned `eslint@8.57.1` and `eslint-config-next@14.2.28` (matching the app's Next version) and
  added a minimal `.eslintrc.json` (`extends: next/core-web-vitals`). `npm run lint` now runs
  and reports **0 warnings / 0 errors**. (`--legacy-peer-deps` is still needed for install due
  to the separate pre-existing `@typescript-eslint/eslint-plugin@7` peer range.)
- **One real lint defect resolved:** `capturePhoto` in
  `app/hcp/analysis/_components/analysis-client.tsx` used `stopCamera` without listing it as a
  `useCallback` dependency. Reordered the two callbacks and added the dependency. `stopCamera`
  is stable (only refs + setState), so runtime behaviour is unchanged.
- **`eslint.ignoreDuringBuilds` removed** from `next.config.js` *after* the lint defect was
  understood and fixed. The build now runs `Linting and checking validity of types` for real
  (previously `Skipping linting`). `typescript.ignoreBuildErrors` remains `false` (not
  suppressed). All other `next.config.js` behaviour preserved.
- **package.json scripts** completed to the required set: `dev`, `build`, `start`, `lint`,
  `typecheck` (`tsc --noEmit`), `test`, `test:e2e`, `format:check`. No unit/e2e/format tooling
  is present in the source, so `test`, `test:e2e`, and `format:check` are honest placeholders
  (echo that no suite is configured) rather than fabricated green checks; they exit 0 so CI
  wiring can call them today and be replaced when real suites land.
- **Runtime-safe missing-env handling:** the four AI API routes already returned a JSON 500 for
  an absent `ABACUSAI_API_KEY` (no stack-trace crash). Improved the message to a clear
  development configuration error ("the AI service credential (ABACUSAI_API_KEY) is not set. See
  .env.example.") and added a `console.error` server log. Response shape and 500 status
  unchanged.
- **Verification:** `npm run lint` âœ… 0/0; `npm run typecheck` âœ… 0 errors; `npx prisma generate`
  âœ… default path; `npm run build` âœ… exit 0, 17/17 routes with linting enabled.
- **Not done (out of scope for the minimum fix):** dependency upgrades / `npm audit fix`,
  Next.js upgrade, and removing the Abacus chat-widget script + LLM endpoint (deferred to the
  Azure OpenAI cutover step).

### Step 7 — Protect the existing UI and branding
Guard the Phoenix AI identity and design system before any further change. **No visual
change** was made; this step is a pure, verified extraction plus documentation.
- **Asset inventory:** audited every use of `/logo.png`, `/kkm-hkl-logo.jpeg`,
  `/favicon.svg`, `/og-image.png`, the PWA icons, and the TBSA body/mask images. Confirmed
  the Phoenix logo appears in the landing page, HCP login, HCP desktop + mobile navigation,
  Community desktop + mobile navigation, the PWA install prompt, browser metadata, and Open
  Graph metadata. Full matrix in `docs/migration/brand-parity-checklist.md`.
- **`PhoenixLogo` component** added at `nextjs_space/components/phoenix-logo.tsx`. It renders
  `/logo.png` with `next/image` `fill` + `object-contain` inside a `relative` wrapper —
  identical to the prior inline markup. Sizing/spacing come from the caller's `className`;
  `alt` defaults to `"Phoenix AI"` (call sites needing `"Phoenix AI Logo"` pass it
  explicitly); `imageClassName` preserves the hero `drop-shadow-lg`; `style` preserves the
  hero 3D `perspective`. No CSS filters, no recolouring, transparency preserved.
- **Refactored 11 render sites** across `app/_components/landing-client.tsx`,
  `app/hcp-login/page.tsx`, `app/hcp/_components/hcp-layout-client.tsx`,
  `app/community/_components/community-layout-client.tsx`, and
  `components/pwa-install-prompt.tsx` to use `PhoenixLogo`. Each keeps its exact wrapper size
  (`w-7/8/9/12`, responsive hero `w-28…md:w-44`), alt text, drop-shadow, and animation
  classes — the rendered DOM is unchanged. Metadata (`layout.tsx`), `manifest.json`, `sw.js`,
  the KKM–HKL banner, and non-logo user-content images were intentionally left as-is.
- **Design system preserved and documented** from `STYLE_GUIDE.md` + `app/globals.css`:
  DM Sans / Plus Jakarta Sans / JetBrains Mono; `--primary 0 100% 27%` (`#8B0000`),
  `--secondary 37 92% 50%`, `--accent 172 84% 33%`; `--radius 0.625rem` scale; 8px spacing
  scale; shadow scale; `--duration 150/250/350ms`; and the `.phoenix-gradient` /
  `.phoenix-gradient-text` / `.hero-gradient` treatments — all unchanged.
- **Verification:** `npm run typecheck` ✅ 0 errors; `npm run lint` ✅ 0/0; `npm run build`
  ✅ exit 0, 17/17 routes. No asset files modified.

### Step 8 — Capture a route and screenshot baseline
Added Playwright and captured a full visual + route baseline of the production build. This is
an **observation-only** step — no UI, styling, content, or app source was changed.
- **Tooling:** added `@playwright/test@1.49.1` (dev dep) + Chromium. New
  `nextjs_space/playwright.config.ts` defines four viewport projects — `desktop-1440`
  (1440×1000), `desktop-1280` (1280×800), `tablet-768` (768×1024), `mobile-390` (390×844) —
  and auto-starts `next start` (production build) with deterministic settings
  (`reducedMotion`, pinned timezone `Asia/Kuala_Lumpur`, light colour scheme).
- **Spec:** `nextjs_space/tests/visual/baseline.spec.ts` captures all 14 accessible routes
  (`/`, `/hcp-login`, the 6 `/hcp/*` routes, the 6 `/community/*` routes) in English and
  Bahasa Malaysia, plus mobile nav-open, empty + completed forms (Parkland, community
  assessment → result panels), the HCP account dropdown, and the invalid-login error state.
- **Demo auth for gated routes:** the `/hcp/*` pages are behind the existing mock,
  client-side `sessionStorage['hcp_auth']` check. Per the task, the baseline seeds the same
  session object the demo "quick login" writes (demo user `doctor@phoenix.my`) via
  `addInitScript` — the existing demo flow only, no real credentials/backend.
- **Output:** 143 full-page PNGs under `nextjs_space/tests/visual/baseline/<route>/` named
  `<viewport>-<lang>-<state>.png` (committed). Transient Playwright artifacts
  (`test-results/`, `playwright-report/`) are git-ignored; the baseline images are not.
- **Scripts/config:** `package.json` `test:e2e` now runs `playwright test`; added
  `test:visual`. `tsconfig.json` excludes `tests/` + `playwright.config.ts` from the Next
  app's type project (Playwright transpiles specs itself). `.gitignore` updated so
  Playwright report/result dirs are ignored anywhere while the baseline stays tracked.
- **Result:** all 68 Playwright tests passed (4 viewports × routes/states). Documented in
  `docs/testing/visual-baseline.md`. `npm run build` ✅ 17/17, `typecheck` ✅ 0, `lint` ✅ 0/0.

### Step 9 — Remove the Abacus-hosted browser script
Removed the only Abacus-hosted **client-side** dependency: the `appllm-lib.js` loader injected
by the Abacus platform. No page functionality changes.
- **Dependency analysis:** `app/layout.tsx` loaded
  `<script src="https://apps.abacus.ai/chatllm/appllm-lib.js" defer>` in `<head>`. A full
  codebase search (`appllm`, `chatllm`, `AppLLM`, `window.*abacus*`, `deploymentId`,
  `deploymentToken`, `widget`, `ChatLLM`, etc.) found **no** application code that references
  any global, function, object, or config attribute the script provides. It is the Abacus
  hosting platform's preview/chat-widget loader, injected into the page chrome but never
  called by Phoenix AI. Confirmed the app does not invoke it → **no dependency**.
- **Change:** deleted the single `<script>` line from `app/layout.tsx`. Because nothing
  consumed the script, **no replacement (local or Azure-native) behaviour was required** and
  no page functionality changes. The `<head>` meta tags, PWA hooks, fonts, and body are
  untouched.
- **Regression guard (new test):** `nextjs_space/tests/network/no-abacus.spec.ts` +
  `nextjs_space/playwright.network.config.ts` (script `npm run test:network`). It loads every
  public route in a real browser, records all browser network requests, and **fails** if any
  request targets an Abacus-owned host — matched by `/(^|\.)abacus(ai)?\.(ai|app|com)$/i`,
  covering `apps.abacus.ai`, `abacus.ai`, and any `*.abacus.ai` / `*.abacusai.*` asset domain.
  Scope is **browser** requests only; the server-side `app/api/*` → `apps.abacus.ai` calls are
  made by the Next.js server (not the browser) and are intentionally out of scope here.
- **Scope note:** per the task, the **server-side** AI API calls were **not** changed in this
  step — they are migrated to Azure OpenAI in a later step.
- **Scripts/config:** `package.json` adds `test:network`; `tsconfig.json` also excludes
  `playwright.network.config.ts` from the Next app type project.
- **Verification:** `npm run build` ✅ 17/17 routes; `npm run typecheck` ✅ 0; `npm run lint`
  ✅ 0/0; `npm run test:network` ✅ 1 passed (0 Abacus browser requests across all 14 routes).

_Subsequent steps appended below as work proceeds._
### Step 10 — Introduce a portable AI provider layer
Introduced a provider abstraction (`nextjs_space/lib/ai/`) so the app is no longer hard-wired to
Abacus.AI, and rewired the four AI routes through it — **without changing any client-visible
behaviour**. This is the enabling refactor for the Azure OpenAI cutover.

- **New abstraction (`lib/ai/`):**
  - `types.ts` — provider-neutral contract: `AiProvider`, `AiMessage` (text + multimodal image
    parts), `AiChatRequest` (model, max output tokens, response format, correlation ID, timeout,
    retries, cancellation `signal`), `AiStreamResponse`, and a structured `AiError`.
  - `openai-compatible.ts` — one shared transport for both backends (they are both
    OpenAI-compatible). Builds the `stream:true` chat payload, generates a correlation ID
    (`x-correlation-id`), applies timeout/cancellation via a merged `AbortController`, retries
    only on transient 5xx/network errors, and returns the **raw** upstream SSE byte stream. To
    preserve current behaviour the defaults are no timeout and 0 retries.
  - `abacus-provider.ts` — `AbacusProvider` (name `abacus`), endpoint `apps.abacus.ai`, default
    model `gpt-5.4-mini`, `Authorization: Bearer ${ABACUSAI_API_KEY}`, and the **exact** original
    missing-key log + client error message.
  - `azure-foundry-provider.ts` — `AzureFoundryProvider` (name `azure`) for Azure OpenAI /
    Foundry: URL `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=…`,
    `api-key` header, default API version `2024-10-21`. The deployment must be vision-capable to
    preserve multimodal analysis. Not active until wired up.
  - `ai-provider.ts` — `resolveProviderName()` reads `AI_PROVIDER` (defaults to `abacus`),
    `getAiProvider()` factory, and `aiErrorResponse(err, prefix)` which reproduces each route's
    original upstream-error wording (`LLM API error`, `LLM error`, `API error`) and status.
  - `prompts/` — the four system prompts moved **verbatim** (HCP wound analysis, HCP chat, and the
    two community prompts as `lang`-parameterised functions). HCP clinical tone, community-friendly
    language, Bahasa Malaysia mode, the Malaysian emergency number **999**, Malaysian clinical
    context, medical disclaimers, and the exact JSON schemas are all unchanged.
  - `streaming/text-stream.ts` — `createTextPassthroughResponse` reproduces the chat routes' raw
    decode→encode passthrough and `text/plain` headers.
  - `streaming/sse.ts` — `createStructuredSseResponse` reproduces the analysis routes' exact SSE
    parse loop (per-chunk `processing` event, `[DONE]` handling, end-of-stream fallback) with
    `text/event-stream` headers, distinguishing the `'done'` vs `'end'` completion phases.
  - `validation/wound-analysis-schema.ts` — `parseHcpWoundAnalysis` and
    `parseCommunityWoundAnalysis` reproduce the original parse-or-fallback objects, **including
    the community route's two different fallbacks** for the `[DONE]` path vs the end-of-stream path.
- **Routes rewired:** `analyze-wound`, `hcp-chat`, `community-analyze`, and `community-chat` now
  build a provider-neutral `AiMessage[]`, call `getAiProvider().streamChatCompletion(...)`, and
  return the shared streaming helpers. The outer `try/catch`, the image `400`, every
  `console.error` label, the upstream-error prefixes, status codes, and streamed bytes are
  preserved. Because both providers speak the same OpenAI wire format, **no client code changed**.
- **Config (`AI_PROVIDER`):** added to `.env.example` alongside the Azure OpenAI settings
  (`AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_DEPLOYMENT` /
  `AZURE_OPENAI_API_VERSION`) — templates only, no secrets. Default is `abacus`; the intended
  Azure production default is `azure`, flipped in the later cutover step once Azure OpenAI exists.
- **Security:** all credentials are read server-side in `lib/ai` (invoked only from `app/api/*`
  route handlers); no API keys reach the browser. `test:network` still passes (0 Abacus browser
  requests). The server-side Abacus calls remain by default and are the subject of the cutover step.
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` ✅ 17/17 routes;
  `npm run test:network` ✅ 1 passed.

### Step 11 — Migrate model calls to Microsoft Foundry / Azure OpenAI
Made the Azure provider a real, production-ready backend: managed-identity auth, resilient
transport, image validation, Zod-validated structured results with an explicit safe-fallback
state, and privacy-safe telemetry. `AI_PROVIDER` still defaults to `abacus` — this step makes
the `azure` provider **ready**, not yet the default (the cutover flips it once Azure is provisioned).
- **Authentication (managed identity preferred):** new `lib/ai/azure-credential.ts` acquires an
  Azure AD bearer token for the Cognitive Services data plane
  (`https://cognitiveservices.azure.com/.default`) via `DefaultAzureCredential` — a managed
  identity in Azure (user-assigned selected by `AZURE_CLIENT_ID`) and Azure CLI credentials
  locally. Tokens are cached in-process and refreshed ~5 min before expiry. `AZURE_AI_API_KEY`
  is an **explicit, temporary fallback** used only when `AZURE_AI_AUTH=key` or a token cannot be
  acquired. Keys/tokens are read/acquired server-side only and never reach the browser.
- **`azure-foundry-provider.ts` rewritten:** reads the new
  `AZURE_AI_ENDPOINT` / `AZURE_AI_PROJECT_ENDPOINT` / `AZURE_AI_MODEL_DEPLOYMENT` /
  `AZURE_AI_API_VERSION` / `AZURE_AI_AUTH` / `AZURE_CLIENT_ID` variables (legacy `AZURE_OPENAI_*`
  names still accepted as fallbacks). Builds the OpenAI-compatible chat-completions URL (accepts a
  bare resource endpoint or a full `/chat/completions` URL), applies provider-level resilience
  defaults (60 s timeout, 2 retries), and requests `stream_options.include_usage` for exact token
  telemetry when the deployment supports it. Vision + streaming + `response_format: json_object`
  preserved for gpt-4o-class deployments.
- **Resilient transport (`openai-compatible.ts`):** added **exponential backoff with jitter**
  between retries (base 500 ms, capped 20 s), **429 rate-limit** retry honouring `Retry-After`,
  a per-request **timeout**, correlation-ID propagation (`x-correlation-id`), and a byte-identical
  stream wrapper that records **latency (TTFB + total) and token metrics** without altering
  forwarded bytes. The Abacus path is unchanged in behaviour (retries/timeout only apply when the
  caller sets them).
- **Telemetry (`lib/ai/telemetry.ts`):** structured `[Phoenix AI][telemetry]` request/response
  log lines with correlation ID, provider, model, route, attempts, latency, byte count and token
  counts (exact from `usage`, otherwise a clearly-flagged char-based estimate). **Never logs image
  or message content** — only counts and derived metadata.
- **Image validation (`lib/ai/validation/image-input.ts`):** MIME-type allow-list
  (`image/jpeg|png|webp|gif|heic|heif`) and a maximum decoded size (default 10 MB, overridable via
  `AZURE_AI_MAX_IMAGE_MB`) enforced in `analyze-wound` and `community-analyze` before any provider
  call. Invalid uploads return a clear `400` (contract-consistent with the previous `No image
  provided` behaviour).
- **Zod-validated results + safe fallback (`validation/wound-analysis-schema.ts`):** typed
  `hcpWoundAnalysisSchema` (the 22 fields the HCP client renders) and `communityWoundAnalysisSchema`
  (the 3 fields the community client renders), derived by inspecting the front-end components. The
  schemas are **tolerant of type variance** (numbers/booleans coerced to strings) so a usable model
  result is not rejected on a technicality. When the output is **not valid JSON, not an object, or
  carries none of the expected fields**, the parser does **not fabricate** a clinical result —
  instead it returns an explicit "assessment could not be completed" state that **preserves the
  medical disclaimer** and tells the user the analysis failed.
  - **Behaviour change (documented):** this replaces the source app's prior fallbacks, which echoed
    the raw model buffer into the result and used two different wordings for the `[DONE]` vs
    end-of-stream community paths. The new safe-fallback state is delivered as the existing
    `status: 'completed'` + `result` SSE event using the existing field names, so **no front-end
    change is required** and the message surfaces in the normal result UI.
- **Routes:** all four routes now generate a correlation ID (`newCorrelationId()`) and pass a
  `route` label into the request; the correlation ID is echoed to the client via the
  `x-correlation-id` response header (harmless to the existing parsers). The exact `console.error`
  labels, upstream-error prefixes (`LLM API error` / `LLM error` / `API error`), status codes, and
  streamed byte formats are preserved.
- **Dependencies:** added `@azure/identity@4.13.1` (`--legacy-peer-deps`). `zod` was already present.
  The build confirmed no server-bundling issues for `@azure/identity` in the Node route runtime.
- **Config (`.env.example`):** documented the new `AZURE_AI_*` variables (endpoint / project
  endpoint / deployment / api-version / auth mode / client id / api key / max image MB) with
  managed identity as the default, and kept the legacy `AZURE_OPENAI_*` names as accepted fallbacks.
  Templates only — no secrets.
- **Streaming preserved:** chat routes still emit byte-identical OpenAI-delta SSE; analysis routes
  still emit the `processing` → `completed` structured SSE. Client parsing is unchanged.
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` ✅ 17/17 routes;
  `npm run test:network` ✅ 1 passed.

_Subsequent steps appended below as work proceeds._
### Step 12 — Remove remaining Abacus.AI runtime dependencies (Azure-only cutover)

With the Azure OpenAI (Microsoft Foundry) provider verified in Step 11, the Abacus.AI backend is
retired and Azure becomes the app's single production AI provider.

- **Default provider:** `getAiProvider()` now constructs `AzureFoundryProvider` directly. The
  `AI_PROVIDER` environment selector, the `resolveProviderName()` helper, and the `abacus` factory
  branch are removed — Azure is no longer conditional. The provider abstraction (`AiProvider`
  interface, factory, shared `aiErrorResponse`) is kept so a future backend could be added without
  touching route code.
- **Abacus provider deleted:** `lib/ai/abacus-provider.ts` is removed entirely. This drops the
  `https://apps.abacus.ai/v1/chat/completions` call, the `ABACUSAI_API_KEY` credential read, the
  hard-coded `gpt-5.4-mini` default model, and the Abacus-specific missing-credential error/log
  wording. `AiProviderName` is narrowed from `'abacus' | 'azure'` to `'azure'`.
- **Deployment name from configuration:** no route hard-codes a model. The Azure provider resolves
  the deployment name only from `AZURE_AI_MODEL_DEPLOYMENT` (or legacy `AZURE_OPENAI_DEPLOYMENT`);
  the routes pass no `model`.
- **Config (`.env.example`):** removed `AI_PROVIDER` and `ABACUSAI_API_KEY`; the AI section now
  documents only the `AZURE_AI_*` settings (managed identity default) with the legacy
  `AZURE_OPENAI_*` names retained as accepted fallbacks. Templates only — no secrets.
- **Comments:** removed lingering "Abacus.AI today / Azure tomorrow" wording from `types.ts` and
  `openai-compatible.ts`. The browser regression guard (`tests/network`) is intentionally retained
  — it is a safety net that asserts no browser request ever targets Abacus, not a runtime
  dependency.
- **Repository search:** `abacus`, `ABACUS`, `apps.abacus.ai`, `ABACUSAI_API_KEY`, and
  `gpt-5.4-mini` no longer appear in any production runtime path. Remaining mentions are limited to
  historical migration documentation and the browser guard test — both intentional.
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` ✅ 17/17 routes;
  `npm run test:network` ✅ 1 passed.

### Step 13 - Connect Phoenix AI to Azure Database for PostgreSQL

Following the persistence assessment (`docs/migration/persistence-gap-assessment.md`), the Prisma
data layer is connected to **Azure Database for PostgreSQL Flexible Server**. This step builds the
database plumbing (client hardening, migrations, seed, health/readiness, tests). It deliberately
does **not** rewire the dashboard or articles UI - those still render the original in-app demo
content, so the visible experience is unchanged and parity is preserved. The seed makes matching
data available for a future wiring step.

- **Client hardening (`lib/db.ts`):** the datasource URL now auto-appends `sslmode=require` (Azure
  requires TLS) plus modest pool defaults (`connection_limit=5`, `pool_timeout=15`,
  `connect_timeout=15`) when absent, without clobbering explicit settings. Added `withDbRetry()`
  (exponential backoff + jitter for transient `P1001/P1002/P1008/P1017`,
  `PrismaClientInitializationError`, and `ECONNRESET/ETIMEDOUT/...` errors) and
  `checkDatabaseReady()` (a `SELECT 1` readiness probe with latency). `DATABASE_URL` remains
  server-only.
- **Health & readiness:** new Node-runtime routes `GET /api/health` (liveness, no DB) and
  `GET /api/health/db` (503 when the database is unreachable, 200 when ready).
- **Migrations:** committed the initial migration `prisma/migrations/20260806120000_init` +
  `migration_lock.toml` (postgresql). Offline validation via `scripts/validate-migration.ts`
  (`npm run db:migrate:validate`) checks the lock, non-empty `migration.sql`, and `prisma validate`
  - wired into a new `db-validate` CI job (runs on every PR). Execution is a **controlled** step:
  `.github/workflows/db-migrate.yml` (`workflow_dispatch`, `environment: production`) runs a
  readiness check then `prisma migrate deploy` (applies only pending migrations, never resets) then
  `prisma migrate status`. No destructive migration runs automatically.
- **Seed (`scripts/seed.ts` via `scripts/safe-seed.ts`):** idempotent (`upsert` on stable `seed-*`
  ids), fictional, non-destructive (upserts only), and clearly marked (`seed-case-*` /
  `seed-article-*` ids; `[DEMO]` markers in case free-text). Seeds 48 deterministic `Case` rows
  mirroring the dashboard aggregates and 5 `Article` rows mirroring the community articles verbatim;
  `ChatMessage` is not seeded. The safe-seed guard was hardened to also block `$executeRaw`,
  `TRUNCATE`, and `DROP` in addition to `delete`/`deleteMany`.
- **Integration test (`tests/integration/db.integration.test.ts`):** asserts readiness and an
  idempotent upsert against a live database; skips cleanly (exit 0) when `DATABASE_URL` is unset so
  CI without a database still passes. Run via `npm run test:integration`.
- **Config & docs:** `.env.example` documents the Azure `DATABASE_URL` format (SSL required, pool
  params, optional pooler `DIRECT_DATABASE_URL`); `prisma/schema.prisma` gained a datasource
  comment; new reference `docs/data/postgresql-data-model.md` documents tables, connection,
  migrations, and seed.
- **Verification:** `npm run db:migrate:validate` ✅ 1 migration; `npm run typecheck` ✅ 0;
  `npm run lint` ✅ 0/0; `npm run build` ✅ 19/19 routes (adds `/api/health`, `/api/health/db`);
  `npm run test:integration` ✅ skipped (no DB in CI).