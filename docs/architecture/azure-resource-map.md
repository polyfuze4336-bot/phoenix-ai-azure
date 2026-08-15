# Phoenix AI — Azure Resource Map

> Maps logical architecture components to deployed Azure services and their IaC modules.
> **No secrets, connection strings, keys, or credentials appear in this file.**
> Keep synchronized with [component-inventory.md](./component-inventory.md) and the Bicep under `infra/`.
>
> **The single-experience application changes no Azure resources.** It uses the existing Container
> App, ACR, Azure AI, PostgreSQL, Application Insights, Key Vault, and Managed Identity resources.
> The `3.0.1` vision-input safe-failure correction is application-only and likewise changes no Azure
> resource, SKU, network path, identity, secret, model deployment, or region.
> The `4.0.0` single-experience and global-language change is also application-only. Removing retired
> source and adding bounded output-language validation changes no Azure resource or deployment SKU.

## Environment

| Property | Value |
| --- | --- |
| Subscription | `BFG Solutions-JDNAINexus` (`376a2984-f8d4-46e3-a1cb-90f58274d2dc`) |
| Primary resource group | `rg-phoenixai-bfgs-demo` |
| Region | `eastus2` |
| Naming token | Deterministic `uniqueString(subscription().id, resourceGroupName)` deployment output |
| Live URL | `https://ca-phoenixai-<token>.<container-apps-domain>` (resolved after deployment) |
| IaC root | [`infra/main.bicep`](../../infra/main.bicep) · [`infra/main.bicepparam`](../../infra/main.bicepparam) |

## Resource mapping (rg-phoenixai-bfgs-demo)

| Logical Component | Azure Service | Resource Name | IaC Module | Application Component | Environment |
| --- | --- | --- | --- | --- | --- |
| Web runtime | Azure Container Apps Consumption | `ca-phoenixai-<token>` | `infra/modules/container-app.bicep` | APP-NEXT / INFRA-CONTAINERAPP | bfgs-demo |
| Runtime environment | Container Apps managed environment | `cae-phoenixai-<token>` | `infra/modules/container-app-environment.bicep` | INFRA-ACA-ENV | bfgs-demo |
| Image registry | Azure Container Registry Basic | `acrphx<token>` | `infra/modules/container-registry.bicep` | INFRA-ACR | bfgs-demo |
| Retired web runtime source | Not deployed | — | `infra/modules/app-service.bicep` | INFRA-APPSERVICE (DEPRECATED) | none |
| Retired compute-plan source | Not deployed | — | `infra/modules/app-service-plan.bicep` | INFRA-PLAN (DEPRECATED) | none |
| AI model | Azure AI Services S0 | `aif-phoenixai-<token>` (`gpt-4o` 2024-11-20 GlobalStandard) | `infra/modules/foundry-connection.bicep` | AZ-FOUNDRY | bfgs-demo |
| Relational database | PostgreSQL Flexible Server | `psql-phoenixai-<token>` | `infra/modules/postgresql.bicep` | DB-POSTGRES | bfgs-demo |
| File storage | Storage Account (Blob) | `stphx<token>` (container `clinical-uploads`) | `infra/modules/storage.bicep` | STORAGE-BLOB (OPTIONAL) | bfgs-demo |
| Secret store | Key Vault | `kv-phx-<token>` | `infra/modules/key-vault.bicep` | INFRA-KV | bfgs-demo |
| Workload identity | User-assigned Managed Identity | `id-phoenixai-<token>` | `infra/modules/managed-identity.bicep` | INFRA-MI | bfgs-demo |
| Log store | Log Analytics Workspace | `log-phoenixai-<token>` | `infra/modules/log-analytics.bicep` | INFRA-LAW | bfgs-demo |
| Telemetry | Application Insights | `appi-phoenixai-<token>` | `infra/modules/application-insights.bicep` | OBS-APPINSIGHTS | bfgs-demo |
| Alerting | Metric Alert (failed requests) | `alert-phoenixai-failed-requests` | `infra/modules/alerts.bicep` | INFRA-ALERTS | demo |
| Alerting | Metric Alert (response time) | `alert-phoenixai-response-time` | `infra/modules/alerts.bicep` | INFRA-ALERTS | demo |
| Alerting | Action Group | `ag-phoenixai-ops` | `infra/modules/alerts.bicep` | INFRA-ALERTS | demo |
| RBAC | Role assignments (MI → AI/ACR/Storage/KV) | (scoped assignments) | `infra/modules/role-assignments.bicep`, `container-registry.bicep` | INFRA-ROLES | demo |
| Operator RBAC | Azure role assignment (`BFG Solutions` → `Owner`) | Scope: `rg-phoenixai-bfgs-demo` | Operational assignment; `CHANGE-20260810-demo-rg-owner-access.md` | OPS-DEMO-OWNER-RBAC | bfgs-demo |
| Deployment identity | Entra app/service principal + federated credentials | `github-phoenixai-deploy`; GitHub environments `Demo` and `Development` | Operational assignment; `CHANGE-20260812-github-oidc-deployment-identity.md` | OPS-GHA-OIDC-RBAC / DEVOPS-GHA | bfgs-demo |

## Notes

- **DATABASE_URL** is stored in Key Vault and consumed through a Container Apps Key Vault-backed secret.
  It is never reproduced in this document.
- Blob Storage is provisioned and reachable (readiness `blob-storage=ok`) but **no UI workflow
  persists files** — see [current-architecture.md §4](./current-architecture.md#4-source-vs-deployment).
- The application authenticates to Azure AI and Storage using the **user-assigned managed
  identity** (`id-phoenixai-<token>`); no keys are stored in application settings.
- The `BFG Solutions` security group has `Owner` only on the dedicated demo resource group. This
  covers its three current members, not all 42 tenant users, and does not elevate the group at
  subscription scope.
- GitHub Actions uses a dedicated OIDC workload identity rather than a human account. Its
  subscription `Contributor` role supports the subscription-scoped Bicep deployment; its ability
  to create role assignments is limited to `rg-phoenixai-bfgs-demo`.
- The `Demo` and `Development` GitHub environments intentionally have no required reviewers or
  protection rules for rapid prototyping. Demo deployment still requires manual dispatch.
