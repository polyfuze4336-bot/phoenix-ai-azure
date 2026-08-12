# Phoenix AI — Integration Inventory

> Catalogue of proven runtime and build-time integrations. **Integration IDs are stable.**
> Keep synchronized with [current-architecture.md](./current-architecture.md),
> [component-inventory.md](./component-inventory.md), and the diagrams.
>
> Status: `ACTIVE` (used at runtime) · `OPTIONAL` (configured, not exercised by a UI workflow) ·
> `BUILD` (build/deploy-time only).

| Integration ID | Source | Destination | Protocol | Purpose | Authentication | Data | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-BROWSER-APP | Browser (client) | Next.js server (`app/`) | HTTPS | Serve UI, submit chat/image requests (HCP analysis supports a bounded 1-5 image collection) | Signed session cookie (demo) | UI state, chat text, ephemeral base64 images | ACTIVE |
| INT-APP-FOUNDRY | Next.js AI provider (`lib/ai`) | Environment-owned Microsoft Foundry / Azure AI Services account | HTTPS (OpenAI-compatible) | Chat + multimodal wound analysis (staged pipeline issues multiple sequential completions and may include 1-5 HCP image parts; deployment resolved per-purpose via `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` / `AZURE_AI_CHAT_MODEL_DEPLOYMENT`, default `AZURE_AI_MODEL_DEPLOYMENT`) | Managed identity (Bearer, `cognitiveservices.azure.com`) | Prompts, bounded image collection, model completions | ACTIVE |
| INT-APP-POSTGRES | Next.js data layer (`lib/db.ts` / Prisma) | Azure PostgreSQL Flexible Server | PostgreSQL wire (TLS, `sslmode=require`) | Persist/read HCP AnalysisRecord | Direct `DATABASE_URL` credentials | Analysis records (fictional/demo) | ACTIVE |
| INT-APP-BLOB | Next.js storage provider (`lib/storage`) | Azure Blob Storage (`stphxyun55ezsi4yoq`, `clinical-uploads`) | HTTPS (Blob REST) | File persistence capability | Managed identity | (none in current UI) | OPTIONAL |
| INT-APP-KV | Azure Container App | Azure Key Vault (`kv-phx-<token>`) | HTTPS (Key Vault REST) | Resolve `DATABASE_URL` and optional Entra secrets through Container Apps secret references | Managed identity | Secret values exposed only as container environment variables | ACTIVE |
| INT-APP-APPINSIGHTS | Next.js telemetry (`lib/telemetry`, browser SDK) | Application Insights (`appi-phoenixai-yun55ezsi4yoq`) | HTTPS (ingestion) | Requests, events, traces, exceptions | Instrumentation/connection string | Privacy-safe telemetry (no clinical content) | ACTIVE |
| INT-APPINSIGHTS-LAW | Application Insights | Log Analytics (`log-phoenixai-yun55ezsi4yoq`) | Azure internal | Workspace-based log storage | Azure platform | Telemetry logs | ACTIVE |
| INT-ALERTS-APPINSIGHTS | Metric alerts / action group | Application Insights metrics | Azure Monitor | HTTP 5xx + response-time alerting | Azure platform | Metric thresholds | ACTIVE |
| INT-APP-ENTRA | Next.js Entra provider (`lib/auth/entra-*`) | Microsoft Entra ID | HTTPS (OIDC) | Opt-in SSO sign-in | OIDC client credentials | Tokens, claims | OPTIONAL |
| INT-GHA-AZURE | GitHub Actions / `github-phoenixai-deploy` service principal | Azure Resource Manager (`rg-phoenixai-bfgs-demo`; subscription scope only for explicit full-infrastructure runs) | HTTPS (ARM) | Default application-only Container App revision update; explicit full Bicep reconciliation for reviewed infrastructure changes | Environment-bound OIDC for reviewer-free `Demo` and `Development` rapid-prototype environments using immutable GitHub organization/repository IDs (`225331490` / `1324632738`); subscription `Contributor`; RBAC Administrator limited to the demo RG; no stored client secret | Immutable image reference or deployment templates | BUILD |
| INT-DEMO-OPERATORS-ARM | `BFG Solutions` Entra security group (3 current members) | Azure Resource Manager (`rg-phoenixai-bfgs-demo`) | HTTPS (ARM) | Full demo resource and RBAC administration | Entra group membership + built-in `Owner`, RG scope only | ARM control-plane operations; no application data-plane credential | ACTIVE |
| INT-GHA-APPSERVICE | GitHub Actions | Azure App Service | HTTPS (Kudu/zip deploy) | Former standalone bundle deployment | OIDC federation | Application bundle | DEPRECATED |
| INT-DEPLOY-ACR | GitHub Actions / deployment operator | Azure Container Registry | HTTPS (ACR Tasks) | Remote-build and store immutable `phoenixai:<git-sha>` images for both application-only and full-infrastructure deployments | OIDC federation or authenticated Azure CLI | Source context and OCI image | BUILD |
| INT-ACR-CONTAINERAPP | Azure Container App | Azure Container Registry | HTTPS (OCI pull) | Pull immutable Phoenix AI image revision | User-assigned managed identity (`AcrPull`) | OCI image layers | BUILD |
| INT-GHA-DBMIGRATE | GitHub Actions (`db-migrate.yml`) | Azure PostgreSQL | PostgreSQL wire (TLS) | Apply Prisma migrations | Deploy-time credentials | Schema migrations | BUILD |

> **Phoenix AI v2.0 (`/v2/*`) adds no new integrations.** The v2 experience reuses the existing
> API contracts and therefore the same runtime integrations — `INT-BROWSER-APP`, `INT-APP-FOUNDRY`
> (via `/api/analyze-wound`, `/api/hcp-chat`, `/api/community-analyze`, `/api/community-chat`), and
> `INT-APP-APPINSIGHTS`. v2 dashboards/insights render deterministic, clearly-labelled **synthetic**
> data (`lib/v2/demo-data.ts`); they do not query PostgreSQL or Blob. See
> [ADR-0004](./decisions/ADR-0004-dual-experience-v2.md).

> **AI Assurance layer adds no new integrations.** The Responsible AI surface
> (`/v2/hcp/ai-assurance`, `LIB-RAI`) reads local configuration and the in-code control register; the
> `/api/analyze-wound` response now carries a non-sensitive metadata envelope (`result.meta`:
> analysis id, model deployment name, prompt/pipeline/schema versions, image-quality band, review
> status) over the existing `INT-BROWSER-APP` channel. No clinical content, keys or prompts are added
> to any integration. See [ADR-0005](./decisions/ADR-0005-ai-assurance-layer.md).
