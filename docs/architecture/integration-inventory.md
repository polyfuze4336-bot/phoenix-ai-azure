# Phoenix AI — Integration Inventory

> Catalogue of proven runtime and build-time integrations. **Integration IDs are stable.**
> Keep synchronized with [current-architecture.md](./current-architecture.md),
> [component-inventory.md](./component-inventory.md), and the diagrams.
>
> Status: `ACTIVE` (used at runtime) · `OPTIONAL` (configured, not exercised by a UI workflow) ·
> `BUILD` (build/deploy-time only).

| Integration ID | Source | Destination | Protocol | Purpose | Authentication | Data | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-BROWSER-APP | Browser (client) | Next.js server (`app/`) | HTTPS | Serve UI, submit chat/image requests | Signed session cookie (demo) | UI state, chat text, ephemeral base64 images | ACTIVE |
| INT-APP-FOUNDRY | Next.js AI provider (`lib/ai`) | Microsoft Foundry / Azure OpenAI (`aif-yfjw6y`) | HTTPS (OpenAI-compatible) | Chat + multimodal wound analysis (staged pipeline issues multiple sequential completions per request; deployment resolved per-purpose via `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` / `AZURE_AI_CHAT_MODEL_DEPLOYMENT`, default `AZURE_AI_MODEL_DEPLOYMENT`) | Managed identity (Bearer, `cognitiveservices.azure.com`) | Prompts, image content, model completions | ACTIVE |
| INT-APP-POSTGRES | Next.js data layer (`lib/db.ts` / Prisma) | Azure PostgreSQL Flexible Server | PostgreSQL wire (TLS, `sslmode=require`) | Persist/read HCP AnalysisRecord | Direct `DATABASE_URL` credentials | Analysis records (fictional/demo) | ACTIVE |
| INT-APP-BLOB | Next.js storage provider (`lib/storage`) | Azure Blob Storage (`stphxyun55ezsi4yoq`, `clinical-uploads`) | HTTPS (Blob REST) | File persistence capability | Managed identity | (none in current UI) | OPTIONAL |
| INT-APP-KV | Azure App Service | Azure Key Vault (`kv-phx-yun55ezsi4yoq`) | HTTPS (Key Vault REST) | Secret retrieval (Entra secrets when enabled) | Managed identity | Secrets/refs | OPTIONAL |
| INT-APP-APPINSIGHTS | Next.js telemetry (`lib/telemetry`, browser SDK) | Application Insights (`appi-phoenixai-yun55ezsi4yoq`) | HTTPS (ingestion) | Requests, events, traces, exceptions | Instrumentation/connection string | Privacy-safe telemetry (no clinical content) | ACTIVE |
| INT-APPINSIGHTS-LAW | Application Insights | Log Analytics (`log-phoenixai-yun55ezsi4yoq`) | Azure internal | Workspace-based log storage | Azure platform | Telemetry logs | ACTIVE |
| INT-ALERTS-APPINSIGHTS | Metric alerts / action group | Application Insights metrics | Azure Monitor | HTTP 5xx + response-time alerting | Azure platform | Metric thresholds | ACTIVE |
| INT-APP-ENTRA | Next.js Entra provider (`lib/auth/entra-*`) | Microsoft Entra ID | HTTPS (OIDC) | Opt-in SSO sign-in | OIDC client credentials | Tokens, claims | OPTIONAL |
| INT-GHA-AZURE | GitHub Actions | Azure Resource Manager (`rg-phoenixai-demo`) | HTTPS (ARM) | Provision infra (Bicep) | OIDC federation (no stored secret) | Deployment templates | BUILD |
| INT-GHA-APPSERVICE | GitHub Actions | Azure App Service | HTTPS (Kudu/zip deploy) | Deploy standalone build | OIDC federation | Application bundle | BUILD |
| INT-GHA-DBMIGRATE | GitHub Actions (`db-migrate.yml`) | Azure PostgreSQL | PostgreSQL wire (TLS) | Apply Prisma migrations | Deploy-time credentials | Schema migrations | BUILD |
