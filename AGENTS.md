# AGENTS.md — Phoenix AI

Guidance for AI agents and human contributors working in this repository. Phoenix AI is a
**faithful parity migration** of the Phoenix AI — Burn & Wound Care Assessment Tool from
Abacus.AI to Microsoft Azure. The detailed guardrails live in
[`.github/copilot-instructions.md`](./.github/copilot-instructions.md); this file summarizes the
prototype documentation and Responsible AI maintenance practices.

## Prime directive

Preserve the original visible user experience and behaviour. This is a migration, not a redesign.
Never replace or alter the Phoenix AI logo (`nextjs_space/public/logo.png`) or branding. Never
commit secrets.

## Architecture maintenance (prototype mode)

Keep architecture documentation reasonably current in the same task. No pre-change approval, pull
request, reviewer signoff, or manual deployment approval is required.

Before implementing any change that touches components, integrations, data/identity/storage/
observability strategy, or the Azure resource footprint, follow these steps in order:

1. **Understand** — read [`docs/architecture/current-architecture.md`](./docs/architecture/current-architecture.md)
   and the relevant diagram(s) in `docs/architecture/diagrams/`.
2. **Locate** the affected components/integrations by their stable IDs in
   [`component-inventory.md`](./docs/architecture/component-inventory.md) and
   [`integration-inventory.md`](./docs/architecture/integration-inventory.md).
3. **Assess impact** — impact level (NONE / LOW / MEDIUM / HIGH / MAJOR) and whether a new
   [ADR](./docs/architecture/decisions/README.md) is required.
4. **Document in the task** — update `current-architecture.md`, affected `.mmd` diagrams,
   inventories, and [`azure-resource-map.md`](./docs/architecture/azure-resource-map.md) where
   implementation changes them. Bump [`ARCHITECTURE_VERSION`](./docs/architecture/ARCHITECTURE_VERSION) and add an
   entry to [`ARCHITECTURE_CHANGELOG.md`](./docs/architecture/ARCHITECTURE_CHANGELOG.md).
5. **Record** — add a `docs/architecture/changes/CHANGE-YYYYMMDD-*.md` record; add/accept an ADR
   for significant decisions.
6. **Implement** the code change consistent with the documented architecture.
7. **Validate proportionately** — typecheck, build, relevant tests, Mermaid validation, and
   `scripts/validate-architecture` when architecture files change.

End every architecture-impacting task with an **Architecture Review** block: impact level, version
before/after, files reviewed/changed, ADR reference, change record, and validation PASS/FAIL. Local
drift validation is a local maintenance aid and does not gate direct-main deployment.

## Responsible AI maintenance

Keep AI behaviour, prompts, telemetry, controls, evidence, and limitations honestly synchronized in
the same task. No separate Responsible AI approval or reviewer signoff is required.

1. **Understand** — read [`docs/rai/README.md`](./docs/rai/README.md) and the relevant document.
2. **Locate** the affected control(s) by stable ID in
   [`nextjs_space/lib/rai/controls.ts`](./nextjs_space/lib/rai/controls.ts) (source of truth) and
   [`docs/rai/rai-implementation-inventory.md`](./docs/rai/rai-implementation-inventory.md).
3. **Assess honestly** — status is **Active**, **Partial** or **Planned** based on what the code does.
   Never mark a control Active if it is only documented.
4. **Evidence** — every Active/Partial control points to real code and, where practical, a test under
   `nextjs_space/tests/rai/`. Keep `npm run test:rai` green.
5. **Document** — update the affected `docs/rai/*` file(s), the control matrix, and
   `known-limitations.md` / `rai-roadmap.md` as needed.
6. **Never fabricate assurance** — no cartoon shields, gamified trust scores, fake certifications, or
   claims like "100% safe", "bias free", "hallucination free", "clinically certified" or "regulatory
   approved" unless independently evidenced.
7. **Implement** consistent with the documented, evidenced control.
8. **Validate** — run `npm run test:rai` and the relevant evaluation harness when analysis behaviour
   changes.

End every RAI-impacting task with a **Responsible AI Review** block: controls added/changed (by ID),
status before/after, evidence (code + tests), any new limitation, and validation PASS/FAIL.

## Build & test

- App source is in `nextjs_space/`. Use `npm install --legacy-peer-deps` (pre-existing peer
  conflict). `npm run build` must pass.
- Work in small, reviewable commits using Conventional Commit messages.
- Push reviewed prototype changes directly to `main`; pull requests remain optional.

## Key architecture paths

- Authoritative AS-IS architecture: [`docs/architecture/current-architecture.md`](./docs/architecture/current-architecture.md)
- Diagrams: `docs/architecture/diagrams/*.mmd`
- Inventories: `component-inventory.md`, `integration-inventory.md`, `azure-resource-map.md`
- Decisions: [`docs/architecture/decisions/`](./docs/architecture/decisions/)
- Change records: [`docs/architecture/changes/`](./docs/architecture/changes/)

## Key Responsible AI paths

- Control register (source of truth): [`nextjs_space/lib/rai/controls.ts`](./nextjs_space/lib/rai/controls.ts)
- RAI documentation: [`docs/rai/`](./docs/rai/) — start at [`README.md`](./docs/rai/README.md)
- RAI tests: `nextjs_space/tests/rai/` (`npm run test:rai`)
- Current assurance review surface: governed documentation and automated test evidence
