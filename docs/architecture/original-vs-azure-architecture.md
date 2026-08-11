# Part 9 — Original vs Azure Architecture

> Side-by-side architecture of Phoenix AI before (Abacus.AI) and after (Azure), with two Mermaid
> diagrams and a component mapping. Evidence: source code layout, `infra/` Bicep, and the live
> `az resource list` for `rg-phoenixai-demo`.

## 1. Original architecture (Abacus.AI source)

```mermaid
flowchart TD
    U["Browser (Community / HCP users)"] --> APP["Next.js 14 app (Abacus.AI hosted)"]
    APP -->|"client-side mock login (sessionStorage)"| APP
    APP --> API["app/api/* route handlers"]
    API -->|"fetch + ABACUSAI_API_KEY"| ABACUS["Abacus.AI model endpoint (vision LLM)"]
    APP -. "images read client-side (FileReader, base64)" .-> API
    subgraph latent["Present in source but NOT wired to UI"]
        S3["lib/s3.ts + aws-config.ts (AWS S3)"]
        DB0["Prisma schema (Case/ChatMessage/Article)"]
    end
    API -. unused .-> S3
    API -. unused .-> DB0
```

Characteristics:
- Single hosted Next.js app; AI via static API key.
- Mock client-side auth; no server session.
- S3 and Prisma present but **not** used by the visible app.
- No telemetry, health checks, IaC, or automated tests.

## 2. Azure architecture (current)

```mermaid
flowchart TD
    U["Browser (Community / HCP users)"] --> APPSVC["Azure App Service (Linux, P1v3)\napp-phoenixai-yun55ezsi4yoq"]
    APPSVC --> MW["middleware.ts (HCP route protection)"]
    APPSVC --> API["app/api/* route handlers"]
    API --> AILIB["lib/ai provider layer"]
    AILIB -->|"managed identity (DefaultAzureCredential)"| FOUNDRY["Azure OpenAI / Foundry aif-yfjw6y\ngpt-4o + text-embedding-3-small"]
    API --> AUTH["lib/auth (demo default / Entra opt-in)"]
    AUTH -. "AUTH_MODE=entra" .-> ENTRA["Microsoft Entra ID (OIDC)"]
    API --> DB["Azure Database for PostgreSQL Flexible Server\npsql-phoenixai-yun55ezsi4yoq"]
    API --> BLOB["Azure Blob Storage (private)\nstphxyun55ezsi4yoq / clinical-uploads"]
    APPSVC --> AI2["Application Insights\nappi-phoenixai-yun55ezsi4yoq"]
    AI2 --> LOG["Log Analytics\nlog-phoenixai-yun55ezsi4yoq"]
    ALERTS["Metric alerts (http5xx, response-time)\n-> ag-phoenixai-ops"] --> AI2
    MI["User-assigned MI id-phoenixai-yun55ezsi4yoq"] -. auth .-> FOUNDRY
    MI -. auth .-> BLOB
    KV["Key Vault kv-phx-yun55ezsi4yoq"] -. secrets .-> APPSVC
```

Characteristics:
- App Service host; AI via managed identity to Azure OpenAI/Foundry.
- Server-verified session + optional Entra ID; HCP routes protected by middleware.
- Managed PostgreSQL + private Blob Storage available; telemetry, health probes, alerts.
- Full Bicep IaC and GitHub OIDC CI/CD.

## 3. Component mapping

| Concern | Original | Azure |
| --- | --- | --- |
| Host | Abacus.AI platform | Azure App Service (`plan-phoenixai-yun55ezsi4yoq`, P1v3) |
| AI model | Abacus endpoint + API key | Azure OpenAI/Foundry `aif-yfjw6y` + managed identity |
| AI integration | inline in routes | `lib/ai/*` provider layer |
| Object storage | AWS S3 (latent) | Azure Blob `stphxyun55ezsi4yoq` (latent, managed identity) |
| Database | Prisma (latent) | Azure PostgreSQL `psql-phoenixai-yun55ezsi4yoq` (partially wired) |
| Auth | client mock | demo (default) / Entra ID (opt-in) + signed session |
| Secrets | env / platform | App Service settings + Key Vault `kv-phx-yun55ezsi4yoq` |
| Identity | static keys | UAMI `id-phoenixai-yun55ezsi4yoq` |
| Observability | none | App Insights + Log Analytics + alerts + action group |
| IaC / CI/CD | none | Bicep (`infra/`) + GitHub OIDC workflows |
| Tests | none | unit/integration/e2e/api/network/visual |

## 4. Live resource inventory (evidence: `az resource list -g rg-phoenixai-demo`)

App Service, App Service Plan, PostgreSQL Flexible Server, Storage account (+ smart-detector
storage), Key Vault, user-assigned managed identity, Log Analytics workspace, Application
Insights, two metric alerts, one action group — **12 resources**, region `southeastasia`.

## 5. Region note

The environment runs in `southeastasia` rather than `eastus2` because the MCAPS sandbox's
region-specific quota blocked the original region. The Foundry AI resource remains in `eastus2`
(`rg-aisgemini-dev`). See [deployment-and-operations-changes.md](../migration/deployment-and-operations-changes.md).
