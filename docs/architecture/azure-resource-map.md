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
> The `4.1.0` bilingual HCP clinical notice is static application content and changes no Azure
> resource, SKU, region, identity, secret, network path, data store, or model deployment.
> The `5.0.0` direct-main repository workflow changes GitHub triggers and governance only. Existing
> OIDC federated credentials, Azure RBAC, resources, regions, SKUs, secrets, and deployment targets
> are unchanged.
> The `5.1.0` image-analysis resilience and HCP notice change is application-only. It adds no Azure
> resource, SKU, region, identity, RBAC, secret, model deployment, network path, database, or storage
> change; `AI_ANALYSIS_TIMEOUT_MS` is an optional setting with a bounded code default.
> The `6.0.0` safe-retry, telemetry, reliability-test, and workflow consolidation changes application
> and GitHub delivery code only. Existing Azure resources, OIDC identity, RBAC, secrets, model,
> database, storage, network, SKU, and region remain unchanged.
> The `6.1.0` Codespaces and immutable-image rollback change adds developer configuration and a
> manual workflow path only. It reuses the existing OIDC identity, ACR SHA images, and Container App;
> no Azure resource, RBAC, secret, model, database, network, SKU, or region changes.
> The `6.1.1` live audit confirms PostgreSQL 17.10 and the existing two-workflow prototype delivery
> shape. It is documentation-only and changes no Azure or GitHub resource.
> The `6.2.0` HCP analysis fixes are application-only. They reuse the existing `gpt-4o` deployment
> and `Microsoft.Default` policy declared by Bicep; no Azure policy or resource is changed
> automatically. The live attached policy must be verified manually before any least-permissive
> healthcare-specific filter adjustment.
> The `7.0.0` Community image-analysis retirement and HCP chat layout change are application-only.
> They add, remove, or reconfigure no Azure resource, identity, secret, model deployment, database,
> storage, network path, SKU, or region.

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
| Relational database | PostgreSQL Flexible Server 17.10, Burstable `Standard_B1ms`, 32 GiB | `psql-phoenixai-oaprp7dte7bw2` | `infra/modules/postgresql.bicep` | DB-POSTGRES | bfgs-demo |
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
| Deployment identity | Entra app/service principal + federated credentials | `github-phoenixai-deploy`; reviewer-free `Development` environment OIDC | Operational assignment; `CHANGE-20260812-github-oidc-deployment-identity.md` | OPS-GHA-OIDC-RBAC / DEVOPS-GHA | bfgs-demo |

## Notes

- **DATABASE_URL** is stored in Key Vault and consumed through a Container Apps Key Vault-backed secret.
  It is never reproduced in this document.
- Blob Storage is provisioned and reachable (readiness `blob-storage=ok`) but **no UI workflow
  persists files** — see [current-architecture.md §4](./current-architecture.md#4-source-vs-deployment).
- The application authenticates to Azure AI and Storage using the **user-assigned managed
  identity** (`id-phoenixai-<token>`); no keys are stored in application settings.
- Bicep declares `raiPolicyName: Microsoft.Default` for `gpt-4o`. Repository evidence cannot prove
  that the live deployment has not drifted or identify a blocking category before a real rejection;
  operators must inspect the deployment and its safe filter evidence in Azure.
- The `BFG Solutions` security group has `Owner` only on the dedicated demo resource group. This
  covers its three current members, not all 42 tenant users, and does not elevate the group at
  subscription scope.
- GitHub Actions uses a dedicated OIDC workload identity rather than a human account. Its
  subscription `Contributor` role supports the subscription-scoped Bicep deployment; its ability
  to create role assignments is limited to `rg-phoenixai-bfgs-demo`.
- Active workflows bind `Development` only because the working secrets are scoped there. GitHub API
  inspection on 2026-08-16 confirmed zero protection rules and no required reviewers. Repository
  owners should verify `Settings → Environments → Development → Deployment protection rules`;
  workflow YAML cannot disable account-level environment rules.
