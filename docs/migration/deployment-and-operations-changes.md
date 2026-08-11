# Part 17 — Deployment and Operations Changes

> How Phoenix AI is built, deployed, and operated on Azure versus the original Abacus.AI hosting.
> Evidence: `infra/` Bicep, `.github/workflows/*`, `scripts/make-standalone-zip.py`, and live
> `az resource list` / health probes.

## 1. Hosting

| Aspect | Original | Current |
| --- | --- | --- |
| Platform | Abacus.AI hosted | Azure App Service (Linux) `app-phoenixai-yun55ezsi4yoq` |
| Plan | platform-managed | `plan-phoenixai-yun55ezsi4yoq` (P1v3) |
| Region | platform | `southeastasia` |
| Build output | platform-managed | Next.js `output: "standalone"` |
| Packaging | n/a | prebuilt zip via `scripts/make-standalone-zip.py` (forward-slash, extended-length paths) |
| Base URL | platform | derived from `WEBSITE_HOSTNAME` (no localhost dependency) |

## 2. Live resource inventory (12, `rg-phoenixai-demo`)

| Resource | Name | Role |
| --- | --- | --- |
| App Service | `app-phoenixai-yun55ezsi4yoq` | Runs the Next.js app |
| App Service Plan | `plan-phoenixai-yun55ezsi4yoq` | P1v3 compute |
| PostgreSQL Flexible Server | `psql-phoenixai-yun55ezsi4yoq` | Managed database |
| Storage account | `stphxyun55ezsi4yoq` | Blob (private `clinical-uploads`) |
| Storage account (smart detector) | `stphxyun55ezsi4yoq-<guid>` | Alerts smart-detector store |
| Key Vault | `kv-phx-yun55ezsi4yoq` | Secret store |
| User-assigned MI | `id-phoenixai-yun55ezsi4yoq` | AI + Storage identity |
| Log Analytics | `log-phoenixai-yun55ezsi4yoq` | Log store |
| Application Insights | `appi-phoenixai-yun55ezsi4yoq` | Telemetry |
| Metric alert | `alert-phoenixai-http5xx` | HTTP 5xx alerting |
| Metric alert | `alert-phoenixai-response-time` | Latency alerting |
| Action group | `ag-phoenixai-ops` | Alert routing |

The AI model resource (Foundry `aif-yfjw6y`, `gpt-4o` + `text-embedding-3-small`) lives in
`rg-aisgemini-dev` (`eastus2`) and is consumed via managed identity.

## 3. Infrastructure as code

`infra/main.bicep` + `main.bicepparam` + 11 modules: `managed-identity`, `log-analytics`,
`application-insights`, `key-vault`, `storage`, `postgresql`, `app-service-plan`, `app-service`,
`role-assignments`, `foundry-connection`, `alerts`. Bicep builds with 0 warnings.

## 4. CI/CD

| Workflow | Purpose |
| --- | --- |
| `ci.yml` | Build / typecheck / lint / test |
| `infrastructure.yml` | Provision/update Bicep infra |
| `deploy-demo.yml` | Deploy the app to the demo environment |
| `deploy-dev.yml` | Deploy to a dev environment |
| `db-migrate.yml` | Run Prisma migrations |

Authentication to Azure uses **GitHub OIDC federation** (no stored cloud credentials in CI).

## 5. Operations & health

- Liveness/readiness: `/api/health/live`, `/api/health/ready`, `/api/health/db`.
- Live readiness: `runtime=ok`, `azure-ai=ok (auth=identity)`, `postgresql=ok (3 ms)`,
  `blob-storage=ok (container=clinical-uploads)`.
- Telemetry: App Insights (298 requests / 6 events / 0 exceptions over 2 days).
- Alerting: 5xx + response-time metric alerts → action group `ag-phoenixai-ops`.

## 6. Environment-specific decisions (recorded honestly)

- **Region pivot:** deployed to `southeastasia` because MCAPS sandbox quota blocked `eastus2`.
- **ARM REST deployment workaround:** used during release (recorded in
  [MIGRATION.md](MIGRATION.md)).
- **Key Vault constraint:** MCAPS policy forces Key Vault public network access off, so
  `DATABASE_URL` is a direct App Service app setting rather than a Key Vault reference in this
  environment. See [tradeoffs-and-limitations.md](tradeoffs-and-limitations.md).

## 7. What operations did NOT exist originally

Health probes, telemetry, alerts, IaC, CI/CD pipelines, and repeatable provisioning are all new;
the original source had none of these.
