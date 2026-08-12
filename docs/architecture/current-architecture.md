# Phoenix AI — Current Architecture (AS-IS)

> **Authoritative AS-IS architecture document.** It describes the system exactly as
> implemented in the repository at the current HEAD. The current customer deployment target is
> `rg-phoenixai-bfgs-demo` in `eastus2`, with all workload resources including Azure AI owned by
> that environment. It is part of the source code
> and MUST remain synchronized with the implementation (see
> [ARCHITECTURE-FIRST CHANGE POLICY](../../.github/copilot-instructions.md)).
>
> Architecture version: see [ARCHITECTURE_VERSION](./ARCHITECTURE_VERSION) (currently `2.3.0`).
> Change history: [ARCHITECTURE_CHANGELOG.md](./ARCHITECTURE_CHANGELOG.md).

Status vocabulary used throughout:

| Marker | Meaning |
| --- | --- |
| **Implemented** / `ACTIVE` | Present in code and used at runtime |
| **Partially implemented** | Present and used for some paths only |
| **Configured but unused** / `OPTIONAL` | Present and wired to infrastructure, but no visible UI workflow uses it |
| **Mock/demo** / `DEMO` | Fictional/demonstration behaviour |
| **Planned** / `PLANNED` | Not implemented |
| **Deprecated** / `LEGACY` | Retained for parity, not a runtime dependency |

---

## 1. System overview

**Purpose.** Phoenix AI is a burn and wound-care assessment demonstration tool for Malaysian
healthcare contexts. It offers AI-assisted wound/burn image analysis and clinical chat for
healthcare professionals (HCP), and simplified guidance for the public (Community).

> This is a **demonstration parity migration with an operational foundation** — not a clinically
> validated or production-hardened system. See
> [tradeoffs-and-limitations.md](../migration/tradeoffs-and-limitations.md).

| Concern | Current state |
| --- | --- |
| Application runtime | Next.js 14 (App Router), React 18, TypeScript 5, standalone Node server (`node server.js`) — **Implemented** |
| Major portals | Experience selector landing, Original HCP + Community portals, and an additive **Phoenix AI v2.0** experience (`/v2/*`, feature-flag gated), PWA + EN/BM — **Implemented** |
| Hosting | Azure Container Apps Consumption, `eastus2`; image in Azure Container Registry Basic — **Implemented** |
| AI processing | Environment-owned Azure AI Services S0 account with `gpt-4o` via `lib/ai`, managed identity — **Implemented** |
| Data handling | Azure PostgreSQL Flexible Server via Prisma; used by HCP history; other screens render demo content — **Partially implemented** |
| Authentication | Server-verified **demo** login by default; Microsoft Entra ID **opt-in** placeholder — **Mock/demo + Optional** |
| Storage | Azure Blob provider present + infra provisioned; no UI workflow persists files — **Configured but unused** |
| Monitoring | Application Insights + Log Analytics + health probes + metric alerts — **Implemented** |
| Deployment | GitHub Actions + dedicated Entra workload identity (environment-bound OIDC); application changes default to an existing-resource ACR build + Container App revision update, while full Bicep reconciliation is explicit; Demo is manual-dispatch and reviewer-free for rapid prototyping — **Implemented** |

---

## 2. Current architecture diagram

The authoritative source is [diagrams/current-architecture.mmd](./diagrams/current-architecture.mmd).
It is embedded here and must be kept in sync with it.

```mermaid
flowchart TB
    Users["Users (Clinicians & Public)"]

    subgraph CLIENT["Client Experience"]
        Landing["Experience Selector Landing — ACTIVE"]
        HCP["Original HCP Portal: chat, analysis, TBSA, Parkland, guidelines, history — ACTIVE"]
        Community["Original Community Portal: chat, assessment, articles, first-aid — ACTIVE"]
        V2["Phoenix AI v2.0 Experience (/v2/*): HCP workspace + Community portal — ACTIVE (flag-gated)"]
        PWA["PWA / Mobile + EN/BM toggle — ACTIVE"]
    end

    subgraph APP["Phoenix AI Application (Next.js 14 App Router)"]
        Next["Next.js Server (standalone) — ACTIVE"]
        MW["middleware.ts route protection — ACTIVE"]
        API["API Routes (15) — ACTIVE"]
        Auth["Auth Layer: demo default — DEMO / Entra — OPTIONAL"]
        AIProvider["AI Provider Layer (lib/ai) — ACTIVE"]
        Data["Data Access Layer (lib/db, Prisma) — ACTIVE"]
        Storage["Storage Provider Layer (lib/storage) — OPTIONAL"]
        Telemetry["Telemetry Layer (lib/telemetry) — ACTIVE"]
    end

    subgraph AZURE["Microsoft Azure (rg-phoenixai-bfgs-demo, eastus2)"]
        ContainerApp["Azure Container Apps (Consumption) — ACTIVE"]
        ACR["Azure Container Registry (Basic) — ACTIVE"]
        Foundry["Environment-owned Azure AI Services gpt-4o — ACTIVE"]
        PostgreSQL["Azure Database for PostgreSQL Flexible Server — ACTIVE"]
        Blob["Azure Blob Storage (private clinical-uploads) — OPTIONAL"]
        KV["Azure Key Vault — ACTIVE"]
        MI["User-assigned Managed Identity — ACTIVE"]
        Insights["Application Insights — ACTIVE"]
        Logs["Log Analytics — ACTIVE"]
        Alerts["Metric Alerts + Action Group — ACTIVE"]
    end

    subgraph DEVOPS["Engineering"]
        GitHub["GitHub Repository — ACTIVE"]
        Actions["GitHub Actions (OIDC) — ACTIVE"]
        DeployIdentity["Entra deployment principal — ACTIVE"]
        Bicep["Bicep IaC (13 files) — ACTIVE"]
    end

    Users --> Landing
    Users --> HCP
    Users --> Community
    Users --> V2
    Users --> PWA

    Landing --> Next
    HCP --> Next
    Community --> Next
    V2 --> Next
    PWA --> Next

    Next --> MW
    MW --> API
    API --> Auth
    API --> AIProvider
    API --> Data
    API --> Storage
    Next --> Telemetry

    AIProvider -->|"managed identity"| Foundry
    Data -->|"sslmode=require"| PostgreSQL
    Storage -.->|"managed identity (not wired to UI)"| Blob
    Auth -.->|"AUTH_MODE=entra (opt-in)"| KV

    Next --> ContainerApp
    ACR -->|"managed-identity image pull"| ContainerApp
    ContainerApp --> Insights
    Telemetry --> Insights
    Insights --> Logs
    Alerts --> Insights
    KV -->|"Key Vault secret reference"| ContainerApp
    MI --> Foundry
    MI --> Blob

    GitHub --> Actions
    Actions -->|"Demo / Development OIDC"| DeployIdentity
    DeployIdentity -->|"subscription Contributor"| Bicep
    Actions -->|"OIDC / remote image build"| ACR
    Actions -->|"application-only revision update (default)"| ContainerApp
    Actions -->|"full Bicep reconciliation (explicit)"| Bicep
    Bicep --> ContainerApp
```

Companion diagrams:
[data flow](./diagrams/current-data-flow.mmd) ·
[deployment](./diagrams/current-deployment.mmd) ·
[AI architecture](./diagrams/current-ai-architecture.mmd).

---

## 3. Application layers

### 3.1 Experience Layer

| Element | Location | Status |
| --- | --- | --- |
| Experience selector landing (routes to Original portals or v2) | `app/page.tsx`, `app/_components/experience-selector-client.tsx` (degrades to `app/_components/landing-client.tsx` when v2 disabled) | Implemented |
| HCP portal (chat, analysis, TBSA, Parkland, guidelines, history) | `app/hcp/*` | Implemented |
| Community portal (chat, assessment, articles, first-aid) | `app/community/*` | Implemented |
| **Phoenix AI v2.0 experience** — additive, isolated, feature-flag gated; reuses the same API contracts and Azure services (ADR-0004) | `app/v2/*`, `components/v2/*`, `lib/v2/*` | Implemented |
| PWA install + service worker | `components/pwa-install-prompt.tsx`, `components/pwa-register.tsx`, `public/` | Implemented |
| English / Bahasa Malaysia | `components/language-provider.tsx`, `components/language-toggle.tsx`, `lib/i18n.ts` | Implemented |
| Responsive interface + theming | Tailwind + shadcn/ui, `components/theme-*` | Implemented |

### 3.2 Application Layer

| Element | Location | Status |
| --- | --- | --- |
| Next.js App Router | `app/` | Implemented |
| Server + client components | `app/**/_components/*`, layouts | Implemented |
| API routes (15) | `app/api/**/route.ts` | Implemented |
| Middleware (route protection) | `middleware.ts` | Implemented |
| Instrumentation hook (startup env validation) | `instrumentation.ts` | Implemented |
| Providers (language, theme, telemetry) | `components/*-provider.tsx` | Implemented |
| Hooks | `hooks/use-toast.ts` | Implemented |
| Shared types | `types/next-auth.d.ts`, `lib/types.ts` | Implemented |

### 3.3 AI Layer

| Element | Location | Status |
| --- | --- | --- |
| AI provider factory | `lib/ai/ai-provider.ts` → `getAiProvider()` returns `AzureFoundryProvider` (single provider; abstraction retained) | Implemented |
| Model endpoint | Environment-owned Azure AI Services, `gpt-4o` `2024-11-20` Global Standard, api-version `2024-10-21` | Implemented |
| Model selection (purpose-specific) | `lib/ai/model-config.ts` — `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` / `AZURE_AI_CHAT_MODEL_DEPLOYMENT` (default to `AZURE_AI_MODEL_DEPLOYMENT`) | Implemented |
| Credential | `lib/ai/azure-credential.ts` (`DefaultAzureCredential`, key fallback) | Implemented |
| OpenAI-compatible mapping | `lib/ai/openai-compatible.ts` | Implemented |
| System prompts (HCP vs Community) | `lib/ai/prompts/{hcp-chat,hcp-wound-analysis,community-chat,community-wound-analysis}.ts` | Implemented |
| Staged analysis prompts | `lib/ai/prompts/{wound-visual-observation,wound-clinical-interpretation,wound-management,wound-analysis-critic}.ts` | Implemented |
| Staged analysis pipeline | `lib/ai/analysis/pipeline.ts` (`runAnalysisPipeline`, `assembleAnalysis`) — default for `/api/analyze-wound`; flag `AI_ANALYSIS_PIPELINE=single` reverts | Implemented |
| Deterministic clinical calc | `lib/clinical/{parkland,tbsa}.ts` reused by the pipeline — no assumed patient weight | Implemented |
| Rich analysis schema + adapter | `lib/ai/schemas/burn-wound-analysis.ts` (observation vs interpretation, field confidence, gaps) + flat back-compat adapter | Implemented |
| Streaming | `lib/ai/streaming/{sse,collect,text-stream}.ts` | Implemented |
| Image analysis (multimodal) | `lib/ai/validation/image-input.ts` + vision model | Implemented |
| Structured response validation | `lib/ai/validation/wound-analysis-schema.ts` (Zod, 22-field contract) | Implemented |
| Analysis evaluation harness | `tests/evaluation/burn-wound/` (structural/safety; live optional) | Implemented (structure); live pending |
| AI telemetry | `lib/ai/telemetry.ts` | Implemented |

**Wound image analysis flow (`/api/analyze-wound`).** The default `staged` pipeline runs four
sequential model stages — visual observation → clinical interpretation + quantification →
management & referral → consistency/safety critic — then applies deterministic post-processing:
Parkland is computed in app code from a supplied weight (never an assumed 70 kg), Fitzpatrick is
reported only when the clinician supplies it (otherwise `unknown`), measurements are `unavailable`
without a visible scale reference, confidence is capped on poor-quality images, and special-site
burns are escalated. The rich result is mapped back to the existing 22-field contract (so the
client and SSE envelope are unchanged) and the full structure travels under `result.structured`
for the enhanced UI and the REFINE (second-pass) flow. Setting `AI_ANALYSIS_PIPELINE=single`
restores the original single-pass call.

### 3.4 Data Layer

| Element | Location | Status |
| --- | --- | --- |
| Prisma client | `lib/db.ts` (auto `sslmode=require`, pool defaults) | Implemented |
| PostgreSQL | Azure Database for PostgreSQL Flexible Server | Implemented (infra) |
| Models: `Case`, `ChatMessage`, `Article` | `prisma/schema.prisma` | Present, **not wired to UI** (parity demo content) |
| Model: `AnalysisRecord` | `prisma/schema.prisma` | Implemented — used by HCP history |
| Migrations + seed | `prisma/migrations/*`, `scripts/{seed,seed-data,safe-seed}.ts` | Implemented (fictional data) |
| Client-side state / session storage | React state; login uses server session cookie | Implemented |
| Static/demo content | in-app demo data, `lib/i18n.ts` | Implemented |

### 3.5 Storage Layer

| Element | Location | Status |
| --- | --- | --- |
| Azure Blob provider | `lib/storage/{azure-blob-provider,storage-provider,types}.ts` (managed identity, private container, SAS reads) | **Configured but unused** — no UI workflow persists files |
| Remaining S3 code | — | **None** (removed; see [removals.md](../migration/removals.md)) |
| Browser-based image handling | client-side `FileReader` → base64 to AI routes | Implemented |
| Temporary image processing | ephemeral base64 in request body | Implemented |

### 3.6 Identity Layer

| Element | Location | Status |
| --- | --- | --- |
| Demo authentication | `lib/auth/demo-provider.ts`, `demo-users.ts` (fictional users; default `AUTH_MODE=demo`) | Mock/demo |
| Session (signed httpOnly cookie) | `lib/auth/session.ts`, `current-session.ts` (`jose` HS256) | Implemented |
| Entra ID (OIDC) | `lib/auth/entra-*.ts`, `app/api/auth/entra/*` (opt-in `AUTH_MODE=entra`; placeholder in this release) | Optional |
| Roles (Doctor/Nurse/Administrator) | `lib/auth/*` role mapping | Implemented (used by demo; Entra role mapping opt-in) |
| Route protection | `middleware.ts` | Implemented |
| Azure demo operators | Entra security group `BFG Solutions` | `Owner` on `rg-phoenixai-bfgs-demo` only; 3 current members; operational assignment outside workload Bicep |
| GitHub deployment identity | Entra app/service principal `github-phoenixai-deploy` | OIDC only; subscription `Contributor`; `Role Based Access Control Administrator` on `rg-phoenixai-bfgs-demo` only |
| Workload RBAC | `infra/modules/role-assignments.bicep`, `container-registry.bicep` | Resource-scoped managed-identity roles; unchanged by operator access |

### 3.7 Observability Layer

| Element | Location | Status |
| --- | --- | --- |
| Application Insights (server + browser) | `lib/telemetry/{server,client,correlation}.ts`, `components/telemetry-provider.tsx`, `instrumentation.ts` | Implemented |
| Log Analytics | Azure (App Insights workspace-based) | Implemented |
| Health checks | `app/api/health/{route,live,ready,db}.ts`, `lib/health/readiness.ts` | Implemented |
| Metric alerts + action group | `infra/modules/alerts.bicep` | Implemented |
| Logging | privacy-safe (no clinical content) | Implemented |

### 3.8 Deployment Layer

| Element | Location | Status |
| --- | --- | --- |
| GitHub repository | remote `origin` | Implemented |
| GitHub Actions | `.github/workflows/{ci,deploy-demo,deploy-dev,infrastructure,db-migrate}.yml`; Demo/Development default to application-only ACR build + existing Container App revision update, with full Bicep reconciliation explicit | Implemented |
| OIDC federation | Entra app/service principal `github-phoenixai-deploy`; GitHub environments `Demo` and `Development` | Implemented; no client secret |
| Application-only rollout | Resolve existing `INFRA-ACR` / `INFRA-CONTAINERAPP`, build `phoenixai:<git-sha>` remotely, update the Container App image, then run health and journey gates | Implemented; default deployment mode; no infrastructure mutation |
| Bicep IaC | `infra/main.bicep`, `infra/main.bicepparam`, `infra/modules/*` | Implemented |
| Azure Container Apps | `ca-phoenixai-<environment-token>` (deployment output) | Implemented |
| Azure Container Registry remote build | `acrphx<environment-token>` / `phoenixai:<deployment-tag>` | Implemented |
| Revisions | Single active revision; readiness gates traffic | Implemented |

---

## 3.9 AI Assurance Layer

The Responsible AI controls that make AI-assisted assessment reliable, transparent and
human-supervised are surfaced as a first-class layer. The single source of truth is
`nextjs_space/lib/rai/controls.ts` (register of controls with stable IDs, principle, assurance layer,
status and code/test evidence). See the [AI assurance flow diagram](./diagrams/current-ai-assurance.mmd)
and [`docs/rai/`](../rai/README.md).

| Element | Location | Status |
| --- | --- | --- |
| RAI control register (source of truth) | `lib/rai/controls.ts` | Implemented |
| Governance snapshot | `lib/rai/governance.ts` (model deployment name, versions, identity, posture) | Implemented |
| Prompt / pipeline / schema versions | `lib/ai/prompts/versions.ts` | Implemented |
| Analysis metadata envelope | `lib/ai/analysis/metadata.ts` (analysis id, model, versions, image-quality band, review status) | Implemented |
| In-product AI Assurance page | `app/v2/hcp/ai-assurance/` (overview, controls, matrix, governance, limitations) | Implemented |
| Per-assessment assurance surfaces | `components/v2/analysis-info-panel.tsx`, `components/v2/clinical-review-panel.tsx` | Implemented |
| RAI test suite | `tests/rai/*` (`npm run test:rai`) | Implemented |
| Guideline-basis citations | curated general references (`RAI-TRANS-005`) | **Partial** (not version-pinned) |
| Quantitative fairness benchmark | — | **Not implemented** (non-inference guardrails only) |
| Formal WCAG accessibility audit | — | **Partial** (`RAI-INCL-002`) |

Controls are honestly graded **Active / Partial / Planned**; the app makes no claim of being "certified",
"approved", "bias free" or "100% safe". AI output is decision-support only and is reviewed by a clinician.

---

## 4. Source vs deployment

The source code contains capabilities that are **provisioned but not exercised by any visible
workflow** in the deployed demo:

| Capability | Source | Deployed behaviour |
| --- | --- | --- |
| Blob Storage | `lib/storage/*` present | Storage account provisioned; readiness reports `blob-storage=ok`, but **no UI persists files** |
| Entra ID auth | `lib/auth/entra-*` present | `AUTH_MODE=demo` in the demo → Entra path inactive |
| PostgreSQL persistence | full Prisma schema | Only `AnalysisRecord` (HCP history) is read/written; other models hold parity demo content |

Feature gating is driven by presence of environment variables, read centrally in
`lib/config/environment.ts` (AI essential; DB enabled iff `DATABASE_URL`; Blob enabled iff
`AZURE_STORAGE_ACCOUNT`/`_URL`). See [azure-resource-map.md](./azure-resource-map.md).

---

## 5. Cross-references

- Component inventory → [component-inventory.md](./component-inventory.md)
- Integration inventory → [integration-inventory.md](./integration-inventory.md)
- Azure resource map → [azure-resource-map.md](./azure-resource-map.md)
- AI assurance flow → [diagrams/current-ai-assurance.mmd](./diagrams/current-ai-assurance.mmd)
- Responsible AI controls & evidence → [../rai/README.md](../rai/README.md)
- Architecture decisions → [decisions/README.md](./decisions/README.md)
- Change records → [changes/](./changes/)
- Source-to-Azure migration report → [../migration/phoenix-ai-azure-migration-report.md](../migration/phoenix-ai-azure-migration-report.md)
