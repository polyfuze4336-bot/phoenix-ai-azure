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
   **STOP if documentation lags implementation** — do not push `main` until docs and code agree.

End every architecture-impacting task with an **Architecture Review** block: impact level, version
before/after, files reviewed/changed, ADR reference, change record, and validation PASS/FAIL. Local
drift validation is mandatory; GitHub does not enforce documentation synchronization for this
rapid-prototype repository.

## RESPONSIBLE AI CHANGE POLICY (mandatory)

**AI behaviour is a governed surface. No change to AI behaviour, prompts, models, confidence/limitation
handling, human oversight, transparency, telemetry, or any Responsible AI control may be implemented
without keeping the RAI control register and its documentation/evidence synchronized.**

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
8. **Validate** — run `npm run test:rai` (and the evaluation harness if analysis behaviour changed);
   confirm `/v2/hcp/ai-assurance` still reflects reality.

End every RAI-impacting task with a **Responsible AI Review** block: controls added/changed (by ID),
status before/after, evidence (code + tests), any new limitation, and validation PASS/FAIL.

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

## Key Responsible AI paths

- Control register (source of truth): [`nextjs_space/lib/rai/controls.ts`](./nextjs_space/lib/rai/controls.ts)
- RAI documentation: [`docs/rai/`](./docs/rai/) — start at [`README.md`](./docs/rai/README.md)
- RAI tests: `nextjs_space/tests/rai/` (`npm run test:rai`)
- In-product surface: `/v2/hcp/ai-assurance`
