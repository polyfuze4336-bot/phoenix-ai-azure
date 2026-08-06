# Phoenix AI — Persistence Gap Assessment

**Step 12 — Decide the real persistence scope before adding infrastructure.**

This document is a read-only assessment. It inspects every current use of persistence-
and state-related mechanisms in the imported source, classifies where each feature's data
actually lives, checks whether the existing Prisma models match the current UI, and makes a
single recommendation. **No code was changed.**

## Method

Inspected every current use of: Prisma, `lib/db.ts`, the `Case` / `ChatMessage` / `Article`
models, the AWS S3 helpers (`lib/s3.ts`), the Azure Blob SDK (`@azure/storage-blob`), browser
state (React `useState`), `sessionStorage`, hard-coded arrays, simulated records, and local
static content. Scope was the application source only (`app/`, `components/`, `hooks/`, `lib/`,
`prisma/`, `scripts/`); `node_modules` was excluded.

## Headline finding

The application is, at runtime, a **stateless AI-augmented demo**. The **only live backend
dependency is the LLM** (the four `app/api/*` routes, now Azure OpenAI). There is:

- **No database read or write** anywhere in the UI. `lib/db.ts` (the Prisma client singleton)
  is **never imported** by any page, component, or API route.
- **No object storage.** `lib/s3.ts` and the `@aws-sdk/*` packages are **never imported** by
  app code; `@azure/storage-blob` does not appear in source at all.
- **No server-side session/auth store.** Auth is mock/client-side via `sessionStorage`.

The Prisma schema (`Case`, `ChatMessage`, `Article`) and the S3 helpers exist in the tree but
are **dormant scaffolding** — defined, never wired into the visible product.

## Per-feature data-source classification

Classification legend: **PostgreSQL** · **In-memory (server)** · **React state** ·
**sessionStorage** · **Hard-coded** · **Static content** · **AI-generated** · **Not implemented**.

### HCP portal

| Feature / route | Classification | Evidence (file · detail) |
| --- | --- | --- |
| Login (`/hcp-login`) | **Hard-coded** + **sessionStorage** | [app/hcp-login/page.tsx](../../nextjs_space/app/hcp-login/page.tsx#L12) — `MOCK_USERS` (doctor/nurse/admin); on success writes `sessionStorage.setItem('hcp_auth', …)` ([L37](../../nextjs_space/app/hcp-login/page.tsx#L37), [L53](../../nextjs_space/app/hcp-login/page.tsx#L53)) |
| Auth gate (HCP layout) | **sessionStorage** | [app/hcp/_components/hcp-layout-client.tsx](../../nextjs_space/app/hcp/_components/hcp-layout-client.tsx#L37) — reads `hcp_auth` from `sessionStorage`, `removeItem` on logout |
| Dashboard summary cards (`/hcp`) | **Hard-coded** | [app/hcp/_components/dashboard-client.tsx](../../nextjs_space/app/hcp/_components/dashboard-client.tsx#L42) — `summaryCards` literal: Total 1247, Burn 834, Wound 413, Critical 89, Avg TBSA 14% (animated counters, but the targets are constants) |
| Dashboard charts (`/hcp`) | **Hard-coded** | [app/hcp/_components/dashboard-charts.tsx](../../nextjs_space/app/hcp/_components/dashboard-charts.tsx#L20) — `byRegion` + `byMonth` constant arrays |
| Wound analysis (`/hcp/analysis`) | **React state** + **AI-generated** | [app/hcp/analysis/_components/analysis-client.tsx](../../nextjs_space/app/hcp/analysis/_components/analysis-client.tsx#L106) — image → `POST /api/analyze-wound`; result held in React state only, **not persisted** |
| Clinical guidelines (`/hcp/guidelines`) | **Hard-coded** | [app/hcp/guidelines/_components/guidelines-client.tsx](../../nextjs_space/app/hcp/guidelines/_components/guidelines-client.tsx#L14) — `guidelines` literal (6 entries) |
| TBSA calculator (`/hcp/tbsa`) | **React state** (pure client calc) | [app/hcp/tbsa/_components/tbsa-client.tsx](../../nextjs_space/app/hcp/tbsa/_components/tbsa-client.tsx#L10) — Lund & Browder constants; interactive selection computed client-side, not stored |
| Parkland/Brooke fluids (`/hcp/parkland`) | **React state** (pure client calc) | [app/hcp/parkland/_components/parkland-client.tsx](../../nextjs_space/app/hcp/parkland/_components/parkland-client.tsx#L8) — formula computed from inputs; result in state only |
| HCP chat (`/hcp/chat`) | **React state** + **AI-generated** | [app/hcp/chat/_components/hcp-chat-client.tsx](../../nextjs_space/app/hcp/chat/_components/hcp-chat-client.tsx#L27) — messages in React state; streamed from `POST /api/hcp-chat`; quick prompts hard-coded. **No history persisted** |

### Community portal

| Feature / route | Classification | Evidence (file · detail) |
| --- | --- | --- |
| Home (`/community`) | **Hard-coded** | [app/community/_components/community-home-client.tsx](../../nextjs_space/app/community/_components/community-home-client.tsx#L8) — `quickActions` + `healthTips` literals |
| Articles (`/community/articles`) | **Hard-coded** | [app/community/articles/_components/articles-client.tsx](../../nextjs_space/app/community/articles/_components/articles-client.tsx#L18) — `articles` literal (5 bilingual entries: `titleEn/titleBm/contentEn/contentBm`) |
| Self-assessment (`/community/assessment`) | **Hard-coded** + **React state** | [app/community/assessment/_components/assessment-client.tsx](../../nextjs_space/app/community/assessment/_components/assessment-client.tsx#L10) — `questions` literal; `getResult()` scores answers to a severity locally |
| First aid (`/community/first-aid`) | **Hard-coded** | [app/community/first-aid/_components/first-aid-client.tsx](../../nextjs_space/app/community/first-aid/_components/first-aid-client.tsx#L15) — `guides` literal (5 bilingual guides) |
| Image check (`/community/image-check`) | **React state** + **AI-generated** | [app/community/image-check/_components/image-check-client.tsx](../../nextjs_space/app/community/image-check/_components/image-check-client.tsx#L37) — base64 image → `POST /api/community-analyze`; result in state only, **not persisted** |
| Community chat (`/community/chat`) | **React state** + **AI-generated** | [app/community/chat/_components/community-chat-client.tsx](../../nextjs_space/app/community/chat/_components/community-chat-client.tsx#L16) — messages in React state; streamed from `POST /api/community-chat`. **No history persisted** |

### Landing / global

| Feature | Classification | Evidence |
| --- | --- | --- |
| Landing (`/`) | **Static content** | [app/_components/landing-client.tsx](../../nextjs_space/app/_components/landing-client.tsx) — portal cards + KKM-HKL endorsement; no external data |
| PWA install prompt | **sessionStorage** | [components/pwa-install-prompt.tsx](../../nextjs_space/components/pwa-install-prompt.tsx#L23) — `pwa-dismissed` flag |
| Language (EN/BM) | **React state** | `components/language-provider.tsx` — in-memory context; resets per load |

## Do the Prisma models match the current UI?

The schema at [prisma/schema.prisma](../../nextjs_space/prisma/schema.prisma) defines three models.
None is referenced by any UI, component, or API route (the only `prisma.` string in source is a
guard message in [scripts/safe-seed.ts](../../nextjs_space/scripts/safe-seed.ts#L17); no `seed.ts`
exists). Assessed against what the product actually shows:

| Model | Intended for | Match to current UI |
| --- | --- | --- |
| `Case` | Persisted wound/burn cases feeding dashboard analytics | **Partial / aspirational.** The analysis flow produces a comparable shape (caseType, burnDegree, severity, TBSA, characteristics, recommendations) but **never saves it**, and the dashboard reads hard-coded numbers — it does **not** aggregate `Case` rows. The model anticipates a workflow the UI does not perform. |
| `ChatMessage` | Persisted chat history (portal, role, content, sessionId) | **No match.** Both chats are ephemeral React state; there is no history list, no `sessionId` generation, and no read-back UI. |
| `Article` | Bilingual CMS-style articles | **Shape matches, wiring absent.** Fields mirror the hard-coded `articles` array (`titleEn/titleBm/contentEn/contentBm/category`), but the page renders the literal array; nothing reads `Article`. |

Conclusion: the models are a **plausible future data model, not a description of current
behaviour.** They were carried over from the source as scaffolding. Adopting them now would add
a database dependency to features that are presently, and intentionally, stateless.

## Object storage (S3 / Azure Blob)

- [lib/s3.ts](../../nextjs_space/lib/s3.ts) exposes `generatePresignedUploadUrl`, `getFileUrl`,
  `deleteFile` over `@aws-sdk/client-s3`. **No app code imports it.** Images in both analysis
  flows are read client-side (`FileReader` → base64) and sent inline to the LLM; the `imageKey`
  columns on `Case`/`ChatMessage` are never populated.
- `@azure/storage-blob` does **not** appear in application source.
- Therefore **no object-store persistence is required for parity.**

## Recommendation

**Option 1 — Preserve the current stateless demo behaviour.**

Rationale, in line with the migration prime directive ("preserve the original visible user
experience; this is a migration, not a redesign"):

- Every visible feature already works with zero database or object storage. Introducing
  PostgreSQL or Blob now would add infrastructure, secrets, and failure modes **without changing
  anything the user sees** — the opposite of a faithful parity migration.
- The dashboard numbers are deliberate demo constants; wiring them to a live `Case` table would
  **change the displayed values** (empty/zero on a fresh DB) and thus break visible parity.
- Persisting chat or analysis results is **not** a current behaviour and would introduce
  patient-identifiable / clinical data handling that the existing app does not do. That is
  explicitly out of scope ("do not invent a hospital clinical-record system; do not add
  patient-identifiable data unless required by the existing application").

### What this means concretely

- **Keep** `prisma/schema.prisma`, `lib/db.ts`, and `lib/s3.ts` in the tree as dormant
  scaffolding (do not delete — they are in-progress/optional future work), but **do not**
  provision a database or storage account for the parity deployment.
- **Do not** connect the models or extend the schema in this step.
- The only backend dependency to operate in production remains the Azure OpenAI endpoint used by
  the four `app/api/*` routes.

### If persistence is chosen later (explicitly, as a separate decision)

Should stakeholders later want real persistence, the **minimal** first increment that maps to an
already-visible workflow — and the only one worth considering before anything else — is:

- Persist completed **wound analyses** as `Case` rows and drive the dashboard aggregates from
  them (replacing the hard-coded numbers). This uses the existing `Case` model largely as-is.

`ChatMessage` history and an `Article` CMS are **not** currently visible workflows and should
**not** be built speculatively. Any such step would require a separate decision on data
retention, de-identification, and consent before storing anything derived from a patient image —
none of which the current application does.

> **Historical note.** The `Case`, `ChatMessage`, and `Article` models and the S3 helpers were
> inherited from the original Abacus.AI source, where they were likewise not wired into the UI.
> Their presence reflects an anticipated (never-shipped) persistence layer, not current behaviour.
