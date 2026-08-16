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
- AI routes use Azure AI/OpenAI-compatible vision and streaming through managed identity.
- PostgreSQL stores authorized HCP analysis history; Blob Storage remains optional and unwired.
- Authentication defaults to server-verified demo sessions; Entra remains opt-in.

## Workflow

- Work in **small, reviewable commits**; use Conventional Commit messages.
- `npm install --legacy-peer-deps` (pre-existing peer conflict). `npm run build` must pass.
- Prefer **reuse** of existing Azure resources; new resource group only for what can't be reused.
- At the end of every migration step: run checks, report added/modified/deleted files, report
  tests, list unresolved issues, commit, and update `docs/migration/MIGRATION.md`.
- Prototype loop: open Codespace -> edit with Copilot -> test locally -> commit -> push directly
   to `main` -> `.github/workflows/deploy.yml` updates Azure automatically.
- Pull requests, reviewer signoff, architecture approval, RAI approval, and manual deployment
   approval are not required for this prototype.

## Architecture maintenance (prototype mode)

Keep architecture documentation reasonably current as part of the same development task. There is
no pre-change approval, pull-request, reviewer, or deployment gate.

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
4. **Document in the task** — update `current-architecture.md`, affected `.mmd` diagrams,
   inventories, and `azure-resource-map.md` where the implementation changes them. Bump
   [`ARCHITECTURE_VERSION`](../docs/architecture/ARCHITECTURE_VERSION) and add an entry to
   [`ARCHITECTURE_CHANGELOG.md`](../docs/architecture/ARCHITECTURE_CHANGELOG.md).
5. **Record** — add a `docs/architecture/changes/CHANGE-YYYYMMDD-*.md` record for
   architecture-impacting changes; add/accept an ADR when the decision is significant.
6. **Implement** the code change, keeping it consistent with the documented architecture.
7. **Validate proportionately** — run relevant typecheck, build, tests, Mermaid validation, and
   `scripts/validate-architecture` when architecture files change.

End every architecture-impacting task with an **Architecture Review** block: impact level,
version before/after, files reviewed/changed, ADR reference, change record, and validation
PASS/FAIL. The local drift validator is a useful maintenance aid, not a GitHub deployment gate.

## Responsible AI maintenance

AI behaviour is a governed surface. Keep the RAI control register, documentation, and evidence
honestly synchronized in the same task. No separate approval or reviewer signoff is required.

When a change touches AI behaviour or a Responsible AI control, follow these steps in order:

1. **Understand** — read [`docs/rai/README.md`](../docs/rai/README.md) and the relevant document
   (e.g. `clinical-safety.md`, `human-oversight.md`, `transparency.md`, `fairness-and-skin-tone.md`).
2. **Locate** the affected control(s) by their stable IDs in the single source of truth
   [`nextjs_space/lib/rai/controls.ts`](../nextjs_space/lib/rai/controls.ts) and in
   [`docs/rai/rai-implementation-inventory.md`](../docs/rai/rai-implementation-inventory.md).
3. **Assess honestly** — set the control status to **Active**, **Partial** or **Planned** based on what
   the code actually does. Never mark a control Active if it is only documented.
4. **Evidence** — every Active/Partial control must point to real code and, where practical, a test.
   Add or update tests under `nextjs_space/tests/rai/` and keep `npm run test:rai` green.
5. **Document** — update the affected `docs/rai/*` file(s), the control matrix, and
   `known-limitations.md` / `rai-roadmap.md` if a limitation or plan changed.
6. **Never fabricate assurance** — no cartoon shields, gamified trust scores, fake certifications, or
   claims like "100% safe", "bias free", "hallucination free", "clinically certified" or "regulatory
   approved" unless independently evidenced. Keep AI-generated labelling and limitations truthful and
   visible.
7. **Implement** the change consistent with the documented, evidenced control.
8. **Validate** — run `npm run test:rai` and the relevant evaluation harness when analysis behaviour
   changes.

End every RAI-impacting task with a concise **Responsible AI Review**: controls changed, status,
evidence, limitations, and validation result.

## Key paths

- App source: `nextjs_space/`
- Migration audit trail: `docs/migration/MIGRATION.md`
- **Authoritative current architecture: `docs/architecture/current-architecture.md`**
- Component / integration inventories: `docs/architecture/component-inventory.md`,
  `docs/architecture/integration-inventory.md`
- Architecture decisions: `docs/architecture/decisions/`
- Target architecture (design intent): `docs/architecture/ARCHITECTURE.md`
- Test strategy: `docs/testing/TEST-STRATEGY.md`
- **Responsible AI controls & evidence: `docs/rai/` (source of truth `nextjs_space/lib/rai/controls.ts`)**
