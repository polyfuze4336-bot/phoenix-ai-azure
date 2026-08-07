# Copilot / AI assistant instructions — Phoenix AI (Azure migration)

This repository is a **faithful parity migration** of the Phoenix AI — Burn & Wound Care
Assessment Tool from Abacus.AI to Microsoft Azure. Follow these guardrails for any change.

## Prime directive

**Preserve the original visible user experience and behaviour.** This is a migration, not a
redesign. Do not improve, modernise, reinterpret or redesign the interface unless an
incompatibility prevents faithful migration. Where the original is unclear, preserve the
visible UX and **document the assumption** in `docs/migration/MIGRATION.md`.

## Must preserve (do not alter)

- Phoenix AI name and branding.
- The **original Phoenix AI logo** at `nextjs_space/public/logo.png` — including its
  proportions, placement and visual treatment.
- Page and navigation structure, colour palette (primary `#8B0000`), typography hierarchy,
  spacing, border radii, shadows, cards, buttons, forms, icons, charts, animations,
  responsive behaviour, clinical terminology, user journeys, and mock/seeded data behaviour.

## Never do

- Never replace the logo with an emoji, a generic flame icon, a Microsoft icon, a Lucide icon,
  a text-only wordmark, an AI-generated approximation, or a newly designed Phoenix symbol.
- Never commit secrets — credentials, connection strings, API keys, certificates, access
  tokens. Use `.env` (git-ignored) locally and Azure Key Vault / app settings in the cloud.
- Never make destructive changes to the imported source under `nextjs_space/`.
- Never introduce a deployed-runtime dependency on a developer laptop, `localhost`, a local
  database, or a local file share. Local deps are for development/testing only.

## Architecture facts

- Stack: Next.js 14 (App Router), React 18, TypeScript 5, Tailwind + shadcn/ui. Node 22.
- The **only live backend dependency** is the LLM used by `app/api/*` routes
  (`analyze-wound`, `hcp-chat`, `community-chat`, `community-analyze`). Migrate it to
  **Azure OpenAI** (vision, OpenAI-compatible, streaming) — preserve request/response shape.
- Prisma/PostgreSQL and AWS S3 helpers exist but are **not wired into the UI**; do not assume
  a database or object store is required for parity.
- Auth is **mock/client-side** (`sessionStorage`, hardcoded users in `app/hcp-login/page.tsx`).

## Workflow

- Work in **small, reviewable commits**; use Conventional Commit messages.
- `npm install --legacy-peer-deps` (pre-existing peer conflict). `npm run build` must pass.
- Prefer **reuse** of existing Azure resources; new resource group only for what can't be reused.
- At the end of every migration step: run checks, report added/modified/deleted files, report
  tests, list unresolved issues, commit, and update `docs/migration/MIGRATION.md`.

## ARCHITECTURE-FIRST CHANGE POLICY (mandatory)

**NO MATERIAL CHANGE MAY BE IMPLEMENTED UNTIL THE CURRENT ARCHITECTURE IS UNDERSTOOD, DOCUMENTED
AND IMPACT-ASSESSED. Architecture documentation is part of the source code and must remain
synchronized with implementation.**

Before implementing any change that touches components, integrations, data/identity/storage/
observability strategy, or the Azure resource footprint, follow these steps in order:

1. **Understand** the current architecture — read
   [`docs/architecture/current-architecture.md`](../docs/architecture/current-architecture.md)
   and the relevant diagram(s) in `docs/architecture/diagrams/`.
2. **Locate** the affected components/integrations by their stable IDs in
   [`component-inventory.md`](../docs/architecture/component-inventory.md) and
   [`integration-inventory.md`](../docs/architecture/integration-inventory.md).
3. **Assess impact** — determine the impact level (NONE / LOW / MEDIUM / HIGH / MAJOR) and whether
   a new [ADR](../docs/architecture/decisions/README.md) is required.
4. **Document first** — update `current-architecture.md`, the affected `.mmd` diagrams, the
   inventories, and `azure-resource-map.md` in the SAME change. Bump
   [`ARCHITECTURE_VERSION`](../docs/architecture/ARCHITECTURE_VERSION) and add an entry to
   [`ARCHITECTURE_CHANGELOG.md`](../docs/architecture/ARCHITECTURE_CHANGELOG.md).
5. **Record** — add a `docs/architecture/changes/CHANGE-YYYYMMDD-*.md` record for
   architecture-impacting changes; add/accept an ADR when the decision is significant.
6. **Implement** the code change, keeping it consistent with the documented architecture.
7. **Validate** — run typecheck, build, tests, Mermaid validation, and
   `scripts/validate-architecture`. **STOP if documentation lags implementation** — do not open a
   PR until docs and code agree.

End every architecture-impacting task with an **Architecture Review** block: impact level,
version before/after, files reviewed/changed, ADR reference, change record, and validation
PASS/FAIL. The `architecture-governance` CI workflow enforces docs-sync on pull requests.

## Key paths

- App source: `nextjs_space/`
- Migration audit trail: `docs/migration/MIGRATION.md`
- **Authoritative current architecture: `docs/architecture/current-architecture.md`**
- Component / integration inventories: `docs/architecture/component-inventory.md`,
  `docs/architecture/integration-inventory.md`
- Architecture decisions: `docs/architecture/decisions/`
- Target architecture (design intent): `docs/architecture/ARCHITECTURE.md`
- Test strategy: `docs/testing/TEST-STRATEGY.md`
