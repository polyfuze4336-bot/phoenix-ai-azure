# Part 23 — Benefit Traceability Matrix

> Every benefit claimed in the executive summary ([Part 19](executive-migration-summary.md)) and
> the benefits detail ([Part 8](migration-benefits.md)) is listed here and traced to the specific
> change, the supporting evidence, and an honest status. If a benefit is partial or conditional,
> it is marked as such. No benefit appears in the summary that is absent from this matrix.

Status legend: **Implemented**, **Partially implemented**, **Opt-in**, **Deferred**.

| # | Benefit (as stated) | Enabling change | Evidence | Status |
| --- | --- | --- | --- | --- |
| B1 | Reduced credential risk — no static model/storage keys | Managed identity for AI + Storage (`DefaultAzureCredential`) | `lib/ai/azure-credential.ts`, `lib/storage/azure-blob-provider.ts`; live readiness `azure-ai=ok (auth=identity)` | Implemented |
| B2 | Swappable, maintainable AI backend | Portable provider layer + Zod validation | `lib/ai/ai-provider.ts`, `lib/ai/validation/*`; unit tests `ai-parsing`, `wound-schema` | Implemented |
| B3 | Managed relational persistence foundation | Azure PostgreSQL + migrations + `AnalysisRecord` | `prisma/migrations/*`; readiness `postgresql=ok (3 ms)`; [persistence-gap-assessment.md](persistence-gap-assessment.md) | Partially implemented |
| B4 | Operational visibility (telemetry) | App Insights + `lib/telemetry/*` + `instrumentation.ts` | App Insights query: 298 requests / 0 exceptions (2 days) | Implemented |
| B5 | Health monitoring | `/api/health/{live,ready,db}` + `lib/health/readiness.ts` | Live probes 200; readiness body | Implemented |
| B6 | Alerting on faults/latency | Metric alerts + action group | `infra/modules/alerts.bicep`; `alert-phoenixai-http5xx`, `alert-phoenixai-response-time`, `ag-phoenixai-ops` | Implemented |
| B7 | Reproducible environment (IaC) | Bicep `infra/main.bicep` + 11 modules | `az resource list` = 12 resources matching modules; bicep 0 warnings | Implemented |
| B8 | Repeatable, credential-less deployment | GitHub OIDC CI/CD | `.github/workflows/{ci,deploy-demo,deploy-dev,infrastructure,db-migrate}.yml` | Implemented |
| B9 | Privacy-conscious observability | Telemetry excludes clinical content | `.env.example` observability section; `lib/telemetry/*` | Implemented |
| B10 | Optional enterprise sign-in path | Entra ID (OIDC) behind `AUTH_MODE=entra` + signed session | `lib/auth/entra-*`, `app/api/auth/entra/*`, `middleware.ts`; [authentication.md](../security/authentication.md) | Opt-in |
| B11 | Regression safety net | Unit/integration/e2e/api/network/visual suites | `tests/*`; recorded 76/14/17/14/1, 141/143 visual | Implemented |
| B12 | Removed Abacus/AWS lock-in | Abacus runtime + AWS S3 removed | [removals.md](removals.md); grep = 2 comment-only refs | Implemented |
| B13 | Brand & UX preservation | Logo + UI dependency set retained | logo blob `370601e` identical; 141/143 visual parity | Implemented |
| B14 | Consolidated on a single cloud | One Azure backend (AI, storage, DB, host) | [change-inventory.md](change-inventory.md); 12 Azure resources | Implemented |

## Benefits explicitly NOT claimed

To avoid overstatement, the documentation does **not** claim any of the following, because they
were not achieved or not assessed:

- Clinical validation, regulatory compliance, or patient-safety assurance.
- Multi-region resilience, high availability, or disaster recovery.
- Enterprise authentication by default (Entra is opt-in).
- End-to-end persistence of all screens (persistence is partial).
- Cost or capacity optimisation.
- Load, penetration, or accessibility testing.

## Cross-check

Each benefit B1–B14 corresponds to a bullet in [migration-benefits.md](migration-benefits.md) or
[executive-migration-summary.md](executive-migration-summary.md). Every "Partially implemented" and
"Opt-in" status is expanded in [tradeoffs-and-limitations.md](tradeoffs-and-limitations.md).
