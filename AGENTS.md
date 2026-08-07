# AGENTS.md — Phoenix AI

Guidance for AI agents and human contributors working in this repository. Phoenix AI is a
**faithful parity migration** of the Phoenix AI — Burn & Wound Care Assessment Tool from
Abacus.AI to Microsoft Azure. The detailed guardrails live in
[`.github/copilot-instructions.md`](./.github/copilot-instructions.md); this file restates the
**mandatory architecture-first change policy**.

## Prime directive

Preserve the original visible user experience and behaviour. This is a migration, not a redesign.
Never replace or alter the Phoenix AI logo (`nextjs_space/public/logo.png`) or branding. Never
commit secrets.

## ARCHITECTURE-FIRST CHANGE POLICY (mandatory)

**NO MATERIAL CHANGE MAY BE IMPLEMENTED UNTIL THE CURRENT ARCHITECTURE IS UNDERSTOOD, DOCUMENTED
AND IMPACT-ASSESSED. Architecture documentation is part of the source code and must remain
synchronized with implementation.**

Before implementing any change that touches components, integrations, data/identity/storage/
observability strategy, or the Azure resource footprint, follow these steps in order:

1. **Understand** — read [`docs/architecture/current-architecture.md`](./docs/architecture/current-architecture.md)
   and the relevant diagram(s) in `docs/architecture/diagrams/`.
2. **Locate** the affected components/integrations by their stable IDs in
   [`component-inventory.md`](./docs/architecture/component-inventory.md) and
   [`integration-inventory.md`](./docs/architecture/integration-inventory.md).
3. **Assess impact** — impact level (NONE / LOW / MEDIUM / HIGH / MAJOR) and whether a new
   [ADR](./docs/architecture/decisions/README.md) is required.
4. **Document first** — update `current-architecture.md`, the affected `.mmd` diagrams, the
   inventories, and [`azure-resource-map.md`](./docs/architecture/azure-resource-map.md) in the
   SAME change. Bump [`ARCHITECTURE_VERSION`](./docs/architecture/ARCHITECTURE_VERSION) and add an
   entry to [`ARCHITECTURE_CHANGELOG.md`](./docs/architecture/ARCHITECTURE_CHANGELOG.md).
5. **Record** — add a `docs/architecture/changes/CHANGE-YYYYMMDD-*.md` record; add/accept an ADR
   for significant decisions.
6. **Implement** the code change consistent with the documented architecture.
7. **Validate** — typecheck, build, tests, Mermaid validation, and `scripts/validate-architecture`.
   **STOP if documentation lags implementation** — do not open a PR until docs and code agree.

End every architecture-impacting task with an **Architecture Review** block: impact level, version
before/after, files reviewed/changed, ADR reference, change record, and validation PASS/FAIL. The
`architecture-governance` CI workflow enforces documentation synchronization on pull requests.

## Build & test

- App source is in `nextjs_space/`. Use `npm install --legacy-peer-deps` (pre-existing peer
  conflict). `npm run build` must pass.
- Work in small, reviewable commits using Conventional Commit messages.

## Key architecture paths

- Authoritative AS-IS architecture: [`docs/architecture/current-architecture.md`](./docs/architecture/current-architecture.md)
- Diagrams: `docs/architecture/diagrams/*.mmd`
- Inventories: `component-inventory.md`, `integration-inventory.md`, `azure-resource-map.md`
- Decisions: [`docs/architecture/decisions/`](./docs/architecture/decisions/)
- Change records: [`docs/architecture/changes/`](./docs/architecture/changes/)
