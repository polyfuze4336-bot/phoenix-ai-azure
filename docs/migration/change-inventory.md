# Part 2 — Change Inventory

> A single consolidated table of every meaningful change area from the original Abacus.AI
> source to the current Azure codebase, with an evidence-backed change type. Detailed
> per-item breakdowns live in the linked companion documents.

Change types: **Retained unchanged**, **Retained w/ config change**, **Modified**,
**Enhanced**, **Added**, **Replaced**, **Removed**, **Deferred**, **Partially implemented**.

## 1. AI / model backend

| Area | Original (Abacus.AI) | Current (Azure) | Change type |
| --- | --- | --- | --- |
| Chat/vision model call | Inline `fetch` to Abacus endpoint using `ABACUSAI_API_KEY` in each `app/api/*` route | Portable provider layer `lib/ai/*` → Azure OpenAI (Microsoft Foundry), managed identity by default | Replaced |
| System prompts | Inlined in each route file | Extracted to `lib/ai/prompts/*` | Modified |
| Request/response shape | Streaming, JSON assessment schema | Preserved shape; added Zod validation (`lib/ai/validation/*`) | Retained w/ config change |
| Auth to model | API key only | Managed identity (`DefaultAzureCredential`) default; key = explicit temporary fallback | Replaced |

## 2. Object storage

| Area | Original | Current | Change type |
| --- | --- | --- | --- |
| Storage helper | `lib/s3.ts`, `lib/aws-config.ts` (AWS S3; never wired to UI) | `lib/storage/*` (Azure Blob, managed identity, private container) | Replaced |
| AWS SDK packages | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | removed | Removed |
| UI file persistence | none (client-side base64 via `FileReader`) | none (parity preserved) | Retained unchanged |

## 3. Database

| Area | Original | Current | Change type |
| --- | --- | --- | --- |
| Prisma schema | `Case`, `ChatMessage`, `Article`; hardcoded `/home/ubuntu` output; arm64-musl binary target | + `AnalysisRecord`; portable output; `debian-openssl-3.0.x` target | Modified / Enhanced |
| Migrations | none tracked | `20260806120000_init`, `20260807090000_analysis_records` | Added |
| Runtime wiring | schema present, not wired to UI | provisioned + seeded; HCP history feature reads/writes `AnalysisRecord` | Partially implemented |

## 4. Authentication

| Area | Original | Current | Change type |
| --- | --- | --- | --- |
| HCP login | client-side mock (`sessionStorage`, hardcoded users) | `lib/auth/*` abstraction: demo provider (default) + optional Entra ID | Enhanced |
| Session | none server-side | signed httpOnly cookie (`jose`), middleware-protected HCP routes | Added |
| Enterprise SSO | none | Microsoft Entra ID (OIDC), opt-in via `AUTH_MODE=entra` | Added (opt-in) |

## 5. Observability

| Area | Original | Current | Change type |
| --- | --- | --- | --- |
| Telemetry | none | `lib/telemetry/*` + `instrumentation.ts` → Application Insights (privacy-safe) | Added |
| Health checks | none | `/api/health/{live,ready,db}` + `lib/health/readiness.ts` | Added |

## 6. Infrastructure & deployment

| Area | Original | Current | Change type |
| --- | --- | --- | --- |
| IaC | none | `infra/main.bicep` + 11 modules | Added |
| CI/CD | none | `.github/workflows/{ci,deploy-demo,deploy-dev,infrastructure,db-migrate}.yml` | Added |
| Runtime target | Abacus-hosted | Azure App Service (Linux, standalone Next.js) | Replaced |

## 7. Build & config

| Area | Original | Current | Change type |
| --- | --- | --- | --- |
| `next.config` | Abacus assumptions | standalone output, Azure hostname base URL | Modified |
| `tsconfig.json` | `@/*` paths only | + `baseLine`/portable settings for Linux build | Modified |
| ESLint | eslint 9 / next 15 config | eslint 8.57.1 / eslint-config-next 14.2.28 (aligned to Next 14) | Modified |
| `.env.example` | Abacus + AWS vars | Azure AI / Storage / Auth / Telemetry vars | Replaced |

## 8. Tests & docs

| Area | Original | Current | Change type |
| --- | --- | --- | --- |
| Automated tests | none | unit, integration, e2e, api, network, visual suites | Added |
| Migration docs | none | `docs/migration/*`, `docs/architecture/*`, `docs/testing/*`, `docs/security/*` | Added |

## 9. Branding & UX

| Area | Original | Current | Change type |
| --- | --- | --- | --- |
| Logo (`public/logo.png`) | canonical | byte-identical (blob `370601e`) | Retained unchanged |
| Colours, layout, terminology, journeys | original | preserved (141/143 pixel-identical) | Retained unchanged |
| New HCP history page | n/a | added post-parity feature (`/hcp/history`) | Added |

See [additions.md](additions.md), [modifications-and-enhancements.md](modifications-and-enhancements.md),
[replacements.md](replacements.md), [removals.md](removals.md),
[retained-functionality.md](retained-functionality.md) for the itemised detail behind each row.
