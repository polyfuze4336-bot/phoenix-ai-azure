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

## [4.1.0] — 2026-08-16

### Changed
- **HCP clinical notice** — the Original HCP analysis and chat surfaces display one concise,
  bilingual reminder covering authorized/de-identified patient information, Malaysia's PDPA 2010,
  professional confidentiality, and the decision-support limitation of AI output.
- **Responsible AI evidence** — `RAI-PRIV-007` is restored as an Active, tested, user-visible
  handling notice. It does not claim that the prototype or its users are legally compliant.

### Boundaries
- No route, external integration, Azure resource, identity, storage, database, model, prompt, or
  clinical-calculation change. No ADR is required. See
  [CHANGE-20260816](./changes/CHANGE-20260816-original-clinical-notice.md).

## [4.0.0] — 2026-08-15

### Changed
- **One Phoenix AI experience** — the repository publishes only `/`, `/hcp*`, and `/community*`;
  the retired `app/v2`, `components/v2`, and `lib/v2` source families, feature flags, assets, and
  v2-only tests are removed. Their history remains recoverable from Git.
- **Global language contract** — one root `LanguageProvider` owns persisted
  `AppLanguage = "en" | "ms"`; retained UI text is sourced from structured English and Bahasa
  Melayu resources and reacts without refresh.
- **AI language enforcement** — all four AI routes require the selected language, apply strict
  system instructions, validate completed output, and retry at most once when the output is
  predominantly in the wrong language. Telemetry records only requested/detected language codes.
- **Canonical clinical values** — machine enums remain language-neutral and are translated only at
  presentation time.

### Boundaries
- No Azure resource, identity, network, storage, database schema, model deployment, or clinical
  calculation change. See [ADR-0011](./decisions/ADR-0011-single-experience-global-language.md) and
  [CHANGE-20260815](./changes/CHANGE-20260815-single-experience-global-language.md).

## [3.0.1] — 2026-08-15

### Changed
- **Vision input safe failure** — HCP and Community image-analysis routes validate model-compatible
  JPEG, PNG, WebP, and GIF payloads, normalize data URLs, and reject malformed, mismatched, HEIC,
  or HEIF input with an actionable client error before invoking Azure AI.
- **Original client feedback** — analysis clients display the API validation message instead of
  replacing every non-success response with the generic `Analysis failed` text.

### Boundaries
- No Azure resource, identity, model, prompt, output schema, clinical calculation, or persistence
  change. See [CHANGE-20260815](./changes/CHANGE-20260815-vision-input-safe-failure.md).

## [3.0.0] — 2026-08-15

### Changed
- **Original-only public experience** — `/` renders the verified Original Phoenix AI landing;
  `/hcp*`, `/community*`, and `/community/image-check` are the supported user journeys.
- **v2 retired from runtime** — `/v2/*` is no longer published. The v2 source remains recoverable
  from `backup/pre-rollback-20260815` and `pre-rollback-20260815`.
- **Stable application baseline** — Original application files are restored from deployment-tagged
  commit `7298f21`; current Container Apps, ACR, Azure AI, PostgreSQL, identity, telemetry, and OIDC
  deployment topology are retained.

### Boundaries
- No Azure resource, external integration, database schema, secret, or managed identity changes.
- No destructive Git rewrite or database rollback. See [ADR-0010](./decisions/ADR-0010-restore-original-only-experience.md)
  and [CHANGE-20260815](./changes/CHANGE-20260815-restore-original-only-experience.md).

## [2.4.0] — 2026-08-14

## [2.5.0] — 2026-08-14

### Changed
- **PostgreSQL deployment baseline** — `infra/modules/postgresql.bicep` now uses supported Flexible
  Server major versions only (`17` or `18`) with default `17`, replacing the previous unsupported
  default value (`15`) that fails subscription deployments under `Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01`.

### Boundaries
- No user-facing UX, route contract, model behavior, identity flow, or storage topology changed.
- The change is an infrastructure compatibility remediation for existing deployment workflows only.
- See [CHANGE-20260814](./changes/CHANGE-20260814-postgresql-supported-major-version.md).

## [2.4.0] — 2026-08-14

### Changed
- **v2-only public landing** — when the v2 feature is enabled, `/` now renders the Phoenix AI v2.0
  landing directly. Original portal routes remain available for compatibility but are no longer
  advertised from the public landing.
- **Shared HCP analysis transport** — original and v2 assessment clients use one image preparation,
  request and SSE completion path against `/api/analyze-wound`, including final-buffer handling and
  safe API error messages.
- **Bilingual HCP AI output** — HCP chat and both staged/single-pass image analysis accept the existing
  `en` / `bm` language selection. Structured contract keys and machine enums remain stable while
  clinician-facing narrative output follows the selected language.
- **Shared legal/safety notice** — HCP analysis and chat surfaces display a bilingual notice requiring
  patient-data/image handling under Malaysia's PDPA 2010 and applicable Malaysian law, and state that
  AI output is clinical decision support only.

### Boundaries
- No new Azure resource, external integration, storage path or identity mechanism is introduced.
- Inference images remain ephemeral in `/api/analyze-wound`; a separate original-HCP history request
  may retain an image/result only for the verified Entra clinician. Demo auth cannot use history.
- This is not a claim of legal compliance, clinical validation, certification or regulatory approval.
  See [ADR-0008](./decisions/ADR-0008-v2-default-public-entry.md) and
  [CHANGE-20260814](./changes/CHANGE-20260814-v2-analysis-language-safety.md).

## [2.3.0] — 2026-08-13

### Changed
- **HCP analysis input contract extension** — `/api/analyze-wound` now accepts one-or-many images
  for a single assessment case (backward-compatible with the existing single-image request shape).
- **Pipeline behavior extension** — staged analysis consolidates overlapping/duplicate views across
  multi-image submissions into one total TBSA estimate for the case (not naive per-image summation).
- **Deterministic TBSA severity component** — the post-processing layer now classifies estimable burn
  TBSA as `Major burn (>=15% TBSA)` vs `Minor burn (<15% TBSA)` and exposes it through the existing
  HCP analysis response/UI surfaces.

### Boundaries
- No new Azure resources or external integrations were introduced; this change remains within
  existing `INT-BROWSER-APP` and `INT-APP-FOUNDRY` paths.
- The single-pass fallback (`AI_ANALYSIS_PIPELINE=single`) remains available and backward compatible
  with single-image requests.
- Responsible AI controls remain grounded in implemented evidence and continue to disclose scope and
  limitations. See [CHANGE-20260813](./changes/CHANGE-20260813-hcp-multi-image-tbsa.md).

## [2.2.1] — 2026-08-12

### Changed
- **Rapid-prototype deployment policy** — the `Demo` and `Development` GitHub environments use no
  required reviewers or environment protection rules. Demo remains manual-dispatch only, while
  Development continues to deploy from `main` and by manual dispatch.
- OIDC subject restrictions, Azure RBAC scopes, workflow validation, and application behavior are
  unchanged. See
  [CHANGE-20260812](./changes/CHANGE-20260812-rapid-prototype-deployment-policy.md).

### Boundaries
- This reviewer-free policy is intentional for rapid prototyping and is not a production approval
  model. Production use requires a separate governance review.
- Responsible AI controls are unchanged; this policy only removes a deployment approval wait state.

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
- Human BFGS accounts are not pipeline credentials. Demo is manual-dispatch only; reviewer-free
  rapid-prototype policy is recorded in architecture version 2.2.1.
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
