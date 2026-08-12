# Architecture Changelog

All notable changes to the Phoenix AI **architecture** are recorded here. This file tracks the
architecture version declared in [ARCHITECTURE_VERSION](./ARCHITECTURE_VERSION), which is
independent of the application's package version.

Versioning follows semantic versioning applied to architecture:

- **MAJOR** — a component, external integration, or deployment topology is added, removed, or
  replaced; a data/identity/storage strategy changes; a cross-cutting policy is introduced.
- **MINOR** — a component is extended or reconfigured in a backward-compatible way (new route,
  new optional dependency wired, new diagram) without changing the overall topology.
- **PATCH** — documentation corrections, clarifications, or diagram tidy-ups with no change to the
  described architecture.

Every architecture-impacting pull request MUST bump this version and add an entry, and SHOULD
reference the relevant ADR and change record.

## [2.2.0] — 2026-08-12

### Changed
- **GitHub deployment identity** — a dedicated Entra app registration and service principal named
  `github-phoenixai-deploy` authenticates GitHub Actions through environment-bound OIDC federated
  credentials for `Demo` and `Development`. The subjects include GitHub's immutable organization
  and repository IDs (`225331490` and `1324632738`); no Azure user password or client secret is
  stored.
- The principal receives `Contributor` at subscription scope because `infra/main.bicep` is a
  subscription-scoped deployment, plus `Role Based Access Control Administrator` only on
  `rg-phoenixai-bfgs-demo` so Bicep can manage workload role assignments inside the demo boundary.

### Boundaries
- The deployment principal cannot delegate access outside the Phoenix AI demo resource group.
- Human BFGS accounts are not pipeline credentials. Demo is manual-dispatch only; required-reviewer
  protection remains pending until the repository owner designates the human approver.
- Application behavior and Responsible AI controls are unchanged. No ADR is required because this
  completes the OIDC design already selected by the deployment architecture. See
  [CHANGE-20260812](./changes/CHANGE-20260812-github-oidc-deployment-identity.md).

## [2.1.0] — 2026-08-10

### Changed
- **Demo operator access** — the existing Microsoft Entra security group `BFG Solutions` receives
  the built-in Azure `Owner` role on `rg-phoenixai-bfgs-demo`. Its three current members can manage
  all demo resources and RBAC assignments inside that dedicated resource group.
- The assignment is operationally managed and represented by stable component
  `OPS-DEMO-OWNER-RBAC` and integration `INT-DEMO-OPERATORS-ARM`; workload managed-identity roles
  remain owned by `INFRA-ROLES` and Bicep.

### Boundaries
- The grant does not apply at subscription scope and does not cover the other 39 tenant users.
- Existing subscription-level `Contributor` access for the group remains unchanged.
- Application behavior, runtime identity, data access, prompts, model/version, and Responsible AI
  controls are unchanged.
- No ADR is required for this reversible, resource-group-scoped operational access change. See
  [CHANGE-20260810](./changes/CHANGE-20260810-demo-rg-owner-access.md).

## [2.0.0] — 2026-08-09

### Changed
- **Hosting replacement** — Phoenix AI now runs its unchanged Next.js standalone server in Azure
  Container Apps Consumption instead of an Azure App Service plan. The target subscription has
  `Total Regional VMs = 0` for App Service in every checked US region, so ARM preflight rejects all
  paid App Service SKUs even though the P0v4 SKU meter itself reports capacity.
- **Container image delivery** — Azure Container Registry Basic stores the Phoenix AI image. ACR
  Tasks performs the remote build, and the existing user-assigned managed identity receives
  account-scoped `AcrPull`; registry admin credentials remain disabled.
- **Runtime configuration** — the Container App uses Key Vault-backed secrets, managed identity,
  external HTTPS ingress on port 3000, startup/liveness/readiness probes, single-revision traffic,
  and Consumption scaling from zero to three replicas.
- `INFRA-APPSERVICE` and `INFRA-PLAN` are deprecated. `INFRA-CONTAINERAPP`, `INFRA-ACA-ENV`, and
  `INFRA-ACR` are the active hosting components.

### Unchanged
- Application routes, visible UX, API contracts, AI prompts/model/version, PostgreSQL, Blob,
  Key Vault, managed identity, Application Insights, and Responsible AI controls are unchanged.
- See [ADR-0007](./decisions/ADR-0007-use-azure-container-apps.md) and
  [CHANGE-20260809](./changes/CHANGE-20260809-container-apps-hosting.md).

## [1.4.0] — 2026-08-09

### Changed
- **Customer-owned Azure AI deployment** — the Bicep deployment now provisions an `AIServices` S0
  account and a `gpt-4o` `2024-11-20` Global Standard deployment in the Phoenix AI environment
  resource group instead of referencing the shared `aif-yfjw6y` account in `rg-aisgemini-dev`.
- **Customer deployment profile** — the current target is `rg-phoenixai-bfgs-demo` in East US 2,
  using a P0v4 Linux App Service plan because B1 and P1v3 worker quota are unavailable in the
  customer subscription.
- `current-architecture.md`, `diagrams/current-architecture.mmd`,
  `diagrams/current-deployment.mmd`, `component-inventory.md`, `integration-inventory.md`, and
  `azure-resource-map.md` now describe environment-owned AI resources and managed-identity RBAC.

### Unchanged
- `INT-APP-FOUNDRY`, the Azure OpenAI-compatible request/response contract, `gpt-4o` model version,
  prompts, staged analysis pipeline, Responsible AI controls, and visible UX are unchanged.
- See [ADR-0006](./decisions/ADR-0006-customer-owned-azure-ai.md) and
  [CHANGE-20260809](./changes/CHANGE-20260809-customer-owned-ai-account.md).

## [1.3.0] — 2026-08-07

### Added
- **AI Assurance layer** (`current-architecture.md` §3.9) — Responsible AI controls surfaced as a
  first-class architecture layer (ADR-0005, CHANGE-20260807-rai-assurance-layer). New source-of-truth
  and supporting libraries: `lib/rai/controls.ts` (control register), `lib/rai/governance.ts`
  (governance snapshot), `lib/ai/prompts/versions.ts` (prompt/pipeline/schema versions),
  `lib/ai/analysis/metadata.ts` (analysis metadata envelope). New component IDs: `LIB-RAI`,
  `AI-PROMPT-VERSIONS`, `AI-ANALYSIS-METADATA`, `UI-V2-AI-ASSURANCE`.
- **In-product AI Assurance page** (`app/v2/hcp/ai-assurance/*`) plus per-assessment assurance
  surfaces (`components/v2/analysis-info-panel.tsx`, `components/v2/clinical-review-panel.tsx`) and a
  new nav entry.
- **AI assurance flow diagram** (`diagrams/current-ai-assurance.mmd`) and an assurance annotation on
  `diagrams/current-ai-architecture.mmd`.
- **RAI test suite** (`tests/rai/*`, `npm run test:rai`) and `docs/rai/` documentation set.

### Changed
- `analyze-wound` route returns an analysis metadata envelope (`result.meta`) for traceability
  (non-sensitive: analysis id, model deployment name, versions, image-quality band, review status).

## [1.2.0] — 2026-08-07

### Added
- **Phoenix AI v2.0 experience** (`app/v2/*`, `components/v2/*`, `lib/v2/*`) — an additive,
  isolated, feature-flag-gated alternative experience layered onto the preserved Original app
  (ADR-0004, CHANGE-20260807-phoenix-v2-experience). Includes an enhanced HCP workspace
  (dashboard, cases, guided assessment, AI assistant, calculators, guidelines, reports, insights)
  and an enhanced community portal (home, self-assessment, image-check, chat, first-aid,
  education). New component IDs: `UI-V2-HCP`, `UI-V2-COMMUNITY`, `UI-V2-SHELL`, `LIB-V2`.
- **Experience selector landing** — the root route (`app/page.tsx`) becomes an experience selector
  that routes to either the unchanged Original portals (`/hcp-login`, `/community`) or v2 (`/v2`).
  It degrades to the original landing (`app/_components/landing-client.tsx`) when
  `NEXT_PUBLIC_FEATURE_V2_ENABLED=false`.
- **v2 unit tests** — `tests/unit/v2-feature-flags.test.ts`, `tests/unit/v2-demo-data.test.ts`,
  `tests/unit/v2-format.test.ts` (flag defaults, synthetic-data determinism/invariants, first-aid
  parity).

### Changed
- `current-architecture.md` §1, §2 diagram, §3.1 Experience Layer; `diagrams/current-architecture.mmd`;
  `component-inventory.md`; `integration-inventory.md`; `azure-resource-map.md` — all updated to
  document the additive v2 layer.

### Unchanged
- **No new Azure resources** and **no new external integrations.** v2 reuses the existing API
  contracts (`/api/analyze-wound`, `/api/hcp-chat`, `/api/community-analyze`, `/api/community-chat`)
  and Azure services. v2 dashboards/insights render deterministic, clearly-labelled **synthetic**
  data only. The Original experience (`app/hcp/*`, `app/community/*`, `app/_components/landing-client.tsx`)
  is preserved unchanged.

## [1.1.0] — 2026-08-07

### Added
- **Staged wound-analysis pipeline** for `/api/analyze-wound` (`lib/ai/analysis/pipeline.ts`):
  four sequential model stages (visual observation → clinical interpretation & quantification →
  management & referral → consistency/safety critic) with deterministic post-processing.
  Default behaviour; `AI_ANALYSIS_PIPELINE=single` reverts to the original single-pass call.
- **Purpose-specific model selection** (`lib/ai/model-config.ts`):
  `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` / `AZURE_AI_CHAT_MODEL_DEPLOYMENT`, both defaulting to
  `AZURE_AI_MODEL_DEPLOYMENT` so existing configuration is unchanged.
- **Rich analysis schema + back-compat adapter** (`lib/ai/schemas/burn-wound-analysis.ts`):
  observation-vs-interpretation separation, per-field confidence, and explicit information gaps,
  mapped back to the existing 22-field contract so the SSE envelope and existing client are
  unchanged; the full structure travels under `result.structured`.
- **Staged prompts** (`lib/ai/prompts/wound-visual-observation`, `-clinical-interpretation`,
  `-management`, `-analysis-critic`) and streaming collector (`lib/ai/streaming/collect.ts`).
- **Enhanced HCP analysis UI** (`app/hcp/analysis/_components/structured-analysis.tsx`):
  analysis-quality banner, "Why this assessment?" evidence/confidence, and a REFINE second-pass.
- **Evaluation harness** (`tests/evaluation/burn-wound/`) and analysis unit tests
  (`tests/unit/analysis-pipeline.test.ts`) for deterministic safety rules.

### Changed
- `/api/analyze-wound` route wired to the staged pipeline (flagged) with `maxDuration` raised to
  match multi-stage latency; deterministic Parkland now requires a supplied weight (no assumed
  70 kg), Fitzpatrick reported only when clinician-supplied, measurements only with a scale.
- Diagram `current-ai-architecture.mmd` and `current-architecture.md` §3.3 updated to describe
  the staged pipeline, model split, and deterministic clinical calculation.

### Notes
- No fabricated accuracy figures: diagnostic accuracy is **not** certified. The evaluation harness
  is scaffolded but requires live Azure calls against a labelled, consented dataset.
- See change record
  [`changes/CHANGE-20260807-improve-ai-analysis-accuracy.md`](./changes/CHANGE-20260807-improve-ai-analysis-accuracy.md)
  and [ADR-0003](./decisions/ADR-0003-staged-wound-analysis-pipeline.md).

## [1.0.0] — 2024

### Added
- Established the authoritative AS-IS architecture baseline for Phoenix AI:
  - `current-architecture.md` (8-layer AS-IS model, source-vs-deployment section).
  - Diagrams: `current-architecture.mmd`, `current-data-flow.mmd`, `current-deployment.mmd`,
    `current-ai-architecture.mmd`.
  - `component-inventory.md`, `integration-inventory.md`, `azure-resource-map.md`.
- Introduced architecture-first governance (see
  [ADR-0002](./decisions/ADR-0002-architecture-first-governance.md)):
  ADR process, this changelog, `ARCHITECTURE_VERSION`, change records, PR template,
  governance CI (docs-sync gate + Mermaid validation), and drift-detection script.
- Recorded the founding hosting decision (see
  [ADR-0001](./decisions/ADR-0001-use-nextjs-app-service.md)).

### Notes
- No functional application behaviour was changed in this version; it documents the existing
  implementation and installs the governance framework.
