# Part 16 — Original vs Current Testing

> Comparison of automated testing before and after the migration. Evidence: `package.json`
> scripts, `tests/*`, Playwright configs, and recorded results in
> [final-migration-audit.md](../migration/final-migration-audit.md).

## 1. Original state

The Abacus.AI source contained **no automated tests**, no test runner, and no CI test stage.

## 2. Current test suites (added)

| Suite | Runner | Location | Recorded count |
| --- | --- | --- | --- |
| Type check | `tsc --noEmit` | whole app | 0 errors |
| Lint | `next lint` | whole app | 0 errors / 0 warnings |
| Unit | `tsx --test` | `tests/unit/*.test.ts` | 76 |
| Integration | `tsx --test` (dotenv) | `tests/integration/*.integration.test.ts` | 14 |
| E2E | Playwright | `tests/e2e/*` | 17 (3 journeys + 14 clickable-control guards) |
| API | Playwright | `tests/api/routes.spec.ts` | 14 |
| Network | Playwright | `tests/network/no-abacus.spec.ts` | 1 |
| Visual parity | Playwright + pixelmatch | `tests/visual/*` | 141/143 pixel-identical |
| Build | `next build` (standalone) | — | 23 routes compiled |
| IaC | `bicep build` | `infra/` | 0 warnings |

> Counts are the totals recorded during the final migration audit; they reflect the suite as
> committed at HEAD (`4c47623`).

## 3. What each suite protects

| Concern | Suite(s) |
| --- | --- |
| Clinical calculation correctness (TBSA, Parkland) | unit (`parkland.test.ts`, `tbsa.test.ts`) |
| AI response parsing / schema | unit (`ai-parsing.test.ts`, `wound-schema.test.ts`, `image-input.test.ts`) |
| Auth logic | unit (`auth.test.ts`), integration (`health`) |
| DB & storage wiring | integration (`db`, `storage`, `health`) |
| User journeys | e2e (`public-landing`, `hcp-journey`, `community-journey`) |
| Interactive-control behaviour | e2e (`clickable-controls`) |
| API contracts | api (`routes.spec.ts`) |
| No Abacus/localhost leakage | network (`no-abacus.spec.ts`) |
| Visual parity with the original | visual (pixelmatch) |
| EN/BM localisation | unit (`language.test.ts`) |
| Config safety | unit (`config.test.ts`) |

## 4. CI integration

- Original: `ci.yml` added in the migration repo (install + build).
- Current: `ci.yml` runs build/typecheck/lint/test; deployment pipelines
  (`deploy-demo.yml`, `deploy-dev.yml`, `infrastructure.yml`, `db-migrate.yml`) use GitHub OIDC.

## 5. Net change

| Metric | Original | Current |
| --- | --- | --- |
| Test suites | 0 | 8 (+ typecheck/lint/build/IaC gates) |
| Test runners | none | `tsx --test`, Playwright |
| CI test stage | none | yes |

## 6. Honest note on coverage

The suites provide a regression safety net for parity, calculations, API contracts, and visual
fidelity. They are **not** a substitute for clinical validation or load/security testing, which
are out of scope for this migration. See [tradeoffs-and-limitations.md](../migration/tradeoffs-and-limitations.md).
