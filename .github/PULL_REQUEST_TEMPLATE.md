<!--
Phoenix AI pull request template.
The Architecture Impact section is MANDATORY. See docs/architecture/current-architecture.md
and the architecture-first change policy in .github/copilot-instructions.md / AGENTS.md.
-->

## Summary

<!-- What does this PR change and why? -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation only
- [ ] Infrastructure / deployment
- [ ] Refactor (no behaviour change)

## Architecture Impact

- [ ] This PR changes architecture (components, integrations, data/identity/storage/observability
      strategy, or the Azure resource footprint).
- [ ] This PR does **not** change architecture.

**Impact level:** NONE / LOW / MEDIUM / HIGH / MAJOR

### Current Architecture Reviewed

- [ ] I read [`docs/architecture/current-architecture.md`](../docs/architecture/current-architecture.md)
      and the relevant diagram(s).
- [ ] I located the affected components/integrations by their stable IDs in the inventories.

### Architecture Impact Assessment

<!-- Which Component IDs / Integration IDs are added, changed, or removed? Why?
     Is a new ADR required? Reference it here. -->

### Architecture Documentation (required if this PR changes architecture)

- [ ] Updated `docs/architecture/current-architecture.md`.
- [ ] Updated the affected `docs/architecture/diagrams/*.mmd`.
- [ ] Updated `component-inventory.md` / `integration-inventory.md` as needed.
- [ ] Updated `azure-resource-map.md` (if the Azure footprint changed).
- [ ] Bumped `docs/architecture/ARCHITECTURE_VERSION` and added an `ARCHITECTURE_CHANGELOG.md` entry.
- [ ] Added a `docs/architecture/changes/CHANGE-YYYYMMDD-*.md` record.
- [ ] Added/updated an ADR under `docs/architecture/decisions/` (if the decision is significant).

## Responsible AI Impact

- [ ] This PR changes AI behaviour, prompts, models, confidence/limitation handling, human oversight,
      transparency, telemetry, or any Responsible AI control.
- [ ] This PR does **not** change any Responsible AI control.

### Responsible AI Assessment (required if this PR changes AI behaviour or a control)

- [ ] I reviewed the affected control(s) by ID in
      [`nextjs_space/lib/rai/controls.ts`](../nextjs_space/lib/rai/controls.ts) and
      [`docs/rai/rai-implementation-inventory.md`](../docs/rai/rai-implementation-inventory.md).
- [ ] Control status (Active / Partial / Planned) is accurate and not overstated.
- [ ] Every claim is evidenced by code and/or tests — no "safe / bias-free / certified / approved"
      language without independent evidence.
- [ ] Confidence, limitations and AI-generated labelling remain truthful and visible.
- [ ] RAI tests updated/passing (`npm run test:rai`); evaluation impact considered.
- [ ] Any new limitation is recorded in [`docs/rai/known-limitations.md`](../docs/rai/known-limitations.md).

## Before

<!-- Relevant AS-IS state (components/integrations/resources) prior to this change. -->

## After

<!-- The new state after this change. -->

## Validation

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Tests pass (unit / integration / e2e / api as applicable)
- [ ] Mermaid diagrams validate
- [ ] `scripts/validate-architecture` reports no drift
- [ ] No secrets committed; Phoenix AI logo and branding unchanged
- [ ] Responsible AI controls remain accurately represented (`npm run test:rai` passes)

## Notes

<!-- Anything reviewers should know. -->
