# ADR-0004: Dual-experience (Original + v2.0) additive architecture

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** Phoenix AI migration team
- **Related components:** V2-SHELL, V2-LANDING, V2-HCP-DASHBOARD, V2-CASES, V2-ASSESSMENT, V2-ASSISTANT, V2-CALCULATORS, V2-REPORTS, V2-INSIGHTS, V2-COMMUNITY, V2-FEATURE-FLAGS, V2-DEMO-DATA, EXP-LANDING, EXP-HCP, EXP-COMMUNITY, AI-ANALYSIS-PIPELINE, CLIN-PARKLAND, CLIN-TBSA
- **Related integrations:** INT-APP-FOUNDRY, INT-APP-POSTGRES, INT-APP-INSIGHTS

## Context

The task "Phoenix AI v2.0 — Create an Enhanced Experience While Preserving the Original
Application" requires shipping a materially enhanced product experience **without overwriting or
redesigning** the existing (Original / v1) application. The Original experience — its logo,
branding, colour palette, routes, clinical tooling, and user journeys — must keep working exactly
as before. The migration prime directive ("preserve the original visible user experience") and the
architecture-first change policy both apply.

We must choose how the two experiences coexist in one Next.js App Router codebase and one Azure
App Service deployment.

## Decision

Adopt an **additive, isolated dual-experience architecture**:

1. **Route isolation.** The entire enhanced experience lives under `/v2/*`. The Original routes
   (`/hcp*`, `/community*`, `/hcp-login`) are untouched. `/` is redesigned into a lightweight
   **experience selector** that links to both — the only change to existing surface, and it
   preserves the original logo/brand.
2. **Component isolation.** A distinct `PhoenixV2Shell` (`components/v2/`) and `app/v2/**` tree
   are created. v2 never imports the Original shell, and the Original never imports v2. Shared
   primitives (logo, `components/ui/*`, `lib/ai`, `lib/clinical`, i18n, telemetry, auth) are
   reused read-only.
3. **Backend reuse, zero new Azure resources.** v2 calls the same `/api/analyze-wound` and
   `/api/hcp-chat` endpoints, the same Foundry `gpt-4o` deployment, the same PostgreSQL, and the
   same Application Insights. Case/insights UI uses **synthetic, clearly-labelled** in-memory demo
   data (`lib/v2/demo-data.ts`) — no schema change, no migration.
4. **Feature-flagged.** `FEATURE_V2_ENABLED` plus granular flags (`FEATURE_CASES`,
   `FEATURE_REPORTS`, `FEATURE_INSIGHTS`, `FEATURE_GUIDELINE_AI`, `FEATURE_NOTIFICATIONS`,
   `FEATURE_COMMAND_PALETTE`) gate v2 surface for instant, data-safe rollback.
5. **Design continuity.** v2 derives its design tokens from the existing Phoenix palette
   (primary `#8B0000`, Phoenix gradient to amber `#F59B0C`) — brighter and cleaner, but
   recognisably Phoenix, reusing the exact original `public/logo.png`.

## Alternatives Considered

- **Fork the repo / separate app.** Full isolation but duplicates infra, CI, and the AI
  integration; violates "reuse existing Azure resources"; higher cost and drift risk. Rejected.
- **In-place redesign of `/hcp` and `/community`.** Directly violates the prime directive
  ("must NOT be overwritten or redesigned"). Rejected.
- **Query-param/theme toggle on the same routes.** Couples the two experiences, risks regressions
  in Original journeys, and complicates rollback. Rejected in favour of hard route isolation.

## Consequences

- **Positive:** Original experience provably unchanged; instant flag-based rollback; no new Azure
  spend; one build/deploy pipeline; shared AI/clinical logic stays DRY.
- **Negative / trade-offs:** Larger JS bundle (extra routes); some intentional UI duplication
  between shells; synthetic demo data must be explicitly labelled to avoid implying real analytics.
- **Follow-ups:** If v2 becomes the default, a future ADR can flip the selector default and,
  optionally, persist v2 cases to PostgreSQL (new migration) — out of scope here.
