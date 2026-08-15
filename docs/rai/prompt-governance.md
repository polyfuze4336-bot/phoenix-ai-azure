# Prompt governance

The staged clinical prompts are version-stamped and change-controlled.

## Version constants
Version identifiers live in
[`lib/ai/prompts/versions.ts`](../../nextjs_space/lib/ai/prompts/versions.ts):

| Constant | Prompt |
| --- | --- |
| `WOUND_VISUAL_OBSERVATION_PROMPT_VERSION` | Stage 1 — objective visual observation |
| `WOUND_CLINICAL_INTERPRETATION_PROMPT_VERSION` | Stage 2 — clinical interpretation |
| `WOUND_MANAGEMENT_PROMPT_VERSION` | Stage 3 — management + referral |
| `WOUND_ANALYSIS_CRITIC_PROMPT_VERSION` | Stage 4 — consistency / safety review |
| `HCP_WOUND_ANALYSIS_PROMPT_VERSION` | Single-pass fallback |
| `HCP_CHAT_PROMPT_VERSION` | HCP clinical chat |
| `COMMUNITY_WOUND_ANALYSIS_PROMPT_VERSION` | Community analysis + chat |
| `ANALYSIS_PIPELINE_VERSION` | Staged pipeline as a whole |
| `ANALYSIS_SCHEMA_VERSION` | Structured output schema |

## Recording
The staged prompt versions are aggregated into `STAGED_PROMPT_VERSIONS` and recorded with every
analysis via the metadata envelope
([`lib/ai/analysis/metadata.ts`](../../nextjs_space/lib/ai/analysis/metadata.ts)). The complete
envelope is retained for traceability but is not yet fully presented in the clinical interface.

## Output language
Every AI route must receive the canonical `en` or `ms` language, add the corresponding strict system
instruction, inspect completed output, and make no more than one rewrite request when the output is
confidently in the wrong language. Detection and telemetry must operate on language metadata only,
never prompts, transcripts, images, or clinical output.

This behaviour is implemented by
[`lib/ai/language.ts`](../../nextjs_space/lib/ai/language.ts), applied by all four AI API routes and
every staged analysis call, and evidenced by `RAI-INCL-003` tests in
[`tests/rai/rai-controls.test.ts`](../../nextjs_space/tests/rai/rai-controls.test.ts) and
[`tests/unit/ai-language.test.ts`](../../nextjs_space/tests/unit/ai-language.test.ts).

## Safety-relevant prompt guardrails (asserted by tests)
[`tests/rai/rai-unsupported-inference.test.ts`](../../nextjs_space/tests/rai/rai-unsupported-inference.test.ts)
asserts that the prompts:
- forbid assigning a Fitzpatrick type from a photograph;
- default `reportedFitzpatrickType` to `unknown` unless supplied;
- forbid invented measurements;
- defer fluid resuscitation to deterministic calculation.

These tests prevent a future prompt edit from silently dropping a safety guardrail.

## What is never exposed
Prompt **text**, system prompts and model chain-of-thought are never shown to end users — only the
version identifiers above.

## Change control
Bump the relevant constant when prompt text or pipeline behaviour changes materially, and follow the
Responsible AI change policy in [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md).
