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

## CI summary artifact
`npm run rai:summary` produces `rai-evaluation-summary.{json,md}` from the governance snapshot and the
latest evaluation run, intended to be published as a **CI artifact** (it is git-ignored, not committed,
to avoid committing transient results). See
[`scripts/rai-evaluation-summary.ts`](../../nextjs_space/scripts/rai-evaluation-summary.ts).
