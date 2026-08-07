# Part 8 — Migration Benefits

> Concrete technical and business benefits achieved by moving Phoenix AI from Abacus.AI to
> Azure, each tied to a specific, evidenced change. Benefits are stated conservatively and
> honestly; where a benefit is partial or configuration-dependent, it is marked as such. Every
> benefit here is traced in [benefit-traceability-matrix.md](benefit-traceability-matrix.md).

Status legend: **Implemented**, **Partially implemented**, **Opt-in**, **Planned/Deferred**.

## 1. Identity-based access instead of static API keys — Implemented

- **Change:** AI and Storage now authenticate with a user-assigned managed identity
  (`DefaultAzureCredential`) instead of a static `ABACUSAI_API_KEY` / AWS credentials.
- **Benefit:** No long-lived model or storage secret is stored in the app; live readiness shows
  `azure-ai=ok (auth=identity)`. Reduces credential-leak surface.
- **Evidence:** `lib/ai/azure-credential.ts`, `lib/storage/azure-blob-provider.ts`, readiness body.

## 2. Portable AI provider layer — Implemented

- **Change:** Inline Abacus calls replaced by `lib/ai/*` with prompts, validation, and streaming
  isolated behind a provider interface.
- **Benefit:** The model backend can change without touching route handlers or UI; input/output
  is validated with Zod. Improves maintainability and testability.
- **Evidence:** `lib/ai/ai-provider.ts`, `lib/ai/validation/*`, unit tests `tests/unit/ai-parsing.test.ts`, `wound-schema.test.ts`.

## 3. Data persistence foundation on managed PostgreSQL — Partially implemented

- **Change:** Azure Database for PostgreSQL Flexible Server provisioned; Prisma migrations and
  seed added; `AnalysisRecord` model + HCP history feature wired.
- **Benefit:** A managed, backed-up relational store is available; the HCP history feature now
  persists analyses. Most dashboards still render original demo content (parity), so persistence
  is not yet end-to-end.
- **Evidence:** `prisma/migrations/*`, live readiness `postgresql=ok (3 ms)`,
  [persistence-gap-assessment.md](persistence-gap-assessment.md).

## 4. Observability & health probes — Implemented

- **Change:** Privacy-safe Application Insights telemetry + `/api/health/{live,ready,db}`.
- **Benefit:** Request/AI latency, errors, and dependency health are visible; App Insights shows
  298 requests / 0 exceptions over 2 days. Enables operational monitoring and alerting.
- **Evidence:** `lib/telemetry/*`, `instrumentation.ts`, `app/api/health/*`, App Insights query,
  metric alerts `alert-phoenixai-http5xx`, `alert-phoenixai-response-time`.

## 5. Infrastructure as code & repeatable deployment — Implemented

- **Change:** Full environment expressed in Bicep (`infra/main.bicep` + 11 modules); GitHub OIDC
  CI/CD workflows.
- **Benefit:** The 12-resource environment can be recreated from source; no manual portal clicks
  required for the core topology. Improves reproducibility and review.
- **Evidence:** `infra/`, `.github/workflows/*`, live `az resource list` (12 resources).

## 6. Privacy-conscious telemetry — Implemented

- **Change:** Telemetry explicitly excludes clinical content (no images, base64, prompts, AI
  responses, transcripts, secrets).
- **Benefit:** Operational visibility without exposing patient/clinical data.
- **Evidence:** `.env.example` observability section, `lib/telemetry/*`.

## 7. Optional enterprise sign-in path — Opt-in

- **Change:** Microsoft Entra ID (OIDC) provider added behind `AUTH_MODE=entra`, with signed
  session cookies and middleware-protected HCP routes.
- **Benefit:** A path to real SSO/role mapping exists without changing the default demo UX.
- **Evidence:** `lib/auth/entra-*`, `app/api/auth/entra/*`, `middleware.ts`,
  [docs/security/authentication.md](../security/authentication.md).

## 8. Automated regression safety net — Implemented

- **Change:** Unit, integration, e2e, api, network, and visual-parity suites added.
- **Benefit:** Regressions (including any Abacus/localhost leakage and visual drift) are caught
  automatically. Recorded totals: 76 unit, 14 integration, 17 e2e, 14 api, 1 network, 141/143 visual.
- **Evidence:** `tests/*`, [original-vs-current-testing.md](../testing/original-vs-current-testing.md).

## 9. Removed cloud lock-in to Abacus.AI and AWS — Implemented

- **Change:** Abacus runtime + AWS S3 helpers removed; single Azure backend.
- **Benefit:** Consolidated on one cloud; no residual Abacus/AWS runtime code.
- **Evidence:** [removals.md](removals.md), grep result (2 comment-only references).

## Honest framing

These benefits describe an Azure **parity migration with an operational foundation**, not a
clinically validated or production-hardened system. Limitations (single region, sandbox Key Vault
constraint, demo authentication, partial persistence) are documented in
[tradeoffs-and-limitations.md](tradeoffs-and-limitations.md).
