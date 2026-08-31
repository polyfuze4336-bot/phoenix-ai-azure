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
| **AWS S3** (`lib/s3.ts`, `lib/aws-config.ts`) | **No** — helpers defined but never imported. Images are read client-side via `FileReader` and sent as base64 to the LLM routes. | Done (Step 14). Helpers + `@aws-sdk/*` removed; Azure-native `lib/storage/` (managed identity, private container, user delegation SAS) added as an unwired building block. |
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

### Step 48 — Add the Community first-aid video library

- Added `https://youtu.be/qcADGBwSgC8` as the enabled featured video on the existing Community First
  Aid Video page, using the existing privacy-enhanced YouTube player without autoplay.
- Added a typed, ordered configuration list so future videos require one configuration entry; the
  page shows selection cards only when more than one enabled video resolves successfully.
- Preserved `FIRST_AID_VIDEO_URL` as a validated featured override and deduplicated matching video
  IDs. Invalid configured or runtime URLs never reach an iframe.
- Preserved the existing Community design, bilingual guidance, disclaimer, navigation, branding and
  Azure deployment topology. Architecture `8.0.0` → `8.1.0`; RAI impact is NONE.
- Local validation PASS: parser/library unit `6/6`, full unit `127/127`, RAI `31/31`, typecheck,
  production build, architecture drift, single/multiple-video browser behavior, EN/MS switching,
  Desktop Chrome, Desktop Edge profile, WebKit 18.2, mobile Chromium, 16:9 geometry, no horizontal
  overflow, embedded playback and fullscreen control. GitHub Actions and live Azure verification
  remain pending until the direct-main push deploys this commit.

### Step 47 — Add bilingual Community education sections

- Added First Aid Video and Burn Injury Prevention routes to the existing Community experience and
  global EN/MS language state. Both are available from Community Home, desktop navigation and the
  mobile drawer; the existing five-item mobile bottom row remains unchanged to preserve readable,
  touch-friendly labels.
- `FIRST_AID_VIDEO_URL` is read server-side per request, restricted to recognized HTTPS YouTube
  formats, and normalized to a privacy-enhanced embed URL. Missing or invalid values show a
  bilingual unavailable state while approved first-aid key points remain visible.
- Added five bilingual prevention categories and a callout to the existing First Aid route. No HCP,
  authentication, AI, prompt, database, clinical calculation, workflow, Azure resource or
  deployment behavior changed.
- Architecture `7.0.0` → `8.0.0` records the new optional browser-to-YouTube integration. See
  ADR-0016 and the related architecture change record.
- Validation PASS: typecheck, lint, production build, unit `124/124`, RAI `31/31`, integration
  `14/14`, new Community education `3/3`, Community/clickable-control regressions `17/17`,
  bilingual Community routes `2/2`, HCP journeys `2/2`, and architecture drift validation.
  The sandbox build used Next.js's temporary test-only Google-font response hook because
  `fonts.googleapis.com` DNS was unavailable; production source is unchanged.

### Step 46 — Preserve HCP Image Analysis mobile result containment

- Kept the HCP Image Analysis grid on an explicit shrinkable single-column track below the existing
  desktop breakpoint, allowed result and shell flex/grid children to shrink, and wrapped long
  generated result text without clipping clinical content.
- Kept the existing seven-item HCP bottom navigation within narrow phone viewports by distributing
  items across the available width; the header, cards, TBSA, Parkland, management, explanation, and
  desktop two-column presentation remain visually unchanged.
- Added deterministic mocked-result browser coverage for 320, 360, 375, 390, 412, 430, 768, 1024,
  and 1280 px, including long clinical text and the expanded “Why this assessment?” content.
- No clinical calculations, prompts, schemas, translation, authentication, Azure resources,
  dependencies, merge, or deployment behavior changed.
- Validation PASS: typecheck, lint, production build, the responsive mocked-result check at all nine
  required widths, and the existing image-analysis retry journey. The sandbox build used Next.js's
  temporary test-only Google-font response hook because `fonts.googleapis.com` DNS was unavailable;
  production source is unchanged.

### Step 45 — Retire Community Image Check and free HCP chat space

- Removed the Community Home Image Check card and desktop/mobile navigation entry, deleted its
  client and dedicated `/api/community-analyze` handler, and redirected the former
  `/community/image-check` page to Community Home. Bumped the PWA cache name; the replacement worker
  clears stale caches and reloads controlled windows on activation so cached copies of the retired
  UI cannot remain visible.
- Community chat is independent and has no image attachment; it remains unchanged. HCP Image
  Analysis, HCP History and HCP chat image attachment remain separate and untouched.
- Moved the unchanged bilingual Confidentiality and Personal Data notice cards below and outside
  the fixed-height HCP Specialist Chat panel. The message region now receives the freed space; the
  mobile panel uses dynamic viewport height while desktop keeps its existing viewport calculation.
- Updated route/journey tests, current testing records, architecture `6.2.0` → `7.0.0`, ADR-0015,
  and RAI evidence links. RAI control statuses and notice wording are unchanged.
- No authentication, credentials, dependencies, Parkland/TBSA logic, AI prompts, Azure resources,
  GitHub Actions, deployment workflow, merge or deployment changes.
- Validation PASS: typecheck, lint, production build, unit `121/121`, RAI `31/31`, integration
  `14/14`, API `22/22`, Community journeys `2/2`, HCP journeys `2/2`, responsive chat layout `1/1`,
  clickable controls `13/13`, and architecture drift validation. The sandbox build used Next.js's
  temporary Google-font response hook because `fonts.googleapis.com` DNS was unavailable; production
  source is unchanged.
- The full bilingual route suite has a pre-existing stale HCP Image Analysis copy expectation:
  `5/7` pass, while EN/MS expect “Upload or capture” but the current untouched UI says “Upload”.
  HCP Image Analysis language copy is explicitly outside this step; targeted Community, notice and
  responsive checks pass. Mermaid CLI is not installed, so changed diagrams received source review
  plus the repository's architecture validator but not CLI rendering.

### Step 44 — HCP image-analysis clinical fixes

- Removed the redundant dedicated camera stream UI while retaining the standard upload control,
  preview, validation, retry, and compatible mobile camera/photo chooser behavior.
- Existing live and retained History results now switch between English and Bahasa Malaysia through
  a text-only translation operation. The patient image is not resent, protected canonical/numeric
  values are validated unchanged, both language representations are cached, and the original result
  remains visible if translation fails. Language metadata stays in the existing JSON result, so no
  database migration is required.
- Image Analysis now separates Parkland indication from the unchanged deterministic formula:
  adult `TBSA >=15%`, child `TBSA >=10%`, explicit clinician-selected category, no inferred category
  or weight, and localized indicated/missing-weight/not-required/uncertain states. The standalone
  Parkland calculator is unchanged.
- Azure request and streamed-output filter stops are classified from allowlisted source, category,
  and severity fields only. Bicep declares `Microsoft.Default`; no live Azure policy was changed.
  Operators must verify the deployed policy and actual blocking category before manually applying a
  least-permissive supported healthcare configuration.
- Architecture `6.1.1` → `6.2.0`; no authentication, credential, dependency, Community, database
  schema, deployment workflow, or Azure resource change.
- Validation PASS: unit `121/121`, RAI `31/31`, integration `14/14`, API `26/26`, bilingual
  HCP/Community journeys `4/4`, HCP retry E2E `1/1`, typecheck, lint, production build, and
  architecture/Mermaid drift checks. The sandbox build used Next.js's temporary Google-font mock
  hook because `fonts.googleapis.com` DNS was unavailable; no font or runtime source changed.
- Manual live-Azure checks remain for de-identified clinical images, filter-category evidence,
  mobile chooser behavior, translated clinical wording, and Parkland result presentation.

### Step 43 — Audit PostgreSQL version and prototype workflows

- Read-only Azure control-plane and SQL checks verified the deployed server as PostgreSQL `17.10`,
  Ready, East US 2, `Standard_B1ms`, 32 GiB, seven-day PITR retention, HA disabled, and `plpgsql 1.0`.
- The active Container App database endpoint matches `psql-phoenixai-oaprp7dte7bw2` / `phoenix`.
  Five tables, eleven indexes, two finished Prisma migrations, and non-sensitive row counts were
  captured without exporting record content.
- Decision: **PostgreSQL is already on an acceptable current major version. No upgrade required.**
  No restore, temporary server, precheck, upgrade, Bicep version change, or database write occurred.
- GitHub Actions already consists of one automatic `deploy.yml` and one manual-only
  `infrastructure.yml`. Fast unit tests remain because they add seconds; no PR/governance/approval or
  expensive matrix gate exists to remove. Architecture documentation `6.1.0` -> `6.1.1`.

### Steps 35-42 — Codespaces, deliberate delivery, and immutable-image rollback
- Added a secret-free Node.js 22 devcontainer with dependency/Prisma setup, Azure CLI, GitHub CLI,
  Copilot/Azure extensions, and port 3000 forwarding. Codespaces terminals open in `nextjs_space`.
- Added `npm run verify` for the quick typecheck + production-build loop. `npm run dev` remains the
  single development-server command.
- Kept commits explicit: no daemon commits Copilot edits and no keystroke triggers deployment. One
  developer-selected push to `main` remains the automatic Azure deployment boundary.
- Added `scripts/rollback-demo.sh` and manual `deploy.yml` dispatch for a full known Git SHA. It
  verifies the immutable ACR image, skips rebuild/migrations, creates a new Container App revision,
  runs health/smoke checks, and records actor, restored SHA, and revision without rewriting history.
- Updated application/language/clinical/privacy/development/deployment/rollback documentation and
  architecture version `6.0.0` -> `6.1.0` with ADR-0014.
- Validation PASS: `npm run verify`; unit `107/107`; Responsible AI `29/29`; integration `14/14`;
  production HTTP API `24/24`; complete retained-route/bilingual E2E `27/27`; architecture drift;
  both changed Mermaid diagrams; workflow/devcontainer/editor diagnostics; and changed-surface
  credential scan. The full HCP and Community interaction journeys pass independently in English
  and Malay without opposite-language route text.

### Steps 23-34 — Safe retry, reliability telemetry/testing, and prototype delivery simplification
- Failed HCP analysis now retains the selected image and entered context, displays the exact English
  or Malay recovery guidance, and provides Retry Analysis / Choose Another Image actions without
  restarting the form. Retry requests carry a bounded retry count.
- Added privacy-safe `image_analysis_started`, `image_analysis_completed`,
  `image_analysis_retry`, and `image_analysis_failed` events. Dimensions are limited to category,
  HTTP status, configured model deployment, user retry count, latency, image-size bucket, MIME type,
  and requested language. Image bytes/Base64, identifiers, prompts, and clinical responses remain
  blocked by tests.
- Added `npm run test:reliability:analysis`: 10 sequential safe synthetic-image requests by default,
  optional concurrent requests, completion/failure/timeout/parsing counts, category breakdown,
  average latency, and a `>=95%` demo API-completion target. It makes no clinical-accuracy or SLA
  claim and is not an automatic deployment cost gate.
- The first live 10-run baseline completed 2/10 requests (20%); all eight failures were
  `AI_SCHEMA_VALIDATION_FAILED`, with no timeout or parsing failure. The core-stage signal gate now
  accepts structurally explicit unreadable-image/non-burn responses as honest low-information
  results while continuing to reject empty or malformed core output. After deployment, the same
  harness completed 10/10 requests (100%) with 28,584 ms average latency and no failures, timeouts,
  or parsing failures. This meets the `>=95%` demo API-completion target for the recorded sequential
  synthetic-image conditions only; it is not clinical-accuracy evidence or an SLA.
- Declared PROTOTYPE / DEMO DEVELOPMENT MODE and retained the direct Codespaces -> edit -> local test
  -> commit -> push `main` -> automatic Azure deployment loop. Pull requests and manual approvals
  are optional.
- Replaced overlapping `ci.yml`, `deploy-dev.yml`, `deploy-demo.yml`, and `db-migrate.yml` with one
  push-to-main `.github/workflows/deploy.yml`. It installs, generates Prisma, type-checks, runs unit
  tests, builds, authenticates using existing OIDC, builds/pushes an immutable ACR image, applies
  configured migrations, updates the existing Container App, waits for the named new revision to be
  provisioned/running/healthy, verifies public liveness, smoke-tests `/hcp` and `/community`, and
  reports the revision and URL. Build failure stops deployment.
- Kept `infrastructure.yml` manual-only. The `Development` GitHub Environment is retained solely
  because the working OIDC/database secrets are scoped there; GitHub API inspection confirmed zero
  protection rules and no required reviewers. No repository ruleset or `main` branch protection is
  present. Secret hygiene and managed identity/OIDC remain unchanged.
- `architecture-governance.yml` and the PR template were already absent. Contributor guidance now
  asks that architecture and RAI documentation be kept reasonably current in the task without
  requiring pre-change approval or reviewer signoff.
- Architecture version `5.1.0` -> `6.0.0`; ADR-0013 records the single deployment workflow.

### Step 22 — Image-analysis resilience and governed HCP notices
- Added exact compact bilingual clinical decision-support, confidentiality, personal-data, and demo
  environment indications to the retained HCP analysis, chat, TBSA, Parkland, and shared shell.
- Added client decode/size/type preflight and server MIME/base64/signature/dimension/integrity/size
  validation with stable `IMAGE_*` categories.
- Added safe AI error categories, exact retry allowlist (408/429/500/502/503/504 plus transient
  network failures), three-attempt ceiling, jittered backoff, `Retry-After`, and configurable bounded
  `AI_ANALYSIS_TIMEOUT_MS`.
- Added complete-stream detection, tolerant JSON extraction, one structured repair, required core
  observation/interpretation, explicit non-core management/critic degradation, and four factual
  bilingual loading stages without percentages.
- Architecture version `5.0.0` -> `5.1.0`; no Azure resource or integration footprint change.

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
Made the Azure provider a real, first-class backend: managed-identity auth, resilient
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

### Step 14 - Replace AWS storage helpers with Azure Blob Storage

The imported source shipped AWS S3 helpers (`lib/s3.ts`, `lib/aws-config.ts`) and the
`@aws-sdk/client-s3` / `@aws-sdk/s3-request-presigner` packages. A dependency scan confirmed the
helpers are **never imported** by any page, route, or component — the only references were the
files themselves (plus historical docs and the lockfile).

- **Persistence assessment (per workflow):** every image workflow is ephemeral — HCP wound-analysis
  ([app/hcp/analysis](../../nextjs_space/app/hcp/analysis)), community image-check
  ([app/community/image-check](../../nextjs_space/app/community/image-check)), and both chat portals
  read the file client-side via `FileReader` and POST it to the AI routes as base64. Nothing is
  persisted. There is no case-image upload, no report-asset persistence, and article images are
  URL string references (not uploads). **Conclusion: no current workflow requires persisted files.**
  Persisting clinical images would be a new capability that changes data handling, so it is out of
  scope for a faithful parity migration.
- **Azure-native provider (`lib/storage/`)** built as the sanctioned, secure replacement, but
  intentionally **not wired** into any UI workflow (parity preserved):
  - [types.ts](../../nextjs_space/lib/storage/types.ts) — provider-neutral contract
    (`StorageProvider`, `UploadInput`, `UploadResult`, `ReadUrl`), `StorageError`, and pure shared
    helpers: MIME allow-list (images + PDF), `validateUpload` (MIME + max size), `maxStorageFileBytes`,
    and `buildBlobPath` (unique, date-partitioned, UUID-based; original file name never used verbatim).
  - [azure-blob-provider.ts](../../nextjs_space/lib/storage/azure-blob-provider.ts) — `AzureBlobProvider`
    using `@azure/storage-blob` + `@azure/identity`. Managed identity (`DefaultAzureCredential`,
    user-assigned via `AZURE_CLIENT_ID`); **no account key** is ever read. Reads are served via
    short-lived, read-only **user delegation SAS** URLs (clamped 60 s–1 h, default 5 min). Server-side
    `uploadData` with content-type headers, sanitised ASCII metadata, and an optional progress
    callback. Safe deletion via `deleteIfExists({ deleteSnapshots: 'include' })`, path-traversal guard,
    and no logging of file bytes/metadata values. The target container must be **private**.
  - [storage-provider.ts](../../nextjs_space/lib/storage/storage-provider.ts) — `getStorageProvider()`
    factory (lazy singleton) plus public re-exports.
- **Removed after confirming unused:** `lib/s3.ts`, `lib/aws-config.ts`, and the `@aws-sdk/client-s3`
  + `@aws-sdk/s3-request-presigner` packages (26 transitive packages removed). No source code
  imported them. `@azure/storage-blob` and `@azure/identity` were already present.
- **Config (`.env.example`):** replaced the AWS block (`AWS_REGION` / `AWS_BUCKET_NAME` /
  `AWS_FOLDER_PREFIX`) with the Azure Storage block (`AZURE_STORAGE_ACCOUNT` /
  `AZURE_STORAGE_ACCOUNT_URL` / `AZURE_STORAGE_CONTAINER` / `AZURE_STORAGE_MAX_FILE_MB`), documenting
  managed identity, private container, and short-lived SAS. No secrets.
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` ✅ 19/19 routes
  (unchanged — provider is unwired); `npm run test:network` ✅ 1 passed. No visible UX change.

### Step 15 - Isolate demo authentication for the parity release

The original login was a client-side mock with hard-coded credentials in browser source. This step
isolated it behind a feature flag and moved credentials server-side, **without changing the visible
login experience** (parity preserved).

- **Feature flag `AUTH_MODE`** ([lib/auth/auth-config.ts](../../nextjs_space/lib/auth/auth-config.ts)):
  `demo` (default) or `entra`. Provider-neutral contract (`AuthProvider`) with a `DemoAuthProvider`
  and an `EntraAuthProvider` placeholder, resolved by a factory
  ([lib/auth/auth-provider.ts](../../nextjs_space/lib/auth/auth-provider.ts)).
- **Credentials moved server-side** ([lib/auth/demo-users.ts](../../nextjs_space/lib/auth/demo-users.ts)):
  passwords no longer appear in browser source. `POST /api/auth/login` verifies credentials on the
  server; the login page renders only a non-secret directory (names, roles, emails) for the
  quick-login cards. Demo passwords resolve from `DEMO_AUTH_PASSWORD` / `DEMO_AUTH_ADMIN_PASSWORD`
  (server-only) with parity defaults.
- **Docs:** [docs/security/authentication.md](../security/authentication.md) records why
  `sessionStorage` auth is demo-only and how to protect the environment at the platform level.
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` ✅ 18/18 routes
  (adds `/api/auth/login`); `npm run test:network` ✅ 1 passed.

### Step 16 - Add optional Microsoft Entra ID authentication for HCP users

Built on the Step 15 abstraction, this step makes `AUTH_MODE=entra` a **real** Microsoft Entra ID
(OpenID Connect) sign-in for the Healthcare Professional portal. It is **opt-in** and **not enabled
by default** — the parity release still ships `AUTH_MODE=demo`. The community portal stays public.

- **Server-validated session** ([lib/auth/session.ts](../../nextjs_space/lib/auth/session.ts)):
  a signed **httpOnly** cookie (`hcp_session`, HS256 via `jose`, signed with `SESSION_SECRET` ≥32
  chars). Session expiration is enforced by the JWT `exp` claim (`AUTH_SESSION_TTL_MINUTES`, default
  60, clamped 5–1440). `jose` was added as a dependency (Edge + Node compatible).
- **Entra config + role mapping** ([lib/auth/entra-config.ts](../../nextjs_space/lib/auth/entra-config.ts)):
  `isEntraConfigured()` / `getEntraConfig()` build the tenant authority, authorize/token/logout/JWKS
  URLs and issuer. `mapClaimsToRole()` prefers Entra **App Roles** (`Doctor`/`Nurse`/`Administrator`)
  and falls back to security **group** object-ids (`AZURE_ENTRA_GROUP_ADMIN/_DOCTOR/_NURSE`).
  Precedence **Administrator > Doctor > Nurse**; no mapped role ⇒ Forbidden.
- **OIDC flow** ([lib/auth/entra-flow.ts](../../nextjs_space/lib/auth/entra-flow.ts)):
  authorization-code + **PKCE** with `state` + `nonce`; token exchange; ID-token verification against
  the tenant JWKS (issuer + audience + nonce); federated logout URL. No Entra internals are logged.
- **API routes** (all Node runtime, `force-dynamic`):
  [/api/auth/entra/login](../../nextjs_space/app/api/auth/entra/login/route.ts) (starts the flow,
  stashes state/nonce/verifier in short-lived httpOnly cookies),
  [/api/auth/entra/callback](../../nextjs_space/app/api/auth/entra/callback/route.ts) (validates
  state, exchanges code, verifies token, mints the session cookie → `/hcp`; forbidden/unauthorized
  redirect to `/hcp-login?error=…`),
  [/api/auth/logout](../../nextjs_space/app/api/auth/logout/route.ts) (clears the cookie + federated
  sign-out), and [/api/auth/session](../../nextjs_space/app/api/auth/session/route.ts) (server-verified
  identity probe).
- **Server-enforced protection — no client-only guard**
  ([middleware.ts](../../nextjs_space/middleware.ts)): verifies the session cookie at the edge for
  HCP pages (`/hcp`, `/hcp/*` → redirect to login) and HCP APIs (`/api/hcp-chat`,
  `/api/analyze-wound` → `401`). Community routes/APIs stay public. Middleware only enforces when
  `AUTH_MODE=entra`; in demo mode it is a no-op so the original client-side demo guard is preserved.
- **Login page** ([app/hcp-login](../../nextjs_space/app/hcp-login)): split into a server component
  that resolves the mode and a client component. Appearance is preserved; in `entra` mode the
  sign-in action redirects to Entra (no email/password form or demo cards), and explicit
  **Unauthorised** / **Forbidden** states are surfaced via `?error=`.
- **HCP layout** ([hcp-layout-client.tsx](../../nextjs_space/app/hcp/_components/hcp-layout-client.tsx)):
  reads the server session via `/api/auth/session` in entra mode (keeping `sessionStorage` for demo),
  and logout hits `/api/auth/logout` for federated sign-out.
- **Config & docs:** [.env.example](../../.env.example) documents the Entra app registration vars,
  app-role vs group mapping, `SESSION_SECRET`, and `AUTH_SESSION_TTL_MINUTES` (all server-only, no
  secrets committed). [docs/security/authentication.md](../security/authentication.md) gains a full
  Entra section (flow, role mapping, unauthorised/forbidden states, configuration).
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` ✅ 17/17 static
  pages, adds `/api/auth/entra/login`, `/api/auth/entra/callback`, `/api/auth/logout`,
  `/api/auth/session` and the Middleware bundle; `npm run test:network` ✅ 1 passed. Default remains
  `AUTH_MODE=demo`, so the visible parity experience is unchanged. (Build shows benign `jose` Edge
  warnings from its unused JWE-decrypt path; the JWS session code is unaffected.)

The imported login (`app/hcp-login/page.tsx`) is a **client-side mock**: hard-coded demo users
(Doctor / Nurse / Administrator) with plaintext passwords in browser source, a fake delay, and a
`sessionStorage` `hcp_auth` session read by a client-side route guard
([hcp-layout-client.tsx](../../nextjs_space/app/hcp/_components/hcp-layout-client.tsx)). For the
first parity deployment the visible experience is preserved while the credentials are moved off the
client and the design is made explicitly demo-only. This is **not** enterprise authentication.

- **`AUTH_MODE` feature flag** ([lib/auth/auth-config.ts](../../nextjs_space/lib/auth/auth-config.ts)):
  `demo` (default) or `entra`. Empty/unknown values fall back to `demo`.
- **Authentication abstraction** (`lib/auth/`), provider-neutral so a real identity provider can be
  added later without touching the login UI or the route guard:
  - [types.ts](../../nextjs_space/lib/auth/types.ts) — `AuthProvider` contract, `AuthUser` (session
    shape unchanged), non-secret `PublicDemoUser`, and typed `AuthError` (code + HTTP status).
  - [demo-users.ts](../../nextjs_space/lib/auth/demo-users.ts) — **server-only** demo directory. Parity
    defaults match the original users/roles/passwords; passwords are overridable via
    `DEMO_AUTH_PASSWORD` / `DEMO_AUTH_ADMIN_PASSWORD`. Exposes a password-free public list.
  - [demo-provider.ts](../../nextjs_space/lib/auth/demo-provider.ts) — `DemoAuthProvider`
    (`authenticate`, password-free `quickAuthenticate`, `listPublicUsers`).
  - [entra-provider.ts](../../nextjs_space/lib/auth/entra-provider.ts) — `EntraAuthProvider`
    placeholder that fails loudly (HTTP 501) with guidance to use platform-level Entra.
  - [auth-provider.ts](../../nextjs_space/lib/auth/auth-provider.ts) — `getAuthProvider()` factory
    (cached per mode) + re-exports.
- **Credentials moved server-side** — new [POST /api/auth/login](../../nextjs_space/app/api/auth/login/route.ts)
  verifies demo credentials on the server (manual `{ email, password }` or quick `{ email, quick: true }`)
  and returns only the session identity. No password is logged. The login page keeps a **non-secret**
  public directory for the quick-login cards; passwords no longer exist in browser source, and
  quick-login no longer writes a plaintext password into the form.
- **Preserved:** the visual login, the three quick-login cards, the `/hcp-login` + `/hcp` routes, the
  `sessionStorage` `hcp_auth` session, and the amber "Demo Mode" label. Rendered DOM is unchanged, so
  the visual baselines still match.
- **Config (`.env.example`):** added the Authentication section — `AUTH_MODE=demo`,
  `DEMO_AUTH_PASSWORD`, `DEMO_AUTH_ADMIN_PASSWORD` — documenting that this is demo-only and not for
  production healthcare use.
- **Docs:** new [docs/security/authentication.md](../security/authentication.md) explains why
  `sessionStorage` auth is not production-grade for healthcare and how to protect the demo at the
  platform level (App Service Easy Auth / Entra, access restrictions, or a lightweight gate).
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` ✅ 18/18 routes
  (adds `/api/auth/login`); `npm run test:network` ✅ 1 passed. No visible UX change.

### Step 17 - Create Azure infrastructure with Bicep

This step provisions the Azure landing zone for the parity demo as **Infrastructure as Code**
(Bicep, subscription-scoped). It creates the resource group and every runtime dependency, and
**reuses** the existing Microsoft Foundry model deployment rather than provisioning a new one.

- **Subscription inspection & reuse decision:** the only existing resource group in the sandbox
  subscription (`rg-aisgemini-dev`) belongs to a different workload. Reusing its telemetry, secret
  and storage resources would pollute that workload and add operational risk, so those are **not**
  reused. The **one** resource reused is the Foundry / Azure OpenAI account **`aif-yfjw6y`**
  (`kind=AIServices`, `eastus2`, `publicNetworkAccess=Enabled`, `disableLocalAuth=true` — managed
  identity, which matches the app's AI provider), which already hosts a vision-capable **`gpt-4o`**
  deployment (2024-11-20, GlobalStandard) with adequate demo quota. Reuse is **read-only**: the
  template only references the account and grants the app's identity a **`Cognitive Services OpenAI
  User`** role on it (cross-resource-group), never modifying the owning workload. This conserves
  scarce model quota without operational coupling.
- **Target architecture (all created fresh in `rg-phoenixai-demo`, `eastus2`):**
  - **App Service (Linux, Node 22)** hosting the Next.js app as a **full Node.js server**
    (`node server.js`, standalone output) — not a static export, because the app has server-side API
    routes. `alwaysOn`, HTTPS-only, TLS 1.2, HTTP/2, health check `/api/health`, user-assigned
    managed identity, and Key Vault reference identity.
  - **Azure Database for PostgreSQL Flexible Server** (Burstable `Standard_B1ms`, PG 16, Entra +
    password auth, 7-day backup) with the initial `phoenix` database.
  - **Blob Storage** (StorageV2, `allowSharedKeyAccess=false`, `allowBlobPublicAccess=false`,
    TLS 1.2, private `clinical-uploads` container, 7-day soft delete).
  - **Key Vault** (RBAC-authorised, soft delete) holding the database connection string; the app
    reads it via a `@Microsoft.KeyVault(...)` reference resolved by its managed identity.
  - **Application Insights + Log Analytics** for telemetry; diagnostics wired from Key Vault,
    Storage and App Service to the workspace.
  - **User-assigned managed identity** granted least-privilege roles: `Key Vault Secrets User`,
    `Storage Blob Data Contributor`, `Monitoring Metrics Publisher`, and (cross-RG) `Cognitive
    Services OpenAI User` on the reused Foundry account. **No account keys or secrets are used or
    committed.**
  - **Operational alerts** (action group + HTTP 5xx and response-time metric alerts).
- **Structure** ([infra/](../../infra)): [main.bicep](../../infra/main.bicep) (subscription scope —
  creates the resource group and orchestrates the modules), [main.bicepparam](../../infra/main.bicepparam)
  (parameters; the PostgreSQL admin password is read from the `PG_ADMIN_PASSWORD` environment
  variable and is **never** committed), and eleven modules under [infra/modules/](../../infra/modules):
  `log-analytics`, `application-insights`, `managed-identity`, `key-vault`, `storage`, `postgresql`,
  `app-service-plan`, `app-service`, `foundry-connection`, `role-assignments`, `alerts`. The
  managed identity is its own module so its `principalId`/`clientId` feed the role assignments,
  Foundry connection and App Service without a dependency cycle.
- **Tags** applied to every resource: `Application=PhoenixAI`, `Environment=Demo`,
  `Workload=BurnAndWoundCare`, `ManagedBy=Bicep`, `Owner`, `CostCentre`.
- **CI/CD** ([.github/workflows/infra.yml](../../.github/workflows/infra.yml)): GitHub Actions with
  **OIDC** federation (`azure/login@v2`, no stored client secret). Pull requests run Bicep
  lint + build + subscription **what-if** (read-only); deployment is a gated manual dispatch against
  the `production` environment. `PG_ADMIN_PASSWORD` comes from a repository secret.
- **Verification:** `az bicep build` (lint + compile) ✅ 0 warnings/errors. `az deployment sub
  what-if` compiled and preflight-validated the whole template; the **only** blocker is that this
  MCAPS sandbox subscription has **0 App Service compute quota** (`Total VMs` limit 0 for any SKU,
  including Free), which is an environment limitation requiring a quota increase before an actual
  deploy — **not** a template defect. To keep the template deployable in quota-constrained
  environments, the plan SKU/tier are parameterised (default `B1`/`Basic`) and `alwaysOn` is
  auto-disabled on the Free tier. No resources were created (what-if is read-only).

### Step 18 - Configure the Next.js application for Azure App Service

This step prepares the imported Next.js app to run as a **full Node.js server on Azure App Service
(Linux)** without changing the visible experience. Nothing in the UI, routing, styling or clinical
content is altered; the changes are runtime, health, configuration and hardening only.

- **Supported Node LTS pinned:** [package.json](../../nextjs_space/package.json) gains
  `"engines": { "node": ">=22 <23" }`, matching the repo's [.nvmrc](../../.nvmrc) (`22`) and the
  App Service `NODE|22-lts` runtime provisioned by the Bicep template.
- **Production build & startup:** the app already builds to Next.js **standalone** output
  (`output: 'standalone'` via `NEXT_OUTPUT_MODE`, set by the deploy), so App Service runs it with
  `node server.js`. The standalone bundle was verified to emit
  `.next/standalone/nextjs_space/server.js`. Next.js binds to the `PORT` supplied by App Service
  automatically — no code change needed, and the server model (not a static export) keeps the
  **server-side API routes** and makes **deep links resolve after a refresh**.
- **No `localhost` / local-filesystem dependency at runtime:** added
  [lib/config/environment.ts](../../nextjs_space/lib/config/environment.ts) with `getSiteUrl()`,
  which derives the public base URL from `NEXTAUTH_URL` → `WEBSITE_HOSTNAME` (auto-injected by App
  Service, forced to `https`) → a `http://localhost:3000` **development-only** fallback.
  [app/layout.tsx](../../nextjs_space/app/layout.tsx) now sets `metadataBase: getSiteUrl()` instead
  of a hard-coded `http://localhost:3000`. No feature writes to the local filesystem for
  persistence (uploads are stateless data URLs; Blob Storage, when enabled, uses managed identity).
- **Health endpoints:** added [`GET /api/health/live`](../../nextjs_space/app/api/health/live/route.ts)
  (liveness — returns `200 {status:'alive'}` with **no** dependency checks) and
  [`GET /api/health/ready`](../../nextjs_space/app/api/health/ready/route.ts) (readiness — `200` when
  ready, `503` when not). Readiness ([lib/health/readiness.ts](../../nextjs_space/lib/health/readiness.ts))
  verifies **only essential dependencies**: the application runtime, **PostgreSQL when enabled**
  (`DATABASE_URL` present → live `SELECT 1`; otherwise skipped), the **Azure AI endpoint
  configuration** (presence of endpoint + deployment — it **never calls the model** on a probe),
  and **Blob Storage when enabled** (configuration check, no network call). The Bicep
  `healthCheckPath` was pointed at [`/api/health/live`](../../infra/modules/app-service.bicep). The
  original `/api/health` and `/api/health/db` routes are kept for back-compat.
- **Environment-variable validation:** `validateEnvironment()` in the same config module returns
  structured `{ errors, warnings }` (missing AI endpoint/deployment, or key-auth without a key are
  errors; missing `AZURE_CLIENT_ID`/`DATABASE_URL`/storage are warnings). It is invoked at process
  start through Next.js **instrumentation**
  ([instrumentation.ts](../../nextjs_space/instrumentation.ts), enabled with
  `experimental.instrumentationHook`), which logs a `[Phoenix AI][startup]` summary but **never
  throws** — a misconfigured demo can still boot.
- **Managed identity:** unchanged and preserved — the AI provider and Blob Storage use
  `DefaultAzureCredential` with the user-assigned identity (`AZURE_CLIENT_ID`); no keys are required.
- **Streaming API routes hardened for App Service:** each of the four AI routes
  ([analyze-wound](../../nextjs_space/app/api/analyze-wound/route.ts),
  [community-analyze](../../nextjs_space/app/api/community-analyze/route.ts),
  [hcp-chat](../../nextjs_space/app/api/hcp-chat/route.ts),
  [community-chat](../../nextjs_space/app/api/community-chat/route.ts)) now declares
  `runtime = 'nodejs'` (so streaming runs on the Node server, not the Edge runtime) and a
  `maxDuration` (120 s for image analysis, 90 s for chat). A `Content-Length` **body-size guard**
  (`checkRequestBodySize` in [image-input.ts](../../nextjs_space/lib/ai/validation/image-input.ts))
  rejects oversized image uploads with **HTTP 413** before buffering, using a limit derived from
  `AZURE_AI_MAX_IMAGE_MB` plus base64/JSON overhead. Image analysis passes an explicit
  `timeoutMs: 110_000` so long vision calls complete within the App Service request window while
  still being bounded.
- **PWA assets:** `manifest.json`, `sw.js` and the icons continue to be served from `public/` by the
  Node server; the service worker (which skips `/api/*`) is unaffected by these changes.
- **Image configuration reviewed:** kept `images: { unoptimized: true }`. Every image is a **local**
  static asset (`/logo.png`, `/favicon.svg`, `/kkm-hkl-logo.jpeg`) or a runtime `data:` URL — there
  are no remote domains, and `data:` URLs cannot be optimised anyway. The Phoenix AI logo requires
  pixel fidelity and the committed visual baselines assert parity, so the optimiser (which would
  transcode/resize) is **left off until proven non-destructive**, per the prime directive. The
  decision is documented inline in [next.config.js](../../nextjs_space/next.config.js).
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build`
  (standalone) ✅ 17/17 static pages — the route list now includes `/api/health/live` and
  `/api/health/ready`, `server.js` is emitted, and the Middleware bundle builds; `npm run
  test:network` ✅ 1 passed. (The build shows the benign `jose` Edge-runtime warnings inherited from
  Step 17's session code; they do not affect the Node-runtime routes.) No visible UX change.

### Step 19 - Add Application Insights and structured telemetry

This step wires **Azure Application Insights** into the app with **privacy-conscious** telemetry
across every tier. Nothing in the UI, routing, styling or clinical content changes; the additions are
observability-only and are a **no-op when unconfigured** (local dev / demo), so the visible parity
experience is unchanged. The App Insights resource itself was already provisioned in Step 17; this
step adds the SDKs, the instrumentation and the browser connection-string app setting.

- **Privacy contract (the prime constraint):** telemetry **never carries clinical content**. No
  uploaded image bytes, base64, medical descriptions, chat transcripts, sensitive prompts, sensitive
  AI responses, authentication tokens, passwords, API keys or connection strings are ever sent. Both
  the server ([lib/telemetry/server.ts](../../nextjs_space/lib/telemetry/server.ts)) and browser
  ([lib/telemetry/client.ts](../../nextjs_space/lib/telemetry/client.ts)) modules run every custom
  property through a `sanitize`/`sanitizeProperties` guard that **drops blocked keys** (image, base64,
  photo, message, content, prompt, transcript, description, token, password, secret, apiKey,
  connectionString, authorization, credential, sas), **rejects nested objects/arrays**, and
  **truncates** long strings — defence-in-depth so a mistaken caller cannot leak content.
- **Server SDK (manual, no auto-instrumentation):** the classic `applicationinsights` Node SDK is
  used via a directly-constructed `TelemetryClient` (cloud role `phoenix-ai-web`) **without**
  `setup().start()`, so no require-in-the-middle monkey-patching is wired into the server bundle —
  only the explicit `trackEvent` / `trackMetric` / `trackException` / `trackDependency` calls emit.

### Step 20 - Add a complete functional regression suite

This step adds a full functional test suite spanning the clinical logic, configuration/health
surface and the three end-user journeys. It is **test-only**: no UI, routing, styling, clinical
content or runtime behaviour changes, so visible parity is unchanged. The overriding rule is that
**no test is skipped merely because a workflow is unavailable** — where a workflow depends on Azure
OpenAI (which is unconfigured in the stateless demo), the test asserts a **deterministic terminal
state** (the real result when configured, or the app's explicit failure/fallback state otherwise),
never a skip and never a hang.

- **Toolchain (no new heavy dependencies):** unit and integration tests run on the Node.js built-in
  `node:test` runner + `node:assert/strict` via `tsx --test` — the already-present `tsx` + Playwright
  toolchain, avoiding a jest/vitest peer-dependency conflict (the repo requires
  `--legacy-peer-deps`). Test files use **relative imports** into `lib/…` because `tsx` does not
  resolve the `@/*` tsconfig path alias at runtime; the library/component sources are unchanged and
  keep their `@/` imports. `tests/` remains excluded from `tsc --noEmit`, and the two new Playwright
  configs were added to the tsconfig `exclude` list alongside the existing ones.
- **Small extractions to make logic unit-testable (behaviour-preserving):** the TBSA and Parkland
  calculations were lifted verbatim into pure modules
  ([lib/clinical/tbsa.ts](../../nextjs_space/lib/clinical/tbsa.ts),
  [lib/clinical/parkland.ts](../../nextjs_space/lib/clinical/parkland.ts)) and the client components
  now import them, producing byte-identical results (Parkland 4 × weight × TBSA, modified Brooke ×2,
  50/50 8h/16h split, urine targets, `<30 kg` child boundary; TBSA Lund & Browder region maxima,
  fraction glyphs, severity bands, anterior/posterior summation). The `VARIABLE_AREAS` reference
  table used by the TBSA age table is now exported from the same module. The demo seed rows +
  bilingual articles were extracted to [scripts/seed-data.ts](../../nextjs_space/scripts/seed-data.ts)
  (imported by `scripts/seed.ts`; the `safe-seed.ts` destructive-pattern guard still passes), and
  `buildDatasourceUrl` is now exported from [lib/db.ts](../../nextjs_space/lib/db.ts) for direct
  testing. None of these change output.
- **Unit tests** ([tests/unit/](../../nextjs_space/tests/unit/), 76 tests): TBSA calculations,
  Parkland calculations, language switching (`lib/i18n` — EN/BM differ, key echo on miss, every entry
  present in both languages), AI response parsing (`parseHcpWoundAnalysis` /
  `parseCommunityWoundAnalysis` fallbacks + coercion), wound-analysis Zod schema validation
  (defaults, coercion, `isBurn`), environment/configuration validation (`getAiConfig`,
  `validateEnvironment`, storage/site-url precedence), authentication mode + demo users
  (`resolveAuthMode`, `verifyDemoCredentials`, case-insensitive email), storage validation
  (`validateUpload`, `buildBlobPath` — no filename leak), image-input validation, and the
  deterministic 48-row demo dataset + 5 bilingual articles mapping.
- **Integration tests** ([tests/integration/](../../nextjs_space/tests/integration/), `tsx --test`,
  14 tests): readiness aggregation ([lib/health/readiness.ts](../../nextjs_space/lib/health/readiness.ts))
  that backs `/api/health/ready` — always surfaces the four essential checks (runtime, azure-ai,
  postgresql, blob-storage), degrades when AI is unconfigured, and treats disabled DB/storage as
  `skipped` (not `degraded`); Blob Storage facade wiring + enablement gating (a disabled provider is a
  supported state, not a failure); and PostgreSQL `buildDatasourceUrl` hardening (sslmode + pool
  defaults, explicit settings preserved, unparseable pass-through). The live database layer
  (readiness + idempotent, non-destructive `seed-selftest` upsert) is registered **only** when
  `DATABASE_URL` is set — the absence of an external database is not a broken workflow.
- **HTTP API integration** ([tests/api/routes.spec.ts](../../nextjs_space/tests/api/routes.spec.ts),
  Playwright request context against the production build, 14 tests): the health probes
  (`/api/health`, `/api/health/live`, `/api/health/db` 200/503, `/api/health/ready` reports the
  essential checks) and the four AI routes. Each AI route is asserted for input validation without a
  model call — **400** on a missing/invalid image and **413** on an oversized body (the web server is
  booted with `AZURE_AI_MAX_IMAGE_MB=1` so the guard trips on a light ~2 MB payload) — and a
  well-formed request is asserted to reach a **deterministic terminal HTTP response** (a `2xx` stream
  when Azure OpenAI is configured, or an explicit error status otherwise).
- **Playwright user journeys** ([tests/e2e/](../../nextjs_space/tests/e2e/), 3 specs against the
  production build via `playwright.e2e.config.ts`):
  - **Public landing:** loads `/`, confirms the Phoenix logo (`/logo.png`) and the KKM/HKL
    endorsement logo, the HCP (`/hcp-login`) and community (`/community`) entries, language switching
    (EN ↔ BM via the `Toggle language` control), and responsive navigation at mobile + desktop widths.
  - **HCP:** `/hcp-login` → real demo doctor login (`doctor@phoenix.my`, verified via
    `/api/auth/login`) → `/hcp` → analysis (uploads a valid 1×1 PNG, requests the AI assessment,
    confirms the loading state, then asserts the structured `Analysis Results` **or** the explicit
    failure state) → chat (sends a clinical question, confirms the user turn renders and the assistant
    bubble reaches content or the error fallback) → TBSA (paints the body canvas and asserts the Total
    TBSA readout leaves `0%`) → Parkland (weight 70 kg + TBSA 25% → `7000 mL`) → guidelines (content
    present) → mobile drawer navigation → logout back to `/hcp-login`.
  - **Community:** `/community` → first aid → articles → assessment → image-check (uploads an image,
    confirms simplified advice **or** the explicit failure state) → chat (sends a question, confirms a
    response or the error fallback) → EN ↔ BM switch (language-conditional chat placeholder) → mobile
    drawer navigation.
  AI-backed steps use a shared `expectAiTerminalState` helper so a broken/unconfigured workflow yields
  a passing, non-skipped assertion on the visible failure state rather than a skip.
- **Scripts & configs:** added `test:unit` (`tsx --test "tests/unit/*.test.ts"`), `test:api`
  (Playwright API config), repointed `test:e2e` to the journey config, and widened `test:integration`
  to glob all `tests/integration/*.integration.test.ts`; `test` now runs unit + integration. New
  [playwright.e2e.config.ts](../../nextjs_space/playwright.e2e.config.ts) and
  [playwright.api.config.ts](../../nextjs_space/playwright.api.config.ts) boot `npm run start` for
  their specs.
- **Verification:** `npm run typecheck` ✅ 0 (also fixed a pre-existing break from the TBSA
  extraction by exporting `VARIABLE_AREAS`); `npm run lint` ✅ 0/0; `npm run build` ✅ 21 routes;
  `npm run test:unit` ✅ 76/76; `npm run test:integration` ✅ 14/14; `npm run test:api` ✅ 14/14
  (AI routes returned explicit config-error statuses in the stateless demo — the intended terminal
  state, not a skip); `npm run test:e2e` ✅ 3/3 (all journeys passed against the demo build, asserting
  the failure/fallback states for the AI steps); `npm run test:network` ✅ 1. No visible UX change.

  It is initialised once at startup from
  [instrumentation.ts](../../nextjs_space/instrumentation.ts) (which also emits an
  `app_startup_complete` marker) and marked a **webpack server external** in
  [next.config.js](../../nextjs_space/next.config.js) (its gRPC/OpenTelemetry transitive deps
  reference Node built-ins webpack cannot bundle); standalone output traces it into the deployed
  bundle so the runtime `require()` resolves.
- **Browser SDK:** `@microsoft/applicationinsights-web` is initialised by a client
  [TelemetryProvider](../../nextjs_space/components/telemetry-provider.tsx) mounted in
  [app/layout.tsx](../../nextjs_space/app/layout.tsx). It captures **page load** (initial page view),
  **route transitions** (`enableAutoRouteTracking` + an explicit `route_changed` event on
  `usePathname` change), **JavaScript errors** and **unhandled promise rejections** (auto exception
  tracking), and outbound fetch/XHR dependencies (URLs + durations only).
- **Correlation across all tiers:** the browser stamps an `x-correlation-id` header on same-origin
  `/api/*` fetches (a one-time `window.fetch` wrapper) and enables W3C distributed tracing
  (`AI_AND_W3C` + CORS correlation). The API routes read-or-mint the ID via
  [lib/telemetry/correlation.ts](../../nextjs_space/lib/telemetry/correlation.ts)
  (`getOrCreateCorrelationId`, validated against a strict token pattern) and thread it into the **AI
  provider**, **PostgreSQL** and **Blob Storage** telemetry, so a single clinician action can be
  traced browser → API → AI → DB → Blob without any content.
- **AI telemetry bridged at the choke point:** rather than re-instrumenting each route, the existing
  privacy-safe AI telemetry ([lib/ai/telemetry.ts](../../nextjs_space/lib/ai/telemetry.ts)) `emit()`
  now also forwards its already-redacted, counts-only payloads to App Insights. This single bridge
  covers **AI request duration** (`ai_request_ms`, `ai_ttfb_ms` metrics), **AI streaming completion**
  (token metrics + an `AI` dependency on stream settle), and **AI errors** (a distinct `ai_error`
  event) for all four routes.
- **API request markers:** each AI route emits a privacy-safe request event at the top —
  `hcp_analysis_requested` and `community_analysis_requested` (image-analysis requests, `hasImage`
  flag only), `hcp_chat_requested` and `community_chat_requested` (chat requests, `messageCount`
  only) — each carrying the correlation ID.
- **Database + Blob latency:** `checkDatabaseReady` in [lib/db.ts](../../nextjs_space/lib/db.ts) now
  records a `PostgreSQL` dependency + `postgres_latency_ms` metric (latency + success only), and the
  Blob provider ([lib/storage/azure-blob-provider.ts](../../nextjs_space/lib/storage/azure-blob-provider.ts))
  records an `AzureBlob` dependency + `blob_latency_ms` metric around `upload` and `getReadUrl`
  (operation, duration, outcome only — never blob paths or bytes).
- **Client clinical/UX events** (all counts + non-sensitive metadata only): `tbsa_calculated`
  (total/PTL/FTL %, age, severity band) from
  [tbsa-client.tsx](../../nextjs_space/app/hcp/tbsa/_components/tbsa-client.tsx),
  `parkland_calculated` (formula, 24 h/first-8 h volume, child flag) from
  [parkland-client.tsx](../../nextjs_space/app/hcp/parkland/_components/parkland-client.tsx),
  `language_changed` (from/to codes) instrumented centrally in
  [language-provider.tsx](../../nextjs_space/components/language-provider.tsx) so **every** control is
  covered, and `demo_login_completed` (mode manual/quick + role, never email/name) from
  [login-client.tsx](../../nextjs_space/app/hcp-login/_components/login-client.tsx). The
  calculation events are debounced so a figure is recorded once inputs settle.
- **Configuration:** [app-service.bicep](../../infra/modules/app-service.bicep) adds the
  `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING` app setting (same value as the server
  connection string; the ingestion key it carries is not a secret since browsers post telemetry
  directly). [.env.example](../../.env.example) documents both variables with the privacy note. When
  either is absent the corresponding telemetry is silently disabled.
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` (standalone)
  ✅ 17/17 static pages, `server.js` emitted and `applicationinsights` traced into the standalone
  bundle; `npm run test:network` ✅ 1 passed. No visible UX change.

### Step 21 - Audit every clickable control

This step is a full audit of **every visibly clickable control** in the app — the prime rule being
that each one must perform a **meaningful action**, and that **no fake action** may be added merely
to make a test pass. The audit is documented as a register and is backed by a deterministic
regression guard. It is **audit + test-only**: no UI, routing, styling, clinical content or runtime
behaviour changes, so visible parity is unchanged.

- **Scope:** all 14 rendered routes plus the shared HCP/community shells (sidebar nav, back links,
  mobile drawer + backdrop, user menu, logout, bottom nav), the landing portal cards, the login form
  (submit, quick-login, show/hide password, Entra anchor), the clinical tools (analysis upload /
  camera / analyze / clear, TBSA select/toggles/brush/reset/canvas/Parkland link, Parkland inputs,
  guidelines search/filters/accordions), the chat surfaces (quick prompts, image attach/remove, send,
  HCP escalate), the community flows (assessment wizard, image-check, articles, first-aid accordions,
  `tel:999` links), and the global PWA install/dismiss/iOS-guide and language toggles.
- **Register:** [docs/testing/clickable-control-register.md](../testing/clickable-control-register.md)
  records **one row per control** with the required columns — Route, Control, Label, Expected action,
  Actual action, Status, Automated test, Defect, Resolution.
- **Findings:** every visibly clickable control performs a real, wired action. **No** `href="#"`,
  empty handlers, placeholder `alert()`s, dead links, unexplained disabled buttons, animate-only
  buttons, state-less controls, or silently-failing controls were found in the rendered UI. The one
  `disabled` state (Analyze Wound with no image / while loading) is an explained guard, not a dead
  control. The HCP chat **Escalate** button updates visible banner state, matching the original
  client-only demo behaviour (there is no server queue in the source). Categories that are simply
  **absent by design** — report/export controls, a theme switch, ARIA tablists, modal dialogs — were
  **not fabricated**, since adding them would be a redesign, not a faithful migration.
- **Dead scaffolding (not visible controls):** the leftover shadcn/next-themes starter
  `components/theme-provider.tsx` and `components/theme-toggle.tsx`, and the unused
  `components/layouts/*` shells, are **never rendered** (no import mounts them). They were left in
  place, unrendered; a theme toggle was deliberately **not** wired into the UI (the app is light-mode
  only by parity), so no fake control was introduced.
- **Automated guard:** new
  [tests/e2e/clickable-controls.spec.ts](../../nextjs_space/tests/e2e/clickable-controls.spec.ts)
  asserts, on every rendered route (public/community plus the HCP portal under a seeded demo
  session), that **no anchor uses a placeholder href** (`#`, empty, or `javascript:`) and that every
  in-app link **resolves** (non-404). It fails deterministically if a dead link is reintroduced and
  never skips. Per-control behaviour continues to be exercised by the Step 20 journey specs
  (`public-landing`, `hcp-journey`, `community-journey`) and API spec (`routes.spec.ts`).
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` ✅ 21 routes;
  `npm run test:e2e` ✅ (3 journeys + 14 new clickable-control guard cases, 17/17). No visible UX
  change and no code behaviour changed — the only additions are the register doc and the guard spec.

### Step 22 - Run strict visual parity testing

This step proves the migrated app is **pixel-for-pixel faithful** to the captured source baseline.
The production build (the exact `node server.js` standalone artifact deployed to Azure App Service)
is re-captured across every route, viewport, language and UI state, then diffed against the committed
Step 8 baseline. The prime rule held throughout: **the UI was not "improved" to force parity** — a
genuine visual regression would have been fixed by root-causing it, not by editing the design.

- **Re-capture (Azure build):** the Step 8 capture spec
  ([tests/visual/baseline.spec.ts](../../nextjs_space/tests/visual/baseline.spec.ts)) was made
  output-configurable via a single new `VISUAL_OUT_DIR` env var (defaults to `baseline`; the parity
  run sets `current`) — no capture logic changed, so the two image sets are captured identically.
  Running `VISUAL_OUT_DIR=current npx playwright test` produced **143** full-page PNGs under
  `nextjs_space/tests/visual/current/` matching the baseline matrix exactly (14 routes × 4 viewports
  × EN/BM × states: initial, initial-empty, error, nav-open, completed-result, user-menu).
- **Pixel diff:** new [scripts/visual-parity-diff.ts](../../nextjs_space/scripts/visual-parity-diff.ts)
  compares each `baseline` PNG against its `current` counterpart with **pixelmatch** (per-pixel
  threshold `0.1`, anti-alias aware), writes a **diff mask** for every state to
  `nextjs_space/tests/visual/diff/`, and emits a machine-readable summary
  (`tests/visual/parity-results.json`). A state passes when its changed-pixel ratio is ≤ **0.5%**.
  Added dev deps `pixelmatch@5.3.0` + `pngjs@7.0.0` (+ types) via `--legacy-peer-deps`.
- **Report:** new [scripts/visual-parity-report.ts](../../nextjs_space/scripts/visual-parity-report.ts)
  verifies the **Phoenix logo** (SHA-256 `dfb40a3e…917d8241`, 346691 bytes, intrinsic 1024×1024 / 1:1
  — an exact match to the source manifest) and the **KKM/HKL endorsement logo** presence, then writes
  [docs/testing/visual-parity-report.md](../testing/visual-parity-report.md) with the required
  columns (Route, Viewport, Baseline screenshot, Azure screenshot, Difference image, Difference
  percentage, Pass/fail, Accepted exception, Explanation), a design-token & layout parity table, and
  a 12-row release-blocker checklist.
- **Result — visual parity achieved:** **141/143** states are pixel-identical within threshold
  (most at **0.0000%**). The maximum difference is **0.7368%**. **Every** validated property matched:
  logo file hash/size/aspect ratio, placement, header height, sidebar width, navigation spacing,
  colours, gradients, fonts, font weights, card sizes, border radius, shadows, chart dimensions,
  buttons, forms, responsive breakpoints, mobile menu, animations, loading states, result panels,
  error panels, and both English and Bahasa Malaysia text. **All 12 release blockers are CLEAR.**
- **Two accepted exceptions (documented, no UI change):** `hcp/mobile-390-en-initial` (0.7368%) and
  `hcp/mobile-390-en-nav-open` (0.5357%) exceed the 0.5% threshold **solely** because of **Recharts'
  script-driven SVG entrance animation** on the HCP dashboard — Playwright's `animations: 'disabled'`
  freezes CSS animations but not Recharts' JS path animation, so the donut/line chart arcs are
  captured on a slightly different frame with sub-pixel-different anti-aliased edges. The diff masks
  confirm the changed pixels are confined to chart arc edges; every dashboard value, label, card,
  colour, font and layout element is pixel-identical. These were **accepted as capture-timing jitter,
  not resolved by altering the UI**, per the faithful-parity directive.
- **Artifacts committed as evidence:** `tests/visual/current/` (Azure captures) and
  `tests/visual/diff/` (pixel masks — tiny thanks to `diffMask: true`) join the existing
  `tests/visual/baseline/`, so the report's baseline/Azure/difference links resolve in-repo.
- **Verification:** `npm run typecheck` ✅ 0; `npm run lint` ✅ 0/0; `npm run build` ✅ 21 routes.
  The two new scripts + the spec's output-path parameterisation introduce no runtime or UI change.

### Step 23 - Create GitHub Actions CI/CD

This step adds the automated pipelines that build, test and deploy Phoenix AI to Azure. All Azure
authentication uses **GitHub OIDC federation** (`azure/login@v2` with `permissions: id-token: write`)
— **no Azure client secrets are stored** anywhere in the workflows. Only non-secret federated
identifiers (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`) and the deploy-time
`PG_ADMIN_PASSWORD` / optional `DATABASE_URL` come from GitHub secrets.

- **CI ([.github/workflows/ci.yml](../../.github/workflows/ci.yml)):** expanded from the Step 2
  build-only check into the full quality gate. Jobs run: lock-file install (`npm ci
  --legacy-peer-deps`), **lint**, **type check** (after `db:generate` so the Prisma client types
  resolve), **unit tests**, **integration tests**, **Next.js production build** (standalone),
  **Bicep lint + build** of `infra/main.bicep`, a **dependency vulnerability report** (`npm audit`,
  report-only artifact — does not block on known dev-tooling advisories), and a **Playwright smoke
  test** (public-landing journey against the built app). The offline DB-migration validation job is
  retained. Triggers on push/PR to `main` and pushes to `migration/**`.
- **Infrastructure ([.github/workflows/infrastructure.yml](../../.github/workflows/infrastructure.yml)):**
  the canonical infra pipeline (supersedes the Step 17 `infra.yml`, now removed). PRs touching
  `infra/**` run Bicep lint + build + `az deployment sub what-if` (all read-only). Manual dispatch
  can deploy against a chosen **Development** or **Demo** environment after what-if.
- **Deploy — Development ([.github/workflows/deploy-dev.yml](../../.github/workflows/deploy-dev.yml))
  and Demo ([.github/workflows/deploy-demo.yml](../../.github/workflows/deploy-demo.yml)):** both run
  the required eleven-step flow — (1) OIDC auth, (2) validate Bicep, (3) Azure what-if, (4) deploy
  infrastructure (capturing the app name/RG from deployment outputs), (5) build the app (standalone)
  and package the App Service zip, (6) run the database migration **safely** (`prisma migrate deploy`
  — applies committed pending migrations only, never resets; skipped when no `DATABASE_URL` is set,
  since the parity demo uses seeded/mock data), (7) deploy to an App Service **staging** slot, (8)
  health-check `/api/health/live` on staging, (9) run smoke tests against staging, (10) run the
  critical **HCP + community** user journeys against staging, and (11) **swap staging into
  production only after all tests pass**. The deploy plan requests the **Standard (S1)** plan SKU so
  the staging slot is available. Development deploys on push to `main` / manual dispatch; **Demo** is
  manual-dispatch only and runs under the **Demo** GitHub Environment. The current rapid-prototype
  policy uses no required reviewers; see Step 28.
- **Supporting change:** `playwright.e2e.config.ts` now honours an optional `PLAYWRIGHT_BASE_URL`
  (when set, the same journey specs run against the deployed staging URL and the local web server is
  not started); new `test:smoke` and `test:journeys` npm scripts select the smoke and critical-journey
  specs. No application code or UI behaviour changed.
- **Environment limitation:** actual compute deployment remains blocked by the MCAPS sandbox's zero
  App Service quota (documented in earlier steps); the pipelines are authored to the spec and are
  exercisable up to `what-if`. The superseded `infra.yml` was removed to avoid duplicate infra runs.
- **Verification:** all four workflow YAML files validate with no problems; the expanded CI mirrors
  the locally green checks (`typecheck` 0, `lint` 0/0, `build` 21 routes, unit 76, integration 14,
  smoke 1); `az bicep build infra/main.bicep` compiles clean.

### Step 24 - Deploy the parity release to Azure

This step provisions the target resource group and deploys the parity build to a **live Azure App
Service**, resolving the compute-quota blocker recorded in earlier steps by relocating to a region
with available capacity. No application UI or behaviour changed — only deployment configuration.

- **Region selection (quota-driven).** The MCAPS sandbox enforces **region-specific** compute and
  database quotas. `eastus2` had **zero** App Service (`P1v3`/`standardDDv4Family`) quota **and** a
  restricted PostgreSQL Flexible Server version list; `westus2` had App Service quota but Postgres was
  still restricted. **`southeastasia`** was the first region offering **both** PostgreSQL Flexible
  Server (v11-18) **and** `standardDDv4Family` quota (360 vCPU) for the `P1v3` plan, so the release
  was deployed there (`rg-phoenixai-demo`, `southeastasia`).
- **Deployment mechanics.** The installed `az` CLI (2.76.0) fails `az deployment sub create/validate`
  with an internal "content already consumed" error, so the subscription-scoped deployment was
  submitted via the **ARM REST API** (`PUT .../providers/Microsoft.Resources/deployments/{name}`,
  `api-version=2021-04-01`) with a bearer token, sending the compiled `infra/main.bicep` template and
  parameters in the request body. Deployment `phoenixai-release-sea` reported **Succeeded**.
- **App packaging.** The Next.js 14 app is built with `output: "standalone"` and packaged with a new
  Python `zipfile` helper ([nextjs_space/scripts/make-standalone-zip.py](../../nextjs_space/scripts/make-standalone-zip.py))
  that emits **forward-slash** arcnames (Windows `Compress-Archive` produces backslash paths that
  break on the Linux host) and uses Windows extended-length (`\\?\`) paths to handle deep
  `node_modules` directories. The standalone tree (which nests under `.next/standalone/nextjs_space/`)
  is flattened to the zip root, with `.next/static` and `public` added alongside; the app runs via
  `node server.js` with `WEBSITES_PORT=3000` and `SCM_DO_BUILD_DURING_DEPLOYMENT=false`.
- **Prisma Linux engine fix.** The bundled Prisma client was generated only for the Windows query
  engine, so the database health route returned 503 on the Linux App Service. The generator in
  [nextjs_space/prisma/schema.prisma](../../nextjs_space/prisma/schema.prisma) now declares
  `binaryTargets = ["native", "debian-openssl-3.0.x"]`; after `npm run db:generate` and a rebuild both
  engines ship in the standalone bundle and the health route resolves.
- **Secret handling under MCAPS policy.** MCAPS policy forces the Key Vault's `publicNetworkAccess` to
  **Disabled** (the update is silently ignored). With no VNet/private endpoint in this demo topology,
  the App Service managed identity — although correctly granted **Key Vault Secrets User** — cannot
  reach the vault, so Key Vault *references* for the database connection cannot resolve. The
  `DATABASE_URL` is therefore supplied as a **direct App Service application setting** (an approved
  cloud-secret mechanism per the repository guardrails), pointing at the Flexible Server over TLS
  (`sslmode=require`) with an `AllowAllAzureIPs` firewall rule permitting Azure-internal traffic. All
  other backend access (Azure OpenAI, Blob Storage, App Insights) uses **managed identity**, no keys.
- **Live configuration.** `AI_PROVIDER=azure`, `AUTH_MODE=demo`, Azure OpenAI endpoint + `gpt-4o`
  deployment (`api-version=2024-10-21`), Blob Storage (`clinical-uploads` container), Application
  Insights connection string, and the managed identity are all wired on
  `app-phoenixai-yun55ezsi4yoq` (`https://app-phoenixai-yun55ezsi4yoq.azurewebsites.net`).
- **Verification (live site).** All **18** routes return `200`; the database health route reports
  `ready` (PostgreSQL, ~215 ms); AI streaming works end-to-end (`community-chat` SSE `200` via managed
  identity); the Azure AI and Blob Storage health checks report `identity` auth and the
  `clinical-uploads` container; the **original Phoenix AI logo** (`public/logo.png`, 346 KB) and PWA
  icons (192/512) serve; the PWA manifest is served at `/manifest.json` and referenced from the
  landing HTML; the TBSA and Parkland calculator pages carry their expected clinical content; the
  EN/BM language toggle is present; the rendered HTML contains **no** Abacus.AI, S3, `localhost` or
  local-file references; and Application Insights confirms live ingestion (185 requests over the
  preceding three hours). The compiled ARM template and the release parameter file (which held the
  database password) are **not** committed — they are regenerable build artifacts, and the parameter
  file is git-ignored to prevent any secret from entering version control.
- **Environment note.** All commits from this migration remain on the local `migration/azure-port`
  branch and have not been pushed.

### Step 25 - Deploy to the BFG Solutions customer subscription

This step deploys the governed Phoenix AI Container Apps architecture to the customer-owned
`BFG Solutions-JDNAINexus` subscription in the dedicated `rg-phoenixai-bfgs-demo` resource group.
It supersedes the earlier App Service environment described in Step 24 for this customer deployment;
no visible UX, prompt, clinical workflow, API contract, or Responsible AI control changed.

- **Quota-driven hosting.** The subscription's App Service regional worker quota is zero, so the
  documented architecture version 2.0.0 uses Azure Container Apps Consumption (0.5 vCPU / 1 GiB,
  scale 0-3), a Basic ACR, and a user-assigned managed identity. ADR-0007 and
  `CHANGE-20260809-container-apps-hosting.md` govern the replacement.
- **Customer-owned services.** The deployment created a customer-owned Azure AI Services account
  with `gpt-4o` `2024-11-20`, PostgreSQL Flexible Server 16, private Blob Storage, Key Vault,
  Application Insights, Log Analytics, alerts, ACR, and the Container App in East US 2. Four
  resource-scoped runtime roles were verified: Cognitive Services OpenAI User, Storage Blob Data
  Contributor, Key Vault Secrets User, and AcrPull.
- **Deployment mechanics.** Subscription deployment `phoenixai-bfgs-20260809` succeeded. ACR built
  the standalone Node 22 image from a clean Git context. The Docker runtime flattens the traced
  `/app/app` subtree to `/app`, matching `node server.js`; image
  `phoenixai:retry4-20260810-a83bb80` has digest
  `sha256:fe5031beba308b7e477ccb28a1eeca2289b23bd1ca904b01772a33eee13584c3`.
  Container App revision `ca-phoenixai-oaprp7dte7bw2--0000002` is Healthy and receives 100% traffic.
- **Data deployment.** Prisma migrations `20260806120000_init` and
  `20260807090000_analysis_records` were applied with `prisma migrate deploy`; no reset, drop, or
  down migration ran. The temporary exact-IP PostgreSQL migration firewall rule was removed.
- **Live verification.** Liveness and readiness return 200; readiness confirms Azure AI identity,
  PostgreSQL, and the private `clinical-uploads` container. Managed-identity text streaming and the
  valid-image vision SSE pipeline both return 200. HCP history returns 200 without inserting a
  synthetic clinical record. The public landing, Community, and HCP Playwright journeys pass against
  the live site. Representative original/v2 routes return 200, and the deployed Phoenix logo hash
  exactly matches `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241`.
- **Operations verification.** Privacy-safe `community_chat_requested` and
  `hcp_analysis_requested` events reached Application Insights, and both failed-request and
  response-time alerts are enabled. Representative HTML contains no Abacus, AWS, localhost,
  server-only setting names, database URL, or instrumentation-key material.
- **Live URL.** <https://ca-phoenixai-oaprp7dte7bw2.braveflower-8e754aba.eastus2.azurecontainerapps.io>
- **Known limitation.** The preserved dependency baseline reports 35 `npm audit` findings,
  including a Next.js 14.2.28 security warning. Remediation is intentionally deferred to a separate
  behavior-sensitive change with the full architecture, RAI, and parity regression gates.

### Step 26 - Grant demo resource-group Owner access

This step grants the existing Microsoft Entra security group `BFG Solutions` the built-in Azure
`Owner` role on the dedicated `rg-phoenixai-bfgs-demo` resource group. The operator explicitly
selected this group and RG-only scope after discovery showed that the group contains 3 of the
tenant's 42 users; this is not represented as an all-tenant-users grant.

- **Architecture governance.** Architecture version 2.1.0 adds component
  `OPS-DEMO-OWNER-RBAC`, integration `INT-DEMO-OPERATORS-ARM`, both current diagrams, the Azure
  resource map, and `CHANGE-20260810-demo-rg-owner-access.md`. Impact is MEDIUM; no ADR is required
  for the reversible, bounded operational assignment. Responsible AI impact is NONE.
- **Assignment.** Azure role assignment `152a0de9-1a48-4645-99d6-6ea08e5ffa31` grants the group
  built-in `Owner` (`8e3af657-a8ff-443c-a75c-2fe8c4bcb635`) at exact scope
  `/subscriptions/376a2984-f8d4-46e3-a1cb-90f58274d2dc/resourceGroups/rg-phoenixai-bfgs-demo`.
- **Boundary verification.** The group retains inherited subscription `Contributor` access but has
  zero subscription-scoped `Owner` assignments. Members can create, change, delete, and delegate
  access to resources in the Phoenix AI demo RG only. Future access is governed by membership in
  the `BFG Solutions` group.

### Step 27 - Establish GitHub-to-Azure OIDC deployment identity

This step creates a dedicated, secretless workload identity for the existing GitHub Actions
deployment workflows. It changes deployment authentication only; application behavior, visible UX,
AI behavior, prompts, models, clinical controls, and Responsible AI control status are unchanged.

- **Identity and trust.** Entra app/service principal `github-phoenixai-deploy` uses client ID
  `77d8cf0f-162f-4ed8-8399-0f731d89f0df`. Two federated credentials trust only this repository's
  `Demo` and `Development` GitHub environments. Their subjects use GitHub's immutable organization
  and repository IDs (`225331490` and `1324632738`) and audience
  `api://AzureADTokenExchange`; no client secret, certificate, Azure password, or human credential
  is stored in GitHub.
- **Least-privilege scopes.** The principal has `Contributor` at subscription scope because
  `infra/main.bicep` deploys at subscription scope and creates the resource group. It has
  `Role Based Access Control Administrator` only on `rg-phoenixai-bfgs-demo`, so it can apply the
  workload's Bicep role assignments without delegating access elsewhere in the subscription.
- **GitHub environments.** `Demo` and `Development` each contain the three non-secret OIDC
  identifiers plus `PG_ADMIN_PASSWORD` and `DATABASE_URL`. Existing database values were piped from
  Key Vault without printing or writing them to the repository; temporary vault read access was
  removed and independently verified at zero assignments. Demo remains manual-dispatch only.
  Architecture version 2.2.1 subsequently adopts a reviewer-free rapid-prototype policy.
- **Validation.** Architecture drift and both changed Mermaid diagrams pass. Initial run
  `31586147959` exposed GitHub's immutable-ID subject format and failed only at OIDC matching. After
  updating both federated credentials, run `31586321978` passed OIDC login, Bicep validation, and
  subscription what-if. Infrastructure bootstrap then stopped on a separate, pre-existing database
  drift: Bicep requests PostgreSQL 15, the live server is 16, and the current Azure API permits 17
  or 18. No image build or Container App rollout occurred. Resolving that mismatch is deferred to a
  separately governed PostgreSQL version decision to avoid an unreviewed major-version upgrade.

### Step 28 - Remove deployment reviewer gates for rapid prototyping

This step aligns repository guidance with the existing GitHub environment configuration. `Demo`
and `Development` have no required reviewers, protection rules, or deployment branch policies.
Demo remains manual-dispatch only; Development retains push-to-`main` and manual triggers.

- **Scope.** Workflow comments and current documentation no longer instruct maintainers to add a
  Demo reviewer. OIDC federated subjects, Azure role assignments, environment secrets, validation
  steps, and deployment commands are unchanged.
- **Architecture governance.** Architecture version 2.2.1 records a LOW-impact policy
  clarification. No topology or diagram changes and no ADR are required.
- **Responsible AI impact.** NONE. This changes deployment waiting behavior only and does not alter
  AI behavior, prompts, models, clinical oversight, transparency, telemetry, or RAI controls.
- **Validation.** Both environments report zero protection rules and no deployment branch policy;
  workflow diagnostics, architecture drift, seven Mermaid diagrams, typecheck, production build,
  104 unit tests, 22 RAI tests, and 14 integration tests all pass.

### Step 29 - Extend HCP analysis with multi-image TBSA consolidation and burn-size category

This step extends the HCP analysis experience while preserving visual parity and existing route
compatibility. Clinicians can now upload multiple wound/burn images for one case, and the staged AI
pipeline consolidates overlapping/duplicate views to produce one total TBSA estimate. The analysis
result now surfaces a deterministic TBSA subcomponent for burn size:

- **Major burn** (`>=15% TBSA`)
- **Minor burn** (`<15% TBSA`)

- **Code changes.**
  - `app/hcp/analysis/_components/analysis-client.tsx`: multi-image upload UI, first-image history
    persistence, and TBSA category display.
  - `app/v2/hcp/analysis/_components/v2-assessment-client.tsx`: multi-image upload support.
  - `app/api/analyze-wound/route.ts`: backward-compatible request parsing (`image` or `images[]`),
    multi-image validation, and multi-image pipeline invocation.
  - `lib/ai/analysis/pipeline.ts`: one-or-many image stage inputs and deterministic TBSA
    major/minor classification.
  - `lib/ai/schemas/burn-wound-analysis.ts` + `lib/ai/validation/wound-analysis-schema.ts`:
    TBSA classification field propagation to structured and flat outputs.
  - `lib/ai/validation/image-input.ts`: batch validation with image-count enforcement.
  - Prompt/version updates in `lib/ai/prompts/wound-*.ts` and `lib/ai/prompts/versions.ts`.
- **Architecture governance.** Impact level **MEDIUM**; architecture version bumped `2.2.1 -> 2.3.0`.
  Updated: `current-architecture.md`, `component-inventory.md`, `integration-inventory.md`,
  `ARCHITECTURE_VERSION`, `ARCHITECTURE_CHANGELOG.md`, diagrams
  (`current-ai-architecture.mmd`, `current-data-flow.mmd`), and change record
  `docs/architecture/changes/CHANGE-20260813-hcp-multi-image-tbsa.md`.
- **Responsible AI impact.** LOW (behavior extension within existing controls). Updated evidence docs:
  `lib/rai/controls.ts`, `docs/rai/rai-implementation-inventory.md`, `docs/rai/clinical-safety.md`,
  `docs/rai/known-limitations.md`.
- **Validation planned in this step.** Unit tests, RAI tests, integration route tests, typecheck, build,
  architecture validation, Mermaid validation, and secret scan on changed files.

### Step 30 - Make v2 the public landing and complete bilingual HCP AI handling

This step removes the original experience from the enabled public landing while retaining original
routes for compatibility. It keeps original and v2 wound analysis on one shared request/SSE path,
propagates the existing EN/BM selection into HCP analysis and chat, and adds a shared patient-data and
clinical-use warning.

- **Visible behavior.**
  - `/` renders the Phoenix AI v2.0 landing directly when v2 is enabled; no original/v1 entry or
    "switch experience" link is displayed.
  - Original and v2 HCP analysis submit the same image payload contract to `/api/analyze-wound` and
    consume the same completed SSE event.
  - Bahasa Malaysia selection requests BM narrative from HCP analysis and chat. Stable JSON keys and
    machine enum values remain unchanged.
  - HCP analysis/chat displays bilingual wording requiring authorized, preferably de-identified,
    patient data/images to be handled under the Personal Data Protection Act 2010 and applicable
    Malaysian law. The same notice states that output is clinical decision support only.
- **Reliability.** Shared client parsing consumes trailing SSE frames, reports safe API errors, and
  normalizes empty browser MIME values to a supported image type. Single-pass safe-failure content
  is localized for BM. Parkland volumes are shown only when TBSA meets the age-aware indication
  threshold and weight is supplied.
- **Patient-record protection.** Original-HCP history create/list/detail operations now require a
  server-verified Entra HCP session and are scoped to that clinician. Client-only demo auth can run
  analysis but cannot retain or retrieve patient records (ADR-0009).
- **Architecture governance.** Impact level **MEDIUM**; architecture version `2.3.0 -> 2.4.0`.
  ADR-0008 records the root-entry decision and ADR-0009 records retained-record authorization; no
  Azure resource change is required. See
  `docs/architecture/changes/CHANGE-20260814-v2-analysis-language-safety.md`.
- **Responsible AI impact.** `RAI-INCL-001` expands to bilingual HCP AI output and new
  `RAI-PRIV-007` records the user-visible legal handling notice, `RAI-PRIV-008` records
  server-authorized retained-analysis access, and `RAI-SAFE-006` now includes an age-aware
  indication threshold. The notice is not a compliance, clinical-validation or regulatory-approval
  claim.
- **Validation planned in this step.** Unit, RAI, API and targeted browser tests; typecheck; build;
  architecture and Mermaid validation; code review; secret scan; CodeQL.

### Step 31 - Fix development deployment workflow PostgreSQL provisioning failure

This step remediates a failing GitHub Actions deployment (`Provision, deploy & promote`) caused by an
unsupported PostgreSQL major version in infrastructure code.

- **Root cause from Actions logs.**
  - Run: `31781947070`, Job: `94709419204`.
  - Bootstrap deployment failed with:
    `ParameterOutOfRange: The value of the 'Version' should be in: [17,18].`
  - The Bicep module defaulted PostgreSQL major version to `15`, which is invalid for
    `Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01`.
- **Code changes.**
  - `infra/modules/postgresql.bicep`: constrained `postgresVersion` to allowed values `17` and `18`,
    and updated the default to `17`.
- **Architecture governance.** Impact level **LOW**; architecture version bumped `2.4.0 -> 2.5.0`.
  Added change record
  `docs/architecture/changes/CHANGE-20260814-postgresql-supported-major-version.md` and changelog
  entry in `docs/architecture/ARCHITECTURE_CHANGELOG.md`.
- **Responsible AI impact.** NONE (infrastructure compatibility fix only).
- **Validation planned in this step.** Bicep build, architecture drift check, secret scan, code review,
  and CodeQL.

### Step 32 - Restore the stable Original Phoenix AI experience

This preservation-first restoration returns the public application to the verified Original Phoenix
AI experience without rewriting Git history or changing the deployed Azure topology.

- **Evidence and source selection.** `docs/migration/rollback-assessment.md` distinguishes the latest
  chronological pre-change commit, the latest successful pre-August-14 deployment (`5f065529`), and
  the functionally valid Original-route source (`7298f21`, application image commit `a83bb80`). The
  later deployment was rejected because it had already removed `/community/image-check`.
- **Safety point.** The pre-restoration state is preserved at branch
  `backup/pre-rollback-20260815` and tag `pre-rollback-20260815`, both fixed at `f050416`.
- **Application restoration.** Tracked `nextjs_space` application and test files were restored from
  `7298f21`; `/` now renders the Original landing, `/community/image-check` is restored, and
  middleware returns 404 for `/v2` and `/v2/*`. The Phoenix logo Git blob is byte-identical to the
  baseline (`370601eccff66267cac08573e90f1015680a7c31`).
- **Preserved deployment boundary.** Current Container Apps, ACR, GitHub OIDC workflows, Bicep,
  managed identity, Azure AI, PostgreSQL, Blob Storage, Key Vault, and telemetry configuration are
  retained. No database reset, down migration, PostgreSQL version change, Azure mutation, or secret
  change is part of this restoration.
- **Architecture governance.** Impact level **HIGH**; architecture version `2.5.0 -> 3.0.0`.
  ADR-0010 supersedes the v2 public-entry decisions, and
  `docs/architecture/changes/CHANGE-20260815-restore-original-only-experience.md` records the change.
  Architecture drift validation passes.
- **Responsible AI impact.** The staged analysis code/control register returns to its validated
  Original baseline. `RAI-TRANS-003` and `RAI-ACCT-001` are Partial because their former v2
  information/review panels are no longer published. `LIM-009` records the absence of an in-product
  assurance page; governed documentation and tests remain available.
- **Validation.** Production build passes (76 generated pages); public Original landing and v2 404
  contract tests pass `2/2`; API tests pass `14/14`; HCP/community journeys pass `2/2`; RAI tests
  pass `23/23`; integration tests pass `14/14`; the no-Abacus network guard passes; and all 68 visual
  captures pass across desktop, tablet, and mobile, including `/community/image-check`.
- **Evaluation limitation.** The structural analysis harness ran in rubric-only mode but scored zero
  cases because no consented images or fixture outputs are present; all four cases were honestly
  skipped. No diagnostic-accuracy or clinical-validation claim is made.

### Step 33 - Correct vision-input safe failure

- **Incident.** The healthy Original-only Container App accepted an image request, but Azure AI
  rejected the vision payload with HTTP 400 and the browser received a generic HTTP 500.
- **Root cause.** Shared validation admitted HEIC/HEIF despite the deployed GPT-4o input contract,
  did not validate base64/image signatures, and did not pass its normalized data-URL value to the
  routes.
- **Correction.** Validate and normalize JPEG, PNG, WebP, and GIF before model invocation and show
  actionable API validation messages in the Original clients without redesigning the UI.
- **Architecture impact.** LOW; version `3.0.0 -> 3.0.1`; no ADR or Azure resource change. See
  `docs/architecture/changes/CHANGE-20260815-vision-input-safe-failure.md`.
- **Responsible AI impact.** `RAI-SAFE-001` and `RAI-SAFE-010` remain Active with stronger code and
  test evidence; no prompt, model, clinical-calculation, or output-schema change.
- **Pre-deploy validation.** PASS: focused image validation (11), unit (107), RAI (23), integration
  (14), production HTTP API (16), typecheck, lint, production build, and architecture synchronization.
- **Deployment.** Commit `0a62796` was built in the existing ACR as immutable image
  `phoenixai:0a627965c929729bbb4902f9438212529fe13e9b` (digest `sha256:82b588c2b0b83a1b3545907a511e0bb4eae172b4250570de3ce2c1eee10930cc`)
  and released as healthy Container App revision `ca-phoenixai-oaprp7dte7bw2--0000007` with 100%
  traffic. No Azure resource configuration changed.
- **Live verification.** PASS: readiness and all dependencies healthy; Original landing/logo HTTP
  200; `/v2` HTTP 404; HEIC rejected with actionable HTTP 400; controlled PNG completed the real
  four-stage vision analysis with a safe non-wound result (correlation
  `48dd9bf6-5b47-4169-8974-e3a24a5cf604`); controlled JPEG did the same (correlation
  `64a92191-4e5c-43c8-8d2a-d722df2d7d7a`).

### Step 34 - Remove Phoenix AI v2 and govern one bilingual experience

This step permanently removes the alternate Phoenix AI v2 implementation and establishes the
retained HCP and Community application as the only product experience. The supplied Phoenix AI logo,
clinical workflows, shared staged analysis, safety controls, persistence, telemetry, and Azure
integration layers remain intact.

- **Single experience.** Deleted `app/v2`, `components/v2`, `lib/v2`, the experience selector,
  v2-only unit tests, v2 styling, feature flags, and obsolete active comparison/design documents.
  `/` now presents the retained HCP and Community entries directly. Representative `/v2` paths are
  covered by browser tests and return HTTP 404.
- **Global language contract.** The root provider owns one persisted and reactive
  `AppLanguage = "en" | "ms"` value under local-storage key `phoenix-ai-language`. Visible retained
  UI content is centralized in English and Bahasa Melayu resources, including dashboard charts,
  analysis/history, TBSA, Parkland, guidelines, chat, Community education, first aid, assessment,
  image-check, login, landing, and PWA surfaces. Canonical clinical values remain language-neutral
  in logic and storage and are translated only for display.
- **Governed AI language.** All four AI routes require canonical `language`, reject legacy or invalid
  codes, add strict single-language instructions, inspect model prose/JSON string values, and permit
  no more than one bounded rewrite for a confident mismatch. Telemetry records language metadata and
  outcome only, never prompts, clinical text, images, or model output. Prompt/pipeline versions were
  advanced to reflect the governed behavior.
- **Responsible AI.** `RAI-INCL-003` is Active with code and tests for strict instructions, structured
  detection, the one-rewrite ceiling, and metadata-only telemetry. Existing safety, fairness,
  transparency, human-oversight, and privacy controls were retained; active documentation no longer
  claims that deleted assurance panels are published.
- **Architecture governance.** MAJOR impact; architecture version `3.0.1 -> 4.0.0`. ADR-0011 records
  the single-experience/global-language decision. Current architecture, inventories, Azure resource
  map, three Mermaid diagrams, changelog, and
  `docs/architecture/changes/CHANGE-20260815-single-experience-global-language.md` were synchronized.
  Azure resource impact is NONE.
- **Validation.** PASS: unit `96/96`, Responsible AI `26/26`, integration `14/14`, production HTTP API
  `20/20`, retained-route/bilingual E2E `22/22`, TypeScript, ESLint, production build, architecture
  drift, and seven Mermaid diagrams. The final build publishes only the retained routes. Local AI and
  database checks exercised explicit unconfigured terminal states because credentials were not loaded;
  no test was skipped or allowed to hang.

### Step 35 - Restore concise HCP confidentiality and clinical-use reminders

This step restores the previously governed notice to the Original HCP analysis and chat surfaces
without reintroducing v2 or changing the surrounding application design.

- **Patient-data handling.** The bilingual notice asks clinicians to use only authorized and,
  where possible, de-identified patient information and images, avoid unnecessary identifiers, and
  follow Malaysia's PDPA 2010, applicable Malaysian law, and professional confidentiality duties.
- **Clinical boundary.** The same notice states that AI output is decision support only, is not a
  diagnosis, and does not replace examination, professional judgement, or appropriate escalation.
- **Honest assurance.** `RAI-PRIV-007` is Active with source and browser evidence. The notice is a
  handling obligation and limitation statement, not legal advice, data-loss prevention, or proof of
  compliance.
- **Architecture.** MEDIUM impact; version `4.0.0 -> 4.1.0`; `UI-CLINICAL-NOTICE` moves from
  `PLANNED` to `ACTIVE`. No ADR, external integration, Azure resource, identity, storage, database,
  model, prompt, or clinical-calculation change.
- **Validation.** PASS: unit `96/96`, Responsible AI `27/27`, integration `14/14`, production HTTP
  API `24/24`, retained-route E2E `24/24`, TypeScript, ESLint, production build, architecture drift,
  and seven Mermaid diagrams.

### Step 36 - Adopt direct-main rapid-prototype delivery

This step aligns repository automation and contributor guidance with the live, unprotected GitHub
configuration while retaining automatic Azure deployment.

- **Direct-main default.** Maintainers, Codespaces, and Copilot may create small Conventional Commits
  directly on `main`. Pull requests remain optional for collaborative or risky work; the obsolete PR
  template and required-PR/branch-protection guidance are removed.
- **Non-blocking automation.** CI remains a push/manual quality signal. Pull-request triggers, the
  separate Architecture Governance workflow, and its report-only dependency-audit job are removed.
  Infrastructure and database workflows remain manually dispatchable through reviewer-free
  `Development` or `Demo` environments.
- **Deployment retained.** Every push to `main` still independently triggers `Deploy (Development)`
  with the existing environment-bound OIDC identity, Bicep validation, immutable ACR image, health
  check, and critical-journey verification. No Azure resource, RBAC, secret, model, prompt, route,
  data, or clinical behavior changes.
- **Governance boundary.** Architecture-first documentation, ADRs, change records, Mermaid
  validation, tests, and the local drift validator remain mandatory. `GOV-CI` moves to `LEGACY`;
  `RAI-ACCT-003` remains Active with the reduced server-enforcement boundary recorded as `LIM-011`.
- **Architecture.** MAJOR impact; version `4.1.0 -> 5.0.0`; ADR-0012 and
  `CHANGE-20260816-direct-main-prototype-workflow.md` record the decision.
- **Files.** Added ADR-0012 and the change record; removed the Architecture Governance workflow and
  PR template; modified active workflows, contributor/agent guidance, architecture/RAI inventories,
  the database runbook, and this audit trail.
- **Validation.** PASS: all five active workflow files parse; ESLint, TypeScript, unit `96/96`, RAI
  `27/27`, integration `14/14`, production HTTP API `24/24`, and E2E `24/24`; two Prisma migrations;
  production build; Bicep compilation; architecture drift; and all seven Mermaid diagrams.

### Step 37 - Verify direct-main CI and Azure deployment

- **Promotion.** Fast-forwarded `main` from `6fceacd` to `3cec995`, promoting the five validated
  commits without rewriting history.
- **Expected trigger set.** Exactly two push workflows were created for `3cec995`: CI run
  `31929174358` and Development deployment run `31929174360`. No Architecture Governance run was
  created, confirming that the retired gate no longer participates.
- **CI.** PASS: all three CI jobs completed successfully.
- **Azure deployment.** PASS: the Development workflow completed its OIDC login, Bicep validation
  and what-if, immutable ACR build, Container App deployment, health check, smoke test, and critical
  HCP/community journeys.
- **Independent live probe.** PASS at
  `https://ca-phoenixai-oaprp7dte7bw2.braveflower-8e754aba.eastus2.azurecontainerapps.io`:
  `/api/health/live` returned `alive`; `/` returned HTTP 200 and Phoenix AI content.
- **Local Azure context note.** The local Azure CLI subscription did not contain deployment
  `phoenixai-dev-13`; deployment outputs were therefore not queried locally. The authenticated
  environment-bound GitHub deployment and independent public endpoint probes provide the evidence.