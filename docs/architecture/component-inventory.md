# Phoenix AI — Component Inventory

> Stable catalogue of architecture components. **Component IDs are stable** and must not be
> renamed across revisions (add new IDs; mark retired ones Deprecated). Keep this synchronized
> with [current-architecture.md](./current-architecture.md) and the diagrams.
>
> Status: `ACTIVE` (implemented & used) · `PARTIAL` (some paths) · `OPTIONAL` (configured, not
> wired to UI) · `DEMO` (mock) · `PLANNED` · `LEGACY`.

| Component ID | Component | Type | Technology | Location | Purpose | Dependencies | Status | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UI-LANDING | Landing / experience selector | UI | Next.js/React | `app/_components`, `app/page.tsx` | Public entry, brand; selects Original vs v2 experience (degrades to Original-only when v2 flag off) | APP-NEXT, LIB-V2 | ACTIVE | Phoenix AI team |
| UI-HCP | HCP portal | UI | Next.js/React | `app/hcp/*` | Clinician chat, analysis, TBSA, Parkland, guidelines, history | APP-NEXT, AUTH-DEMO, API-* | ACTIVE | Phoenix AI team |
| UI-COMMUNITY | Community portal | UI | Next.js/React | `app/community/*` | Public chat, assessment, articles, first-aid | APP-NEXT, API-* | ACTIVE | Phoenix AI team |
| UI-V2-HCP | Phoenix AI v2.0 HCP workspace | UI | Next.js/React | `app/v2/hcp/*` | Enhanced clinician experience (dashboard, cases, assessment, chat, calculators, guidelines, reports, insights); reuses existing API contracts | APP-NEXT, UI-V2-SHELL, LIB-V2, API-HCP-CHAT, API-HCP-ANALYSIS, CLINICAL-PARKLAND | ACTIVE | Phoenix AI team |
| UI-V2-COMMUNITY | Phoenix AI v2.0 community portal | UI | Next.js/React | `app/v2/community/*` | Enhanced public experience (home, self-assessment, chat, first-aid, education); reuses existing API contracts | APP-NEXT, UI-V2-SHELL, LIB-V2, API-COMMUNITY-CHAT | ACTIVE | Phoenix AI team |
| UI-V2-SHELL | v2 shell + shared components | UI | Next.js/React, Framer Motion | `components/v2/*`, `app/v2/layout.tsx` | App shell (nav rail, command palette, demo badge), stat/chart/case cards; flag-gated at layout | APP-NEXT, LIB-V2 | ACTIVE | Phoenix AI team |
| LIB-V2 | v2 foundation library | Lib | TypeScript | `lib/v2/*` | Feature flags, deterministic synthetic demo dataset, nav config, format helpers, guideline topics, first-aid parity content, version metadata | — | ACTIVE | Phoenix AI team |
| UI-PWA | PWA / mobile + i18n | UI | Next.js PWA, Tailwind | `components/pwa-*`, `components/language-*`, `lib/i18n.ts` | Installable app, EN/BM, responsive | APP-NEXT | ACTIVE | Phoenix AI team |
| APP-NEXT | Next.js server | App | Next.js 14 standalone | `next.config.js`, `app/` | SSR/API host | — | ACTIVE | Phoenix AI team |
| APP-MIDDLEWARE | Route-protection middleware | App | Next.js middleware | `middleware.ts` | Guard HCP routes/APIs | AUTH-SESSION | ACTIVE | Phoenix AI team |
| APP-INSTRUMENTATION | Startup instrumentation | App | Next.js instrumentation hook | `instrumentation.ts` | Env validation + telemetry init | CFG-ENV, OBS-APPINSIGHTS | ACTIVE | Phoenix AI team |
| API-HCP-CHAT | HCP chat route | API | Next.js route handler | `app/api/hcp-chat/route.ts` | HCP clinical chat | AI-PROVIDER, PROMPT-HCP-CHAT | ACTIVE | Phoenix AI team |
| API-HCP-ANALYSIS | HCP wound analysis route | API | Next.js route handler | `app/api/analyze-wound/route.ts` | Multimodal wound/burn assessment (staged pipeline default; single-pass fallback) with single-image and multi-image (`images[]`) inputs for overlap-aware TBSA synthesis | AI-ANALYSIS-PIPELINE, AI-MODEL-SELECTOR, AI-PROVIDER, AI-VALIDATION, PROMPT-HCP-ANALYSIS | ACTIVE | Phoenix AI team |
| API-COMMUNITY-CHAT | Community chat route | API | Next.js route handler | `app/api/community-chat/route.ts` | Public plain-language chat | AI-PROVIDER, PROMPT-COMMUNITY-CHAT | ACTIVE | Phoenix AI team |
| API-COMMUNITY-ANALYSIS | Community image-check route | API | Next.js route handler | `app/api/community-analyze/route.ts` | Simplified image guidance (REMOVED) | AI-PROVIDER, AI-VALIDATION, PROMPT-COMMUNITY-ANALYSIS | DEPRECATED | Phoenix AI team |
| API-AUTH-LOGIN | Demo login route | API | Next.js route handler | `app/api/auth/login/route.ts` | Server-verified demo login | AUTH-DEMO, AUTH-SESSION | ACTIVE | Phoenix AI team |
| API-AUTH-LOGOUT | Logout route | API | Next.js route handler | `app/api/auth/logout/route.ts` | Clear session | AUTH-SESSION | ACTIVE | Phoenix AI team |
| API-AUTH-SESSION | Session route | API | Next.js route handler | `app/api/auth/session/route.ts` | Current session state | AUTH-SESSION | ACTIVE | Phoenix AI team |
| API-AUTH-ENTRA-LOGIN | Entra login route | API | Next.js route handler | `app/api/auth/entra/login/route.ts` | Begin OIDC sign-in | AUTH-ENTRA | OPTIONAL | Phoenix AI team |
| API-AUTH-ENTRA-CALLBACK | Entra callback route | API | Next.js route handler | `app/api/auth/entra/callback/route.ts` | OIDC redirect handler | AUTH-ENTRA, AUTH-SESSION | OPTIONAL | Phoenix AI team |
| API-HCP-ANALYSES | HCP analyses list/create | API | Next.js route handler | `app/api/hcp/analyses/route.ts` | Persist/list AI analyses | DB-PRISMA, DB-ANALYSISRECORD | ACTIVE | Phoenix AI team |
| API-HCP-ANALYSES-ID | HCP analysis by id | API | Next.js route handler | `app/api/hcp/analyses/[id]/route.ts` | Fetch a persisted analysis | DB-PRISMA, DB-ANALYSISRECORD | ACTIVE | Phoenix AI team |
| API-HEALTH | Health aggregate | API | Next.js route handler | `app/api/health/route.ts` | Overall health | HEALTH-READINESS | ACTIVE | Phoenix AI team |
| API-HEALTH-LIVE | Liveness | API | Next.js route handler | `app/api/health/live/route.ts` | Process liveness | — | ACTIVE | Phoenix AI team |
| API-HEALTH-READY | Readiness | API | Next.js route handler | `app/api/health/ready/route.ts` | Runtime+AI+DB+Blob checks | HEALTH-READINESS, CFG-ENV | ACTIVE | Phoenix AI team |
| API-HEALTH-DB | DB health | API | Next.js route handler | `app/api/health/db/route.ts` | Database check | DB-PRISMA | ACTIVE | Phoenix AI team |
| AI-PROVIDER | AI provider abstraction | Lib | TypeScript | `lib/ai/ai-provider.ts`, `azure-foundry-provider.ts`, `openai-compatible.ts` | Backend-agnostic AI calls | AI-CREDENTIAL, AZ-FOUNDRY | ACTIVE | Phoenix AI team |
| AI-CREDENTIAL | AI credential | Lib | @azure/identity | `lib/ai/azure-credential.ts` | Managed-identity token | INFRA-MI | ACTIVE | Phoenix AI team |
| AI-STREAMING | AI streaming helpers | Lib | Web Streams/SSE | `lib/ai/streaming/*` | Stream responses | — | ACTIVE | Phoenix AI team |
| AI-VALIDATION | AI input/output validation | Lib | Zod | `lib/ai/validation/*` | Image + schema validation | — | ACTIVE | Phoenix AI team |
| AI-MODEL-SELECTOR | Purpose-specific model selection | Lib | TypeScript | `lib/ai/model-config.ts` | Split analysis/chat deployments + pipeline flags | — | ACTIVE | Phoenix AI team |
| AI-ANALYSIS-PIPELINE | Staged wound-analysis orchestrator | Lib | TypeScript | `lib/ai/analysis/pipeline.ts` | 4-stage analysis + deterministic safety calc | AI-PROVIDER, AI-ANALYSIS-SCHEMA, AI-MODEL-SELECTOR, CLINICAL-PARKLAND, CLINICAL-TBSA, PROMPT-ANALYSIS-STAGES | ACTIVE | Phoenix AI team |
| AI-ANALYSIS-SCHEMA | Rich analysis schema + adapter | Lib | Zod | `lib/ai/schemas/burn-wound-analysis.ts` | Observation/interpretation/confidence + flat back-compat map | — | ACTIVE | Phoenix AI team |
| AI-ANALYSIS-CRITIC | Consistency/safety critic stage | Lib | TypeScript | `lib/ai/prompts/wound-analysis-critic.ts` | Audits contradictions/false precision/overclaim | AI-ANALYSIS-PIPELINE | ACTIVE | Phoenix AI team |
| AI-ANALYSIS-EVAL | Analysis evaluation harness | Test | TypeScript/tsx | `tests/evaluation/burn-wound/*` | Structural/safety scoring (live optional) | AI-ANALYSIS-PIPELINE | ACTIVE | Phoenix AI team |
| AI-TELEMETRY | AI telemetry | Lib | App Insights | `lib/ai/telemetry.ts` | AI request telemetry | OBS-APPINSIGHTS | ACTIVE | Phoenix AI team |
| LIB-RAI | Responsible AI control register | Lib | TypeScript | `lib/rai/controls.ts`, `lib/rai/governance.ts` | Source-of-truth RAI control register (IDs, principle, status, evidence) + governance snapshot | AI-MODEL-SELECTOR | ACTIVE | Phoenix AI team |
| AI-PROMPT-VERSIONS | Prompt/pipeline/schema versions | Lib | TypeScript | `lib/ai/prompts/versions.ts` | Version constants for prompts, pipeline and schema | — | ACTIVE | Phoenix AI team |
| AI-ANALYSIS-METADATA | Analysis metadata envelope | Lib | TypeScript | `lib/ai/analysis/metadata.ts` | Non-sensitive analysis metadata (id, model, versions, image-quality band, review status) | AI-PROMPT-VERSIONS | ACTIVE | Phoenix AI team |
| UI-V2-AI-ASSURANCE | AI Assurance in-product surface | UI | Next.js/React | `app/v2/hcp/ai-assurance/*`, `components/v2/analysis-info-panel.tsx`, `components/v2/clinical-review-panel.tsx` | Renders the RAI control register (overview, controls, matrix, governance, limitations) + per-assessment assurance/review surfaces | LIB-RAI, AI-ANALYSIS-METADATA, UI-V2-SHELL | ACTIVE | Phoenix AI team |
| RAI-TESTS | Responsible AI test suite | Test | TypeScript/tsx | `tests/rai/*` | Asserts safety rules, prompt guardrails, metadata/versioning, privacy-safe telemetry, register integrity | LIB-RAI, AI-ANALYSIS-PIPELINE | ACTIVE | Phoenix AI team |
| PROMPT-HCP-CHAT | HCP chat prompt | Lib | TypeScript | `lib/ai/prompts/hcp-chat.ts` | Clinical chat prompt | — | ACTIVE | Phoenix AI team |
| PROMPT-HCP-ANALYSIS | HCP analysis prompt (single-pass fallback) | Lib | TypeScript | `lib/ai/prompts/hcp-wound-analysis.ts` | Structured clinical prompt (used when `AI_ANALYSIS_PIPELINE=single`) | — | ACTIVE | Phoenix AI team |
| PROMPT-ANALYSIS-STAGES | Staged analysis prompts | Lib | TypeScript | `lib/ai/prompts/{wound-visual-observation,wound-clinical-interpretation,wound-management,wound-analysis-critic}.ts` | Per-stage observation/interpretation/management/critic prompts | — | ACTIVE | Phoenix AI team |
| PROMPT-COMMUNITY-CHAT | Community chat prompt | Lib | TypeScript | `lib/ai/prompts/community-chat.ts` | Plain-language prompt | — | ACTIVE | Phoenix AI team |
| PROMPT-COMMUNITY-ANALYSIS | Community analysis prompt | Lib | TypeScript | `lib/ai/prompts/community-wound-analysis.ts` | Simplified guidance prompt | — | ACTIVE | Phoenix AI team |
| CLINICAL-TBSA | TBSA calculator | Lib | TypeScript | `lib/clinical/tbsa.ts` | Total body surface area | — | ACTIVE | Phoenix AI team |
| CLINICAL-PARKLAND | Parkland calculator | Lib | TypeScript | `lib/clinical/parkland.ts` | Fluid resuscitation formula | — | ACTIVE | Phoenix AI team |
| DB-PRISMA | Prisma data access | Lib | Prisma 6 | `lib/db.ts` | DB client | DB-POSTGRES | ACTIVE | Phoenix AI team |
| DB-POSTGRES | PostgreSQL database | Data | Azure PostgreSQL Flexible Server (default major version 17) | infra + `DATABASE_URL` | Relational store | INFRA-MI | ACTIVE | Phoenix AI team |
| DB-ANALYSISRECORD | Analysis history model | Data | Prisma model | `prisma/schema.prisma` | Persist HCP analyses | DB-PRISMA | ACTIVE | Phoenix AI team |
| DB-LEGACY-MODELS | Case/ChatMessage/Article | Data | Prisma models | `prisma/schema.prisma` | Retained-for-parity models | DB-PRISMA | OPTIONAL | Phoenix AI team |
| STORAGE-BLOB | Blob storage provider | Lib | @azure/storage-blob + identity | `lib/storage/*` | Private file storage | INFRA-MI, INFRA-STORAGE | OPTIONAL | Phoenix AI team |
| AUTH-DEMO | Demo auth provider | Lib | TypeScript | `lib/auth/demo-*.ts`, `auth-config.ts` | Fictional login (default) | AUTH-SESSION | DEMO | Phoenix AI team |
| AUTH-ENTRA | Entra ID provider | Lib | OIDC + jose | `lib/auth/entra-*.ts` | Opt-in SSO | AUTH-SESSION | OPTIONAL | Phoenix AI team |
| AUTH-SESSION | Session cookie | Lib | jose HS256 | `lib/auth/session.ts`, `current-session.ts` | Signed httpOnly session | — | ACTIVE | Phoenix AI team |
| ANALYSIS-HISTORY | Analysis history service | Lib | TypeScript | `lib/analysis/history.ts` | Read/write AnalysisRecord | DB-PRISMA | ACTIVE | Phoenix AI team |
| CFG-ENV | Runtime config/validation | Lib | TypeScript | `lib/config/environment.ts` | Feature gating + env validation | — | ACTIVE | Phoenix AI team |
| HEALTH-READINESS | Readiness checks | Lib | TypeScript | `lib/health/readiness.ts` | Dependency probes | AI-PROVIDER, DB-PRISMA, STORAGE-BLOB | ACTIVE | Phoenix AI team |
| OBS-APPINSIGHTS | App Insights telemetry | Lib/Infra | applicationinsights + web SDK | `lib/telemetry/*`, `components/telemetry-provider.tsx` | Privacy-safe telemetry | — | ACTIVE | Phoenix AI team |
| INFRA-APPSERVICE | Azure App Service | Infra | Bicep | `infra/modules/app-service.bicep` | Former web runtime | INFRA-PLAN, INFRA-MI | DEPRECATED | Phoenix AI team |
| INFRA-PLAN | App Service Plan | Infra | Bicep | `infra/modules/app-service-plan.bicep` | Former compute plan | — | DEPRECATED | Phoenix AI team |
| INFRA-CONTAINERAPP | Azure Container App | Infra | Bicep | `infra/modules/container-app.bicep` | Next.js standalone runtime, HTTPS ingress, probes, scaling | INFRA-ACA-ENV, INFRA-ACR, INFRA-MI | ACTIVE | Phoenix AI team |
| INFRA-ACA-ENV | Container Apps managed environment | Infra | Bicep | `infra/modules/container-app-environment.bicep` | Consumption environment + Log Analytics integration | INFRA-LAW | ACTIVE | Phoenix AI team |
| INFRA-ACR | Azure Container Registry | Infra | Bicep | `infra/modules/container-registry.bicep` | Private image storage and remote build | INFRA-MI | ACTIVE | Phoenix AI team |
| INFRA-MI | User-assigned managed identity | Infra | Bicep | `infra/modules/managed-identity.bicep` | Workload identity | — | ACTIVE | Phoenix AI team |
| INFRA-STORAGE | Storage account | Infra | Bicep | `infra/modules/storage.bicep` | Blob backing | — | ACTIVE | Phoenix AI team |
| INFRA-POSTGRES | PostgreSQL server | Infra | Bicep | `infra/modules/postgresql.bicep` | DB backing | — | ACTIVE | Phoenix AI team |
| INFRA-KV | Key Vault | Infra | Bicep | `infra/modules/key-vault.bicep` | Secret store | — | ACTIVE | Phoenix AI team |
| INFRA-APPINSIGHTS | Application Insights | Infra | Bicep | `infra/modules/application-insights.bicep` | Telemetry backing | INFRA-LAW | ACTIVE | Phoenix AI team |
| INFRA-LAW | Log Analytics | Infra | Bicep | `infra/modules/log-analytics.bicep` | Log store | — | ACTIVE | Phoenix AI team |
| INFRA-ALERTS | Alerts + action group | Infra | Bicep | `infra/modules/alerts.bicep` | 5xx + latency alerts | INFRA-APPINSIGHTS | ACTIVE | Phoenix AI team |
| INFRA-ROLES | Role assignments | Infra | Bicep | `infra/modules/role-assignments.bicep` | RBAC for MI | INFRA-MI | ACTIVE | Phoenix AI team |
| OPS-DEMO-OWNER-RBAC | Demo operator RBAC | Operations | Azure RBAC | `docs/architecture/changes/CHANGE-20260810-demo-rg-owner-access.md` | Grants `BFG Solutions` group Owner on the dedicated demo RG only | INT-DEMO-OPERATORS-ARM | ACTIVE | BFG Solutions subscription owner |
| OPS-GHA-OIDC-RBAC | GitHub deployment identity | Operations | Entra workload identity + Azure RBAC | `docs/architecture/changes/CHANGE-20260812-github-oidc-deployment-identity.md` | Secretless GitHub deployment using environment-bound OIDC; subscription deployment rights with RBAC delegation limited to the demo RG | DEVOPS-GHA, INT-GHA-AZURE | ACTIVE | BFG Solutions subscription owner |
| INFRA-FOUNDRY-CONN | Azure AI resource + connection | Infra | Bicep | `infra/modules/foundry-connection.bicep` | Provisions environment-owned AI account, gpt-4o deployment, and inference RBAC | INFRA-MI | ACTIVE | Phoenix AI team |
| AZ-FOUNDRY | Microsoft Foundry / Azure AI Services | Owned Azure | Azure AI Services | Environment-owned `gpt-4o` deployment | INFRA-MI | ACTIVE | Phoenix AI team |
| DEVOPS-GHA | GitHub Actions | DevOps | GitHub Actions + OIDC | `.github/workflows/*` | Reviewer-free rapid-prototype CI/CD through the dedicated `github-phoenixai-deploy` workload identity; Demo and Development auto-deploy on pushes to `main` and also support manual dispatch | OPS-GHA-OIDC-RBAC | ACTIVE | Phoenix AI team |
| INFRA-BICEP | Bicep IaC root | DevOps | Bicep | `infra/main.bicep`, `main.bicepparam` | Environment definition | INFRA-* modules | ACTIVE | Phoenix AI team |
| GOV-CI | Architecture governance CI | DevOps | GitHub Actions | `.github/workflows/architecture-governance.yml` | Enforce docs sync + Mermaid validation | — | ACTIVE | Phoenix AI team |
| GOV-VALIDATE | Architecture drift script | DevOps | Node/TypeScript | `nextjs_space/scripts/validate-architecture.mjs` | Lightweight drift detection | — | ACTIVE | Phoenix AI team |
