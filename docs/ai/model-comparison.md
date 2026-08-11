# Model comparison — how to choose the analysis deployment

The wound-analysis pipeline's model is **configurable and decoupled** from the chat model:

| Purpose | Env var | Fallback |
| --- | --- | --- |
| Image analysis pipeline | `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` | `AZURE_AI_MODEL_DEPLOYMENT` |
| HCP + community chat | `AZURE_AI_CHAT_MODEL_DEPLOYMENT` | `AZURE_AI_MODEL_DEPLOYMENT` |

This lets a higher-accuracy multimodal model serve analysis without changing the cheaper,
latency-sensitive chat model, and lets models be compared **by measured behaviour, not by name**.

## Selection criteria (in priority order)

1. **Safety** — honours the pipeline's guarantees; does not fabricate measurements/depth.
2. **Completeness** — fills the required analytical dimensions.
3. **Appropriateness** — burn/non-burn and referral escalation correct.
4. **Latency** — staged pipeline runs 4 sequential calls; total must stay under the App Service
   idle limit (~230 s). See `maxDuration` in the route.
5. **Cost** — staged pipeline uses ~3–6× the tokens of the single-pass call.

## How to compare two candidates

1. Configure candidate A: `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT=<A>`; run the live harness.
2. Configure candidate B: `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT=<B>`; run the live harness.
3. Compare the `aggregate` block (completeness/safety/appropriateness/weighted) and latency from
   each `last-run.json`. Record the decision (and date) below.

## Decision log

| Date | Analysis deployment | Weighted score | Notes |
| --- | --- | --- | --- |
| _pending_ | `gpt-4o` | _not yet measured_ | Baseline to be established (see gpt4o-baseline-evaluation.md). |

> No comparison figures are recorded until the live harness has been run on a labelled dataset.
