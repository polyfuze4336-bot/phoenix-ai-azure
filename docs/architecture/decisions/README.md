# Architecture Decision Records (ADRs)

Architecture Decision Records capture **significant** architectural decisions for Phoenix AI,
their context, and their consequences. ADRs are part of the source code and are immutable once
accepted — to change a decision, add a new ADR that supersedes the old one.

## When to write an ADR

Write an ADR when a change:

- Introduces, removes, or replaces a component, service, or external integration.
- Changes how components communicate (protocol, auth, data contract).
- Alters the data model, storage, identity, or observability strategy.
- Changes the deployment topology or Azure resource footprint.
- Establishes a cross-cutting policy (e.g. this governance framework).

Trivial changes (copy edits, dependency patch bumps, non-structural refactors) do **not** need an ADR.

## Process

1. Copy the [template](#template) into a new file named `ADR-XXXX-short-description.md`
   (zero-padded, next sequential number).
2. Set **Status** to `Proposed`.
3. Fill in every section. Reference the affected components/integrations by their stable IDs
   from [../component-inventory.md](../component-inventory.md) and
   [../integration-inventory.md](../integration-inventory.md).
4. Update the current architecture docs and diagrams in the **same** change.
5. Before pushing the implementing commit, set **Status** to `Accepted` (or `Rejected`).
6. When a later ADR overturns this one, set **Status** to `Superseded by ADR-YYYY`.

## Index

| ADR | Title | Status | Date |
| --- | --- | --- | --- |
| [ADR-0001](./ADR-0001-use-nextjs-app-service.md) | Host Phoenix AI as Next.js on Azure App Service | Superseded by ADR-0007 | 2024 |
| [ADR-0002](./ADR-0002-architecture-first-governance.md) | Establish architecture-first governance | Accepted; CI enforcement superseded by ADR-0012 | 2024 |
| [ADR-0003](./ADR-0003-staged-wound-analysis-pipeline.md) | Staged multimodal wound-analysis pipeline | Accepted | 2026-08-07 |
| [ADR-0004](./ADR-0004-dual-experience-v2.md) | Additive dual-experience Phoenix AI v2.0 | Superseded by ADR-0010 | 2026-08-07 |
| [ADR-0005](./ADR-0005-ai-assurance-layer.md) | Responsible AI assurance layer from a code-based control register | Accepted | 2026-08-07 |
| [ADR-0006](./ADR-0006-customer-owned-azure-ai.md) | Provision a customer-owned Azure AI account per environment | Accepted | 2026-08-09 |
| [ADR-0007](./ADR-0007-use-azure-container-apps.md) | Host Phoenix AI on Azure Container Apps Consumption | Accepted | 2026-08-09 |
| [ADR-0008](./ADR-0008-v2-default-public-entry.md) | Make v2.0 the default public entry | Superseded by ADR-0010 | 2026-08-14 |
| [ADR-0009](./ADR-0009-authorize-retained-analysis-records.md) | Authorize access to retained analysis records | Accepted | 2026-08-14 |
| [ADR-0010](./ADR-0010-restore-original-only-experience.md) | Restore the Original-only Phoenix AI experience | Accepted | 2026-08-15 |
| [ADR-0011](./ADR-0011-single-experience-global-language.md) | One Phoenix AI experience with global language enforcement | Accepted | 2026-08-15 |
| [ADR-0012](./ADR-0012-direct-main-prototype-workflow.md) | Direct-main rapid-prototype workflow | Accepted | 2026-08-16 |

## Template

```markdown
# ADR-XXXX: <Title>

- **Status:** Proposed | Accepted | Rejected | Superseded by ADR-YYYY
- **Date:** YYYY-MM-DD
- **Deciders:** <names/roles>
- **Related components:** <Component IDs>
- **Related integrations:** <Integration IDs>

## Context
What problem or force prompts this decision? What is the current architecture
(reference current-architecture.md and the relevant diagram)?

## Current Architecture
The specific AS-IS elements affected, with their status labels.

## Decision
The decision, stated plainly.

## Alternatives Considered
Options evaluated and why they were not chosen.

## Rationale
Why this option wins.

## Architecture Impact
New/changed/removed components, integrations, and diagrams. New architecture version
(see ../ARCHITECTURE_VERSION and ../ARCHITECTURE_CHANGELOG.md).

## Security Impact
Identity, secrets, data protection, attack surface.

## Operational Impact
Deployment, monitoring, alerting, runbooks.

## Cost Impact
Azure resource cost implications.

## Risks
Known risks and mitigations.

## Rollback
How to reverse this decision if needed.

## Validation
How the decision was validated (build, tests, checks).
```
