# Reference-case comparison — single-pass vs staged pipeline

This document records **qualitative and structural** differences between the legacy single-pass
analysis and the new staged pipeline, and is where live-evaluation deltas are recorded once run.

## Structural differences (verifiable today, no live model)

| Behaviour | Single-pass (legacy) | Staged pipeline (default) |
| --- | --- | --- |
| Parkland fluid | Model computes from an **assumed 70 kg** adult | Computed **deterministically** in app code from a supplied weight; **no weight is assumed** — otherwise flagged as "weight required" |
| Fitzpatrick type | Model **guesses** an exact type from the photo | Reported only when **supplied by the clinician**; otherwise `unknown`, with a skin-tone interpretation note |
| Measurements | Free-text size, can be fabricated | `measuredDimensions = unavailable` unless a **scale reference** is visible; `visualExtent` kept qualitative |
| Confidence | Single free-text percentage | **Field-level** confidence, **capped** when image quality is poor; overall `analysisQuality` band |
| Reasoning transparency | None | **Observation vs interpretation** with a stated **basis** per field ("Why this assessment?") |
| Missing info / limitations | None | Explicit `missingInformation`, `limitations`, `redFlags` |
| Consistency check | None | **Critic stage** audits contradictions, false precision, overclaim |
| Referral | Free text | Discrete level with **special-site escalation** (hands/face/feet/perineum/joints) |
| Follow-up | Static | `recommendedFollowUpQuestions` + a **REFINE** second pass (no re-upload) |

These are enforced by `tests/unit/analysis-pipeline.test.ts` and the safety axis of the harness.

## Live comparison (pending)

Run the harness for both pipelines on the SAME labelled images and paste the aggregate here:

```
# single
AI_ANALYSIS_PIPELINE=single ... npx tsx tests/evaluation/burn-wound/evaluate.ts --live
# staged
AI_ANALYSIS_PIPELINE=staged ... npx tsx tests/evaluation/burn-wound/evaluate.ts --live
```

| Pipeline | Completeness | Safety | Appropriateness | Weighted | Median latency |
| --- | --- | --- | --- | --- | --- |
| single | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
| staged | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

> Until these rows are filled from a real run, **no claim of improved accuracy is made**. The
> structural table above is factual; the diagnostic-accuracy question remains open and requires
> clinical validation beyond software evaluation.
