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

_Subsequent steps appended below as work proceeds._
