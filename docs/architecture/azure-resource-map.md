# Phoenix AI — Azure Resource Map

> Maps logical architecture components to deployed Azure services and their IaC modules.
> **No secrets, connection strings, keys, or credentials appear in this file.**
> Keep synchronized with [component-inventory.md](./component-inventory.md) and the Bicep under `infra/`.

## Environment

| Property | Value |
| --- | --- |
| Subscription | `ME-MngEnvMCAP682563-mkhalib-1` |
| Primary resource group | `rg-phoenixai-demo` |
| Region | `southeastasia` |
| Naming token | `yun55ezsi4yoq` |
| Live URL | https://app-phoenixai-yun55ezsi4yoq.azurewebsites.net |
| IaC root | [`infra/main.bicep`](../../infra/main.bicep) · [`infra/main.bicepparam`](../../infra/main.bicepparam) |

## Resource mapping (rg-phoenixai-demo)

| Logical Component | Azure Service | Resource Name | IaC Module | Application Component | Environment |
| --- | --- | --- | --- | --- | --- |
| Web runtime | App Service (Linux, P1v3) | `app-phoenixai-yun55ezsi4yoq` | `infra/modules/app-service.bicep` | APP-NEXT / INFRA-APPSERVICE | demo |
| Compute plan | App Service Plan | `plan-phoenixai-yun55ezsi4yoq` | `infra/modules/app-service-plan.bicep` | INFRA-PLAN | demo |
| Relational database | PostgreSQL Flexible Server | `psql-phoenixai-yun55ezsi4yoq` | `infra/modules/postgresql.bicep` | DB-POSTGRES | demo |
| File storage | Storage Account (Blob) | `stphxyun55ezsi4yoq` (container `clinical-uploads`) | `infra/modules/storage.bicep` | STORAGE-BLOB (OPTIONAL) | demo |
| Secret store | Key Vault | `kv-phx-yun55ezsi4yoq` | `infra/modules/key-vault.bicep` | INFRA-KV | demo |
| Workload identity | User-assigned Managed Identity | `id-phoenixai-yun55ezsi4yoq` | `infra/modules/managed-identity.bicep` | INFRA-MI | demo |
| Log store | Log Analytics Workspace | `log-phoenixai-yun55ezsi4yoq` | `infra/modules/log-analytics.bicep` | INFRA-LAW | demo |
| Telemetry | Application Insights | `appi-phoenixai-yun55ezsi4yoq` | `infra/modules/application-insights.bicep` | OBS-APPINSIGHTS | demo |
| Alerting | Metric Alert (HTTP 5xx) | `alert-phoenixai-http5xx` | `infra/modules/alerts.bicep` | INFRA-ALERTS | demo |
| Alerting | Metric Alert (response time) | `alert-phoenixai-response-time` | `infra/modules/alerts.bicep` | INFRA-ALERTS | demo |
| Alerting | Action Group | `ag-phoenixai-ops` | `infra/modules/alerts.bicep` | INFRA-ALERTS | demo |
| RBAC | Role assignments (MI → AOAI/Storage/KV) | (scoped assignments) | `infra/modules/role-assignments.bicep` | INFRA-ROLES | demo |

## External resource (consumed, not owned by this RG)

| Logical Component | Azure Service | Resource Name | Resource Group / Region | Application Component | Wiring |
| --- | --- | --- | --- | --- | --- |
| AI model | Microsoft Foundry / Azure OpenAI | `aif-yfjw6y` (deployments: `gpt-4o`, `text-embedding-3-small`; api `2024-10-21`) | `rg-aisgemini-dev` / `eastus2` | AZ-FOUNDRY | `infra/modules/foundry-connection.bicep` + managed identity |

## Notes

- **DATABASE_URL** is a direct App Service application setting (MCAPS forces Key Vault public
  network access `Disabled`), not a Key Vault reference. It is never reproduced in this document.
- Blob Storage is provisioned and reachable (readiness `blob-storage=ok`) but **no UI workflow
  persists files** — see [current-architecture.md §4](./current-architecture.md#4-source-vs-deployment).
- The application authenticates to Foundry and Storage using the **user-assigned managed
  identity** (`id-phoenixai-yun55ezsi4yoq`); no keys are stored in application settings.
