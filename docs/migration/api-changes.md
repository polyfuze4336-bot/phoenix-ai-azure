# Part 14 — API Changes

> Route-level changes between the original source and the current codebase. Evidence:
> original route source (`git show abacus-source-baseline:...`), current route files, and live
> HTTP probes.

## 1. Original API surface (Abacus.AI source)

Four AI routes, each calling the Abacus endpoint inline with `ABACUSAI_API_KEY`:

| Route | Method | Role |
| --- | --- | --- |
| `/api/analyze-wound` | POST | HCP wound/burn image analysis |
| `/api/hcp-chat` | POST | HCP clinical chat |
| `/api/community-chat` | POST | Community chat |
| `/api/community-analyze` | POST | Community wound analysis |

No auth, health, or persistence routes existed.

## 2. AI routes — behaviour preserved, backend replaced

| Route | Change | Type |
| --- | --- | --- |
| `/api/analyze-wound` | Now calls `lib/ai` provider (Azure OpenAI, managed identity); prompt in `lib/ai/prompts/hcp-wound-analysis.ts`; Zod-validated | Modified |
| `/api/hcp-chat` | Provider swap; prompt in `lib/ai/prompts/hcp-chat.ts` | Modified |
| `/api/community-chat` | Provider swap; prompt in `lib/ai/prompts/community-chat.ts` | Modified |
| `/api/community-analyze` | Provider swap; prompt in `lib/ai/prompts/community-wound-analysis.ts`; Zod-validated | Modified |

**Contract preserved:** request body (`image`, `mimeType`, messages) and the streaming
structured-assessment response shape are unchanged. Only the backend endpoint and auth changed.

## 3. Added routes

### Authentication
| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/login` | POST | Demo credential verification (server-side) |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/auth/session` | GET | Current session state |
| `/api/auth/entra/login` | GET | Begin Entra OIDC sign-in (opt-in) |
| `/api/auth/entra/callback` | GET | Entra OIDC redirect handler (opt-in) |

### Health
| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Aggregate health |
| `/api/health/live` | GET | Liveness (process up) |
| `/api/health/ready` | GET | Readiness (runtime + AI + PostgreSQL + Blob) |
| `/api/health/db` | GET | Database-specific check |

### HCP analysis history (post-parity feature)
| Route | Method | Purpose |
| --- | --- | --- |
| `/api/hcp/analyses` | GET/POST | List / create persisted analyses |
| `/api/hcp/analyses/[id]` | GET | Fetch a single persisted analysis |

## 4. Middleware

`middleware.ts` (new) protects HCP routes and APIs, enforcing the session when auth is active.

## 5. Live verification (HTTP probes)

| Route | Status |
| --- | --- |
| `/` | 200 |
| `/hcp-login` | 200 |
| `/community` | 200 |
| `/hcp/history` | 200 |
| `/api/health/live` | 200 |
| `/api/health/ready` | 200 (all dependency checks `ok`) |

`/api/health/ready` body: `runtime=ok`, `azure-ai=ok (auth=identity)`, `postgresql=ok (3 ms)`,
`blob-storage=ok (container=clinical-uploads)`.

## 6. Summary

| Category | Count |
| --- | --- |
| Original AI routes (retained contract, new backend) | 4 |
| Added auth routes | 5 |
| Added health routes | 4 |
| Added HCP-history routes | 2 |
| New middleware | 1 |
