# Phoenix AI — Integration Inventory

> Catalogue of proven runtime and build-time integrations. **Integration IDs are stable.**
> Keep synchronized with [current-architecture.md](./current-architecture.md),
> [component-inventory.md](./component-inventory.md), and the diagrams.
>
> Status: `ACTIVE` (used at runtime) · `OPTIONAL` (configured, not exercised by a UI workflow) ·
> `BUILD` (build/deploy-time only).

| Integration ID | Source | Destination | Protocol | Purpose | Authentication | Data | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-BROWSER-APP | Browser (client) | Next.js server (`app/`) | HTTPS | Serve one Phoenix AI experience; submit all chat/image requests with validated `en`/`ms`; reject unsupported images and invalid language values explicitly | Signed session cookie (demo) | Persisted UI language, chat text, ephemeral JPEG/PNG/WebP/GIF base64 image payloads | ACTIVE |
| INT-APP-FOUNDRY | Next.js AI provider (`lib/ai`) | Environment-owned Microsoft Foundry / Azure AI Services account | HTTPS (OpenAI-compatible) | Chat + multimodal wound analysis under strict selected-language instructions; completed output is checked and retried once when predominantly wrong-language | Managed identity (Bearer, `cognitiveservices.azure.com`) | Prompts, language instruction, image content, model completions; telemetry records language codes only | ACTIVE |
| INT-APP-POSTGRES | Next.js data layer (`lib/db.ts` / Prisma) | Azure PostgreSQL Flexible Server | PostgreSQL wire (TLS, `sslmode=require`) | Persist/read HCP AnalysisRecord after server-verified Entra session authorization; unavailable in demo auth | Direct `DATABASE_URL` credentials | Authorized retained analysis records | ACTIVE |
| INT-APP-BLOB | Next.js storage provider (`lib/storage`) | Azure Blob Storage (`stphxyun55ezsi4yoq`, `clinical-uploads`) | HTTPS (Blob REST) | File persistence capability | Managed identity | (none in current UI) | OPTIONAL |
| INT-APP-KV | Azure Container App | Azure Key Vault (`kv-phx-<token>`) | HTTPS (Key Vault REST) | Resolve `DATABASE_URL` and optional Entra secrets through Container Apps secret references | Managed identity | Secret values exposed only as container environment variables | ACTIVE |
| INT-APP-APPINSIGHTS | Next.js telemetry (`lib/telemetry`, browser SDK) | Application Insights (`appi-phoenixai-yun55ezsi4yoq`) | HTTPS (ingestion) | Requests, events, traces, exceptions | Instrumentation/connection string | Privacy-safe telemetry (no clinical content) | ACTIVE |
| INT-APPINSIGHTS-LAW | Application Insights | Log Analytics (`log-phoenixai-yun55ezsi4yoq`) | Azure internal | Workspace-based log storage | Azure platform | Telemetry logs | ACTIVE |
| INT-ALERTS-APPINSIGHTS | Metric alerts / action group | Application Insights metrics | Azure Monitor | HTTP 5xx + response-time alerting | Azure platform | Metric thresholds | ACTIVE |
| INT-APP-ENTRA | Next.js Entra provider (`lib/auth/entra-*`) | Microsoft Entra ID | HTTPS (OIDC) | Opt-in SSO sign-in | OIDC client credentials | Tokens, claims | OPTIONAL |
| INT-GHA-AZURE | GitHub Actions / `github-phoenixai-deploy` service principal | Azure Resource Manager (subscription deployment targeting `rg-phoenixai-bfgs-demo`) | HTTPS (ARM) | Automatically deploy Development on direct `main` pushes; manually deploy Demo/infra | Environment-bound OIDC for reviewer-free `Demo` and `Development` rapid-prototype environments using immutable GitHub organization/repository IDs (`225331490` / `1324632738`); subscription `Contributor`; RBAC Administrator limited to the demo RG; no stored client secret | Deployment templates | BUILD |
| INT-DEMO-OPERATORS-ARM | `BFG Solutions` Entra security group (3 current members) | Azure Resource Manager (`rg-phoenixai-bfgs-demo`) | HTTPS (ARM) | Full demo resource and RBAC administration | Entra group membership + built-in `Owner`, RG scope only | ARM control-plane operations; no application data-plane credential | ACTIVE |
| INT-GHA-APPSERVICE | GitHub Actions | Azure App Service | HTTPS (Kudu/zip deploy) | Former standalone bundle deployment | OIDC federation | Application bundle | DEPRECATED |
| INT-DEPLOY-ACR | GitHub Actions / deployment operator | Azure Container Registry | HTTPS (ACR Tasks) | Remote-build and store the Phoenix AI container image | OIDC federation or authenticated Azure CLI | Source context and OCI image | BUILD |
| INT-ACR-CONTAINERAPP | Azure Container App | Azure Container Registry | HTTPS (OCI pull) | Pull immutable Phoenix AI image revision | User-assigned managed identity (`AcrPull`) | OCI image layers | BUILD |
| INT-GHA-DBMIGRATE | GitHub Actions (`db-migrate.yml`) | Azure PostgreSQL | PostgreSQL wire (TLS) | Apply Prisma migrations | Deploy-time credentials | Schema migrations | BUILD |

> **Single-experience cleanup adds no integration.** Removed alternate routes used the same
> contracts; global language state and bounded output correction remain within
> `INT-BROWSER-APP` and `INT-APP-FOUNDRY`.

> **Vision input validation sends no new data and adds no integration.** Data URLs are normalized to
> bare base64 and checked against the declared model-compatible MIME type before
> `INT-APP-FOUNDRY`; rejected HEIC/HEIF, malformed, or mismatched payloads never reach Azure AI.

> **AI Assurance controls add no new integrations.** The code register and documentation read local
> configuration; the
> `/api/analyze-wound` response now carries a non-sensitive metadata envelope (`result.meta`:
> analysis id, model deployment name, prompt/pipeline/schema versions, image-quality band, review
> status) over the existing `INT-BROWSER-APP` channel. No clinical content, keys or prompts are added
> to any integration. See [ADR-0005](./decisions/ADR-0005-ai-assurance-layer.md).

> **The application-wide bilingual output contract adds no new integrations.** Language remains a
> two-value request preference on `INT-BROWSER-APP`; output validation uses the existing
> `INT-APP-FOUNDRY` channel. Azure resource and data-flow boundaries are unchanged.

> **The HCP clinical notice adds no integration or data flow.** It is static bilingual content on
> the existing `INT-BROWSER-APP` surface and sends, stores, or logs no patient information.
