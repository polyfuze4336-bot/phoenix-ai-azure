# Phoenix AI — Source Code Audit

> **Scope:** Complete audit of the imported Phoenix AI source (`nextjs_space/`) prior to any
> Azure migration changes. This is a **read-only assessment** — none of the issues identified
> here are fixed in this step. It records the detected architecture, every route, and all
> migration-relevant behaviours and risks.
>
> **Source of truth:** `nextjs_space/` (imported verbatim from the Abacus.AI archive).
> **Related docs:** [MIGRATION.md](MIGRATION.md) · [../architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) · [../testing/TEST-STRATEGY.md](../testing/TEST-STRATEGY.md)

---

## 1. Detected architecture (confirmed)

| Area | Detected | Evidence |
| --- | --- | --- |
| Framework | **Next.js 14.2.28** (App Router) | `package.json` → `next@14.2.28`; `app/` directory routing |
| UI library | **React 18.2.0** | `package.json` → `react@18.2.0`, `react-dom@18.2.0` |
| Language | **TypeScript 5.2.2** (`strict: true`) | `package.json`, `tsconfig.json` |
| Routing | **App Router** (server + client components) | `app/**/page.tsx`, `layout.tsx`, `route.ts` |
| Styling | **Tailwind CSS 3.3.3** + `tailwindcss-animate` | `tailwind.config.ts`, `postcss.config.js`, `app/globals.css` |
| Component kit | **shadcn/ui over Radix UI** (40+ primitives) | `components/ui/*`, `@radix-ui/*` deps, `components.json` |
| Animation | **Framer Motion 10.18.0** | `package.json`; used in `landing-client`, `hcp-login`, etc. |
| Icons | **lucide-react 0.446.0** | imported across client components |
| Data fetching lib | **@tanstack/react-query 5.0.0** (installed, **not used**) | dep present; no `useQuery`/`QueryClient` in app code |
| ORM | **Prisma 6.7.0** (`@prisma/client`) | `prisma/schema.prisma`, `lib/db.ts` |
| Datasource | **PostgreSQL** (`provider = "postgresql"`) | `prisma/schema.prisma` |
| AWS helper | **@aws-sdk/client-s3** + `s3-request-presigner` | `lib/s3.ts`, `lib/aws-config.ts` |
| Azure package | **@azure/storage-blob 12.x** (installed, **not implemented**) | `package.json` only |
| AI backend | **Abacus.AI OpenAI-compatible chat completions** | `app/api/*/route.ts` |
| PWA | **manifest + service worker** | `public/manifest.json`, `public/sw.js`, `components/pwa-*` |
| i18n | **English + Bahasa Malaysia** via React context | `lib/i18n.ts`, `components/language-provider.tsx` |
| Charts | **recharts 2.15.3**, plus chart.js / plotly.js (installed) | `app/hcp/_components/dashboard-charts.tsx` |
| Runtime | **Node.js 22** (see repo `.nvmrc`) | verified build; standalone-capable via `NEXT_OUTPUT_MODE` |

Other installed-but-unused state/util libraries: `zustand`, `jotai`, `swr`, `formik`, `yup`,
`maplibre-gl`, `react-select`, `react-datepicker`, `embla-carousel-react` — none referenced in
`app/` or `components/` application code. They are transitive scaffolding from the source
template and are **not** part of the running UX.

---

## 2. Framework versions

| Package | Version |
| --- | --- |
| next | 14.2.28 |
| react / react-dom | 18.2.0 |
| typescript | 5.2.2 |
| tailwindcss | 3.3.3 |
| prisma / @prisma/client | 6.7.0 |
| framer-motion | 10.18.0 |
| lucide-react | 0.446.0 |
| @tanstack/react-query | 5.0.0 |
| recharts | 2.15.3 |
| @azure/storage-blob | ^12.0.0 |
| @aws-sdk/client-s3 | ^3.0.0 |

## 3. Build scripts

From `package.json`:

| Script | Command | Notes |
| --- | --- | --- |
| `dev` | `next dev` | local development server (`http://localhost:3000`) |
| `build` | `next build` | production build; **type errors fail**, **ESLint ignored** |
| `start` | `next start` | serves the production build |
| `lint` | `next lint` | advisory only (not run by build) |
| `prisma.seed` | `tsx --require dotenv/config scripts/safe-seed.ts` | seed guard; not wired to UI |

`next.config.js` highlights:
- `output: process.env.NEXT_OUTPUT_MODE` — supports `standalone` output for containerised/App Service deploys.
- `distDir: process.env.NEXT_DIST_DIR || '.next'`.
- `eslint.ignoreDuringBuilds: true` — **known issue #10**.
- `typescript.ignoreBuildErrors: false` — types **are** enforced.
- `images: { unoptimized: true }` — **known issue #11**.
- `experimental.outputFileTracingRoot: path.join(__dirname, '../')`.

## 4. Runtime requirements

- **Node.js 22** (repo `.nvmrc`). Build verified on Node 22.
- `npm install --legacy-peer-deps` required (pre-existing peer conflict: `eslint@9` vs
  `@typescript-eslint/parser@7` needing `eslint@^8`). Dev-only; runtime unaffected.
- Only runtime environment variable required for full function: **`ABACUSAI_API_KEY`** (LLM).
  `NEXTAUTH_URL` is used solely for `metadataBase`.

---

## 5. Pages (routes)

All page/layout files were enumerated from `app/`. Pages are **server components** that
delegate rendering to co-located `_components/*-client.tsx` **client components**, except
`hcp-login` which is itself a client component.

### 5.1 Top-level
| Route | File | Type | Purpose |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` → `_components/landing-client.tsx` | Server → Client | Landing / portal chooser |
| `/hcp-login` | `app/hcp-login/page.tsx` | **Client** | HCP login (mock auth) |

### 5.2 HCP portal (`app/hcp/*`, guarded by `hcp-layout-client.tsx`)
| Route | File | Type | Purpose |
| --- | --- | --- | --- |
| `/hcp` | `app/hcp/page.tsx` → `_components/dashboard-client.tsx` | Server → Client | Dashboard + charts |
| `/hcp/analysis` | `app/hcp/analysis/page.tsx` → `analysis-client.tsx` | Server → Client | AI wound/burn image analysis |
| `/hcp/chat` | `app/hcp/chat/page.tsx` → `hcp-chat-client.tsx` | Server → Client | Specialist AI chat |
| `/hcp/guidelines` | `app/hcp/guidelines/page.tsx` → `guidelines-client.tsx` | Server → Client | Clinical guidelines (hardcoded) |
| `/hcp/parkland` | `app/hcp/parkland/page.tsx` → `parkland-client.tsx` | Server → Client | Parkland fluid calculator |
| `/hcp/tbsa` | `app/hcp/tbsa/page.tsx` → `tbsa-client.tsx` | Server → Client | TBSA (Rule of Nines) calculator |

### 5.3 Community portal (`app/community/*`, `community-layout-client.tsx`)
| Route | File | Type | Purpose |
| --- | --- | --- | --- |
| `/community` | `app/community/page.tsx` → `community-home-client.tsx` | Server → Client | Community home |
| `/community/articles` | `app/community/articles/page.tsx` → `articles-client.tsx` | Server → Client | Health articles (hardcoded) |
| `/community/assessment` | `app/community/assessment/page.tsx` → `assessment-client.tsx` | Server → Client | Burn severity self-assessment |
| `/community/chat` | `app/community/chat/page.tsx` → `community-chat-client.tsx` | Server → Client | Ask-an-expert AI chat |
| `/community/first-aid` | `app/community/first-aid/page.tsx` → `first-aid-client.tsx` | Server → Client | First-aid guides (hardcoded) |
| `/community/image-check` | `app/community/image-check/page.tsx` → `image-check-client.tsx` | Server → Client | Public AI image check |

Layouts: `app/layout.tsx` (root), `app/hcp/layout.tsx`, `app/community/layout.tsx`.

## 6. API routes

All are `export const dynamic = 'force-dynamic'`, `POST`, and stream responses (SSE / text).

| Route | File | Input | Output | LLM call |
| --- | --- | --- | --- | --- |
| `/api/analyze-wound` | `app/api/analyze-wound/route.ts` | `{ image, mimeType }` (base64) | SSE, JSON clinical assessment | `gpt-5.4-mini`, `response_format: json_object`, `max_tokens: 2000` |
| `/api/hcp-chat` | `app/api/hcp-chat/route.ts` | `{ messages[] }` (+ optional image) | streamed text | `gpt-5.4-mini`, `max_tokens: 3000` |
| `/api/community-chat` | `app/api/community-chat/route.ts` | `{ messages[] }` | streamed text | `gpt-5.4-mini` |
| `/api/community-analyze` | `app/api/community-analyze/route.ts` | `{ image, mimeType, lang }` | SSE, JSON simple advice | `gpt-5.4-mini`, `response_format: json_object`, `max_tokens: 1500` |

All four read `process.env.ABACUSAI_API_KEY` and `fetch('https://apps.abacus.ai/v1/chat/completions')`.
The API key stays server-side (never exposed to the browser) — the migration must preserve this.

## 7. Client vs server components

- **Server components:** every `page.tsx` except `hcp-login`, plus all three `layout.tsx`.
  They are thin wrappers with no data fetching (all data is static/mock).
- **Client components:** all `_components/*-client.tsx`, the `hcp-login` page, all
  `components/ui/*` interactive primitives, `language-provider`, `language-toggle`,
  `pwa-register`, `pwa-install-prompt`, `chunk-load-error-handler`, `theme-*`.
- Root layout wraps the tree in `LanguageProvider` and mounts `PwaInstallPrompt`,
  `PwaRegister`, `Toaster`, `ChunkLoadErrorHandler`.

## 8. State management

- **Local React state** (`useState`, `useCallback`, `useEffect`) throughout.
- **React Context** for language (`LanguageProvider`).
- **`sessionStorage`** for mock HCP auth (`hcp_auth`).
- `@tanstack/react-query`, `zustand`, `jotai`, `swr` are dependencies but **not used** in app code.
- No global store, no server state library in use.

## 9. Styling approach & design tokens

- Tailwind CSS with CSS-variable design tokens defined in `app/globals.css` (`:root`) and
  mapped in `tailwind.config.ts`. Dark mode is class-based (`darkMode: ['class']`).
- **Design tokens** (HSL):
  - `--primary: 0 100% 27%` → **`#8B0000`** (Phoenix dark red).
  - `--secondary: 37 92% 50%` (amber/orange), `--accent: 172 84% 33%` (teal).
  - `--destructive: 0 84% 60%`, `--background: 210 20% 98%`, `--foreground: 220 14% 16%`.
  - `--radius: 0.625rem` (10px) with sm/lg/full derivatives.
  - Spacing scale `--spacing-xs..3xl` (4–64px); shadows `--shadow-sm/md/lg`.
  - Motion durations `--duration-fast/normal/slow` (150/250/350ms).
  - Chart palette `--chart-1..5` (brand red, teal, amber, etc.).
- Brand utilities: `.phoenix-gradient`, `.phoenix-gradient-text`, `.hero-gradient`,
  `.safe-area-top/bottom`, standalone-mode tweaks.
- **Fonts** (`next/font/google`): DM Sans (`--font-sans`), Plus Jakarta Sans (`--font-display`),
  JetBrains Mono (`--font-mono`).
- `STYLE_GUIDE.md` in `nextjs_space/` documents the intended visual system.

## 10. Language support

- Two languages: **English (`en`)** and **Bahasa Malaysia (`bm`)**.
- `lib/i18n.ts` holds a flat `translations` dictionary + `t(key, lang)` helper.
- `components/language-provider.tsx` exposes `lang`, `setLang`, `t` via context; default `en`.
- Language is **in-memory only** (component state) — not persisted across reloads.
- Community AI (`community-analyze`) forwards `lang` to the model to localise responses.

## 11. Authentication behaviour

- **Mock, client-side only.** No backend auth, no session server, no NextAuth wiring
  (a `types/next-auth.d.ts` type stub exists but NextAuth is not configured).
- `app/hcp-login/page.tsx` holds **hardcoded `MOCK_USERS`** with plaintext passwords and a
  simulated delay; on match it writes `hcp_auth` to `sessionStorage` and routes to `/hcp`.
- `hcp-layout-client.tsx` reads `sessionStorage.hcp_auth`; if absent, redirects to
  `/hcp-login`. This is a **client-side guard only** (no server enforcement).
- Community portal has no auth.

## 12. Data persistence behaviour

- **No active persistence.** The running UI reads only static/hardcoded data:
  dashboard metrics/charts, guidelines, articles, first-aid guides, assessment questions,
  and quick-login users are all in-code arrays.
- Prisma client (`lib/db.ts`) and schema exist but are **not imported** by any page/route.
- No writes occur anywhere in the app; calculators (TBSA, Parkland) compute in-memory.

## 13. AI integration

- Single provider: **Abacus.AI** OpenAI-compatible chat completions, model `gpt-5.4-mini`,
  streaming enabled, vision (image_url) supported.
- Requests are proxied through Next.js API routes (server-side), keeping the key private.
- `analyze-wound` and `community-analyze` request strict JSON (`response_format: json_object`)
  and parse a defined schema; chat routes stream plain text.
- Migration target: **Azure OpenAI** vision deployment with identical request/response and
  streaming shape (see architecture doc).

## 14. Image handling

- Images are selected in the browser and read via **`FileReader.readAsDataURL`** to base64,
  then POSTed to the API routes. **No upload to any object store** occurs.
- `next.config.js` sets `images: { unoptimized: true }` — Next.js image optimisation disabled
  (**known issue #11**); `next/image` is still used for the logo and static assets.
- Sample images exist under `Uploads/` (reference only, not served by the app).

## 15. PWA support

- `public/manifest.json`: name "Phoenix AI — Burn & Wound Care", `theme_color #8B0000`,
  `display: standalone`, portrait, full icon set (72–512 + maskable), categories medical/health/education.
- `public/sw.js`: cache-first for GET static assets (`phoenix-ai-v1`), **bypasses `/api/*`**,
  `skipWaiting` + `clients.claim`.
- `components/pwa-register.tsx` registers the SW; `pwa-install-prompt.tsx` shows the A2HS prompt.
- Apple PWA meta + `apple-touch-icon` in `app/layout.tsx`.

## 16. External dependencies (runtime-relevant)

| Dependency | Role | Runtime-critical? |
| --- | --- | --- |
| Abacus.AI chat completions | LLM for analysis + chat | **Yes** — the only live backend dependency |
| Abacus-hosted script `apps.abacus.ai/chatllm/appllm-lib.js` | Injected in `app/layout.tsx` `<head>` | No (platform artifact; **known issue #3**) |
| Google Fonts (`next/font/google`) | DM Sans / Plus Jakarta / JetBrains Mono | Fetched at build time |
| PostgreSQL / Prisma | ORM + datasource | No (not wired to UI) |
| AWS S3 SDK | presigned upload/download helpers | No (not wired to UI) |
| @azure/storage-blob | Azure blob SDK | No (installed, not implemented) |

## 17. Environment variables

| Variable | Used by | Required for parity? |
| --- | --- | --- |
| `ABACUSAI_API_KEY` | all four API routes | **Yes** (→ becomes Azure OpenAI credentials) |
| `NEXTAUTH_URL` | `app/layout.tsx` `metadataBase` | Optional (defaults to `http://localhost:3000`) |
| `DATABASE_URL` | `prisma/schema.prisma` | No (Prisma unused at runtime) |
| `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_FOLDER_PREFIX` | `lib/s3.ts`, `lib/aws-config.ts` | No (S3 unused at runtime) |
| `NEXT_OUTPUT_MODE`, `NEXT_DIST_DIR` | `next.config.js` | Build-time only |

No `.env` is committed. `.env.example` documents these without values.

## 18. Hard-coded values

- **Mock users + plaintext passwords** in `app/hcp-login/page.tsx` (`doctor@phoenix.my` /
  `phoenix2026`, `nurse@phoenix.my` / `phoenix2026`, `admin@phoenix.my` / `admin123`).
- **LLM endpoint URL** `https://apps.abacus.ai/v1/chat/completions` in all four API routes.
- **Model name** `gpt-5.4-mini` in all four API routes.
- **Abacus script URL** in `app/layout.tsx`.
- **Prisma `output`** absolute path `/home/ubuntu/phoenix_ai/nextjs_space/node_modules/.prisma/client`
  (Abacus build-host path; **known issue #6**).
- **Dashboard/guidelines/articles/first-aid/assessment data** — large in-code arrays.
- **Chart colour array** in `dashboard-charts.tsx` (`#8B0000`, `#E67E22`, …).
- Emergency number `999`, clinical constants (Rule of Nines %, Parkland `4 × kg × TBSA`).

## 19. Mock / simulated functionality

- Login simulates latency (`setTimeout`) and validates against the in-code user list.
- HCP dashboard metrics and all charts are **static sample data** (not derived from cases).
- Guidelines, articles, first-aid guides, and assessment questions are hardcoded content.
- TBSA and Parkland calculators are **real client-side computations** (not mocked).
- The only non-mock backend interaction is the LLM call in the four API routes.

## 20. Incomplete / unwired functionality

- **Prisma/PostgreSQL** models (`Case`, `ChatMessage`, `Article`) defined but never queried.
- **AWS S3** helpers (`generatePresignedUploadUrl`, `getFileUrl`, `deleteFile`) never called.
- **@azure/storage-blob** installed with no implementation.
- **`scripts/safe-seed.ts`** seed guard present but no seed data / no DB usage.
- **NextAuth** type stub without an actual auth implementation.
- React Query / zustand / jotai / swr present but unused.

## 21. Security risks (recorded, not fixed)

| # | Risk | Location | Severity |
| --- | --- | --- | --- |
| S1 | Hardcoded credentials (plaintext passwords) | `app/hcp-login/page.tsx` | High |
| S2 | Auth is client-side only; guard bypassable, no server enforcement | `hcp-layout-client.tsx`, `sessionStorage` | High |
| S3 | Third-party script from `apps.abacus.ai` loaded in `<head>` | `app/layout.tsx` | Medium |
| S4 | `next@14.2.28` has a published security advisory | `package.json` | High (dependency) |
| S5 | `npm audit`: 25 vulns (1 critical, 21 high, mostly transitive/dev) | dependency tree | Mixed |
| S6 | ESLint ignored at build time — lint-detectable issues can ship | `next.config.js` | Low/Medium |
| S7 | API routes lack rate limiting / auth on the LLM proxy | `app/api/*` | Medium |
| S8 | Secret delivered via env var only (no Key Vault yet) | API routes | Addressed by Azure target |

## 22. Azure migration blockers & required changes

| # | Item | Impact | Planned resolution (later step) |
| --- | --- | --- | --- |
| B1 | LLM endpoint hardcoded to Abacus.AI + `ABACUSAI_API_KEY` | Core functionality | Repoint the four API routes to **Azure OpenAI** (vision, streaming), preserve request/response shape |
| B2 | Abacus-hosted `<script>` in `app/layout.tsx` | Platform coupling / privacy | Remove (platform artifact, not Phoenix AI UI) |
| B3 | Prisma `output` hardcoded Linux path | `prisma generate` fails off the Abacus host | Change to default `.prisma/client` **iff** persistence is enabled; otherwise leave dormant |
| B4 | Secrets via plain env var | Cloud secret hygiene | Source from **Azure Key Vault** / App settings via managed identity |
| B5 | Mock/client-side auth | Not production-grade | Preserve as-is for parity; document. (Real auth is out of migration scope unless requested) |
| B6 | `next@14.2.28` advisory + audit findings | Security | Dedicated dependency-hardening change before go-live |
| B7 | `images.unoptimized` + external Google Fonts | Perf/hosting nuance | Keep for parity; revisit only if it blocks the host |
| B8 | Standalone output not yet enabled | Deploy packaging | Set `NEXT_OUTPUT_MODE=standalone` for App Service / container deploy |

**None of the above are changed in this step.** They are the backlog for subsequent
migration steps, tracked here and in [MIGRATION.md](MIGRATION.md).

---

## 23. Explicit known-issue confirmation

The following items requested for explicit identification are **confirmed present**:

1. ✅ AI API routes depend on `ABACUSAI_API_KEY` — all four routes.
2. ✅ AI routes call `https://apps.abacus.ai/v1/chat/completions` — all four routes.
3. ✅ `app/layout.tsx` loads an Abacus-hosted script (`apps.abacus.ai/chatllm/appllm-lib.js`).
4. ✅ HCP login uses hardcoded users and passwords (`app/hcp-login/page.tsx`).
5. ✅ Authentication is stored in browser `sessionStorage` (`hcp_auth`).
6. ✅ Prisma `output` is an Abacus-specific absolute path (`/home/ubuntu/phoenix_ai/...`).
7. ✅ PostgreSQL is configured (schema + `DATABASE_URL`) but not actively used by the UI.
8. ✅ S3 helper modules exist (`lib/s3.ts`, `lib/aws-config.ts`) but are disconnected from workflows.
9. ✅ Azure Blob Storage SDK (`@azure/storage-blob`) is installed but not implemented.
10. ✅ Next.js build ignores ESLint errors (`eslint.ignoreDuringBuilds: true`).
11. ✅ Browser image optimisation is disabled (`images.unoptimized: true`).
12. ✅ Some workflows are simulated client-side (login, dashboard data, content lists).
