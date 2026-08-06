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

_Subsequent steps appended below as work proceeds._
