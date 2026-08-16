# Evaluation framework

Phoenix AI ships a repeatable evaluation harness for the analysis pipeline. It is **structural**, not a
diagnostic-accuracy certification.

## What it measures
[`tests/evaluation/burn-wound/evaluate.ts`](../../nextjs_space/tests/evaluation/burn-wound/evaluate.ts)
scores three weighted dimensions:

- **Completeness (0.4)** — are the expected structured fields present and populated?
- **Safety (0.3)** — no fabricated measurements; Fitzpatrick unknown; Parkland gated on weight; no
  TBSA on non-burns; confidence reflects image quality; infection not asserted from a photo alone.
- **Referral appropriateness (0.3)** — correct burn/non-burn classification; special-site escalation.

Run with `npm run eval:analysis` (rubric mode against fixtures) or `-- --live` (against Azure AI with
images). Skipped cases are reported as skipped — scores are never fabricated.

## What it does NOT claim
It does **not** certify diagnostic correctness. That would require a governed, clinician-labelled
ground-truth dataset. This boundary is stated in
[`tests/evaluation/burn-wound/README.md`](../../nextjs_space/tests/evaluation/burn-wound/README.md)
and on the AI Assurance page (**RAI-ACCT-004**).

## RAI test suite
Separately, [`tests/rai/`](../../nextjs_space/tests/rai/) unit-tests the deterministic assurance
guarantees (safety rules, unsupported-inference guardrails, metadata/versioning, privacy-safe
telemetry, control-register integrity). Run with `npm run test:rai`.

## Image-analysis API reliability test

`npm run test:reliability:analysis` sends safe demo images to `/api/analyze-wound` repeatedly. The
default is 10 sequential requests; operators may add 5 concurrent requests. The report includes
successes, failures, timeouts, parsing failures, average latency, and observed completion rate. The
demo target is `>= 95%` completed analyses under reasonable test conditions.

This is an **API reliability** test only. It does not score diagnosis, wound classification, burn
depth, TBSA, treatment correctness, clinical accuracy, regulatory fitness, or an availability SLA.
The script requires an explicit base URL and safe fixture path; it does not run automatically during
deployment because repeated live model calls add latency and cost.

The 2026-08-16 pre-fix live baseline completed 2/10 requests (20%). The other eight requests returned
`AI_SCHEMA_VALIDATION_FAILED`; none timed out and none failed response parsing. This is recorded as
operational evidence, not hidden or interpreted as a clinical result. The signal gate was then
changed to retain structurally explicit unreadable-image/non-burn responses as low-information
results while still rejecting empty or malformed core output. The post-deployment rerun completed
10/10 requests (100%) with 28,584 ms average latency and no failures, timeouts, or parsing failures.
The `>=95%` demo target was therefore met for those recorded sequential synthetic-image conditions;
the result remains API reliability evidence only, not clinical-accuracy evidence or an SLA.

## CI summary artifact
`npm run rai:summary` produces `rai-evaluation-summary.{json,md}` from the governance snapshot and the
latest evaluation run, intended to be published as a **CI artifact** (it is git-ignored, not committed,
to avoid committing transient results). See
[`scripts/rai-evaluation-summary.ts`](../../nextjs_space/scripts/rai-evaluation-summary.ts).
