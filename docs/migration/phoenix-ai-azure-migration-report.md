# Phoenix AI — Source-to-Azure Migration Report (Consolidated)

> Part 21 of the migration documentation set. This is the **single entry point** to the complete,
> evidence-based comparison of Phoenix AI across three reference points:
> 1. the original source imported from **Abacus.AI** (git tag `abacus-source-baseline` = `d200b5a`),
> 2. the current **Azure-migrated** codebase (branch `migration/azure-port`, HEAD `4c47623`),
> 3. the **live Azure** deployment (`rg-phoenixai-demo`, `southeastasia`).
>
> All figures are derived from git, the working tree, and the running Azure environment — not from
> memory, assumptions, or commit messages alone. No application code was changed to produce it.

## Headline

Phoenix AI was moved from Abacus.AI to Microsoft Azure as a **faithful parity migration**. The
visible product is preserved (hash-verified logo, 141/143 pixel-identical screens); the backend was
re-platformed onto Azure (managed-identity AI + storage, PostgreSQL, telemetry, IaC, CI/CD) and one
additive post-parity feature (HCP analysis history) was introduced. This is a **demonstration
parity migration with an operational foundation — not a clinically validated or production
deployment.**

## Key evidence

| Fact | Value |
| --- | --- |
| Baseline | tag `abacus-source-baseline` = `d200b5a00cc61dc171ac29171d54c155335f4d35` |
| HEAD | `4c47623` (branch `migration/azure-port`, clean tree) |
| Commits since baseline | 24 |
| Files changed | 574 (A 545 / M 27 / D 2) |
| Lines | +20,827 / −1,713 (~13,539 hand-written excl. PNGs + lockfile) |
| Logo parity | git blob `370601e`, 346,691 bytes — identical baseline/HEAD/working; SHA-256 `dfb40a3e…917d8241` |
| Deps | +4 prod, +5 dev; −2 AWS |
| Azure resources | 12 in `rg-phoenixai-demo` (`southeastasia`) |
| Live health | `/api/health/ready` all `ok` (AI identity, PostgreSQL 3 ms, Blob) |
| Telemetry | 298 requests / 6 events / **0** exceptions (2 days) |
| Visual parity | 141 / 143 pixel-identical |

## The 24 parts

| # | Document |
| --- | --- |
| 1 | [source-comparison-baseline.md](source-comparison-baseline.md) |
| 2 | [change-inventory.md](change-inventory.md) |
| 3 | [additions.md](additions.md) |
| 4 | [modifications-and-enhancements.md](modifications-and-enhancements.md) |
| 5 | [replacements.md](replacements.md) |
| 6 | [removals.md](removals.md) |
| 7 | [retained-functionality.md](retained-functionality.md) |
| 8 | [migration-benefits.md](migration-benefits.md) |
| 9 | [../architecture/original-vs-azure-architecture.md](../architecture/original-vs-azure-architecture.md) |
| 10 | [file-change-summary.md](file-change-summary.md) |
| 11 | [dependency-changes.md](dependency-changes.md) |
| 12 | [configuration-changes.md](configuration-changes.md) |
| 13 | [data-model-changes.md](data-model-changes.md) |
| 14 | [api-changes.md](api-changes.md) |
| 15 | [ui-change-report.md](ui-change-report.md) |
| 16 | [../testing/original-vs-current-testing.md](../testing/original-vs-current-testing.md) |
| 17 | [deployment-and-operations-changes.md](deployment-and-operations-changes.md) |
| 18 | [tradeoffs-and-limitations.md](tradeoffs-and-limitations.md) |
| 19 | [executive-migration-summary.md](executive-migration-summary.md) |
| 20 | [../../CHANGELOG.md](../../CHANGELOG.md) (Unreleased → Added) |
| 21 | This report |
| 22 | [Change-type summary table](#change-type-summary-table) (below) |
| 23 | [benefit-traceability-matrix.md](benefit-traceability-matrix.md) |
| 24 | [documentation-validation-report.md](documentation-validation-report.md) |

## Change-type summary table

| Area | Original | Azure | Change type |
| --- | --- | --- | --- |
| AI model backend | Abacus endpoint + API key | Azure OpenAI/Foundry + managed identity | Replaced |
| AI integration | inline in routes | `lib/ai/*` provider layer | Added / Modified |
| Object storage | AWS S3 helpers (unused) | Azure Blob (managed identity) | Replaced |
| AWS SDK deps | present | removed | Removed |
| Database | Prisma schema (unused) | Azure PostgreSQL + `AnalysisRecord` | Modified / Partially implemented |
| Auth | client mock | demo (default) + Entra opt-in + session | Enhanced / Added |
| Observability | none | App Insights + health + alerts | Added |
| IaC | none | Bicep (`infra/`) | Added |
| CI/CD | none | GitHub OIDC workflows | Added |
| Tests | none | 6 suites + gates | Added |
| Logo & branding | canonical | byte-identical | Retained unchanged |
| UI/UX & journeys | original | preserved (141/143) | Retained unchanged |
| HCP history page | n/a | `/hcp/history` | Added |
| Build/config | Abacus assumptions | standalone + Azure config | Modified |
| `.env` vars | Abacus + AWS | Azure AI/Storage/Auth/Telemetry | Replaced |

## How to read this set

- Start with the [executive summary](executive-migration-summary.md) for a plain-language overview.
- Use [change-inventory.md](change-inventory.md) for the one-table map, then drill into the
  add/modify/replace/remove/retain parts.
- Consult [tradeoffs-and-limitations.md](tradeoffs-and-limitations.md) and
  [documentation-validation-report.md](documentation-validation-report.md) before drawing
  conclusions about readiness.

## Verdict

Parity migration objectives are met and evidenced. The system is suitable for **demonstration**.
It is **not** clinically validated, not enterprise-authenticated by default, and not configured for
multi-region resilience — see Part 18 for the full limitation record.
