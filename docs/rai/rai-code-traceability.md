# RAI code traceability

Direct map from each control to the source that implements it. The machine-readable source of truth is
[`lib/rai/controls.ts`](../../nextjs_space/lib/rai/controls.ts) (each entry carries its own `evidence`
and `tests`).

## Core RAI libraries (added by this change)
| Path | Responsibility |
| --- | --- |
| [`nextjs_space/lib/rai/controls.ts`](../../nextjs_space/lib/rai/controls.ts) | Control register + assurance stages (source of truth) |
| [`nextjs_space/lib/rai/governance.ts`](../../nextjs_space/lib/rai/governance.ts) | Governance snapshot (model, versions, identity, posture) |
| [`nextjs_space/lib/ai/prompts/versions.ts`](../../nextjs_space/lib/ai/prompts/versions.ts) | Prompt / pipeline / schema version constants |
| [`nextjs_space/lib/ai/analysis/metadata.ts`](../../nextjs_space/lib/ai/analysis/metadata.ts) | Analysis metadata envelope + review status |

## Pre-existing implementation (surfaced, not created here)
| Path | Controls |
| --- | --- |
| `lib/ai/analysis/pipeline.ts` | RAI-SAFE-002/005/006/007/008/009/011, RAI-FAIR-001, RAI-REL-001, RAI-TRANS-002 |
| `lib/ai/schemas/burn-wound-analysis.ts` | RAI-SAFE-004, RAI-TRANS-001 |
| `lib/ai/validation/image-input.ts`, `app/api/analyze-wound/route.ts`, `app/api/community-analyze/route.ts` | RAI-SAFE-001, RAI-PRIV-006 |
| `lib/ai/validation/wound-analysis-schema.ts`, retained analysis clients | RAI-SAFE-003/010 |
| `lib/ai/prompts/*.ts` | RAI-FAIR-002, prompt guardrails |
| `lib/clinical/parkland.ts`, `lib/clinical/tbsa.ts` | RAI-SAFE-006/011 |
| `lib/telemetry/*.ts`, `lib/ai/telemetry.ts` | RAI-PRIV-003 |
| `lib/ai/azure-credential.ts` | RAI-PRIV-001 |
| `lib/analysis/history.ts`, `prisma/schema.prisma` | RAI-ACCT-002 |
| `lib/ai/model-config.ts` | RAI-ACCT-005 |
| `tests/evaluation/burn-wound/*` | RAI-ACCT-004 |
| `lib/i18n.ts`, `components/language-provider.tsx`, `components/language-toggle.tsx` | RAI-INCL-001 |
| `lib/ai/language.ts`, `lib/ai/analysis/pipeline.ts`, all four AI API routes | RAI-INCL-003 |

## Tests
| Path | Covers |
| --- | --- |
| [`nextjs_space/tests/rai/rai-safety.test.ts`](../../nextjs_space/tests/rai/rai-safety.test.ts) | Deterministic safety rules |
| [`nextjs_space/tests/rai/rai-unsupported-inference.test.ts`](../../nextjs_space/tests/rai/rai-unsupported-inference.test.ts) | Prompt guardrails |
| [`nextjs_space/tests/rai/rai-metadata.test.ts`](../../nextjs_space/tests/rai/rai-metadata.test.ts) | Metadata + versioning + review status |
| [`nextjs_space/tests/rai/rai-telemetry.test.ts`](../../nextjs_space/tests/rai/rai-telemetry.test.ts) | Privacy-safe telemetry |
| [`nextjs_space/tests/rai/rai-controls.test.ts`](../../nextjs_space/tests/rai/rai-controls.test.ts) | Control-register integrity |
| [`nextjs_space/tests/unit/ai-language.test.ts`](../../nextjs_space/tests/unit/ai-language.test.ts) | Strict language instructions, value-only JSON detection, and one-rewrite ceiling |
| [`nextjs_space/tests/unit/image-input.test.ts`](../../nextjs_space/tests/unit/image-input.test.ts) | Model-compatible image MIME, data-URL normalization, base64, signature, and size validation |
| [`nextjs_space/tests/api/routes.spec.ts`](../../nextjs_space/tests/api/routes.spec.ts) | HTTP safe-failure behavior before model invocation |
