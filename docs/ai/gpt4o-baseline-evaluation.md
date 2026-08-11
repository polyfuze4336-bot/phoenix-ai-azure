# GPT-4o baseline evaluation — methodology and status

**Status:** methodology defined; empirical baseline **not yet run** (requires live Azure
multimodal calls against a labelled dataset). This document exists so that any accuracy claim is
tied to a repeatable procedure and real evidence — never to an assertion.

## Why this document is deliberately empty of scores

The task that motivated the analysis redesign explicitly forbids claiming improved accuracy
without evaluation evidence, and forbids recommending production clinical use on the basis of
software evaluation alone. Accordingly, **no accuracy numbers are stated here** until the harness
below has been run against real (consented, de-identified) images with clinician-provided ground
truth.

## Current model under evaluation

- Deployment: `gpt-4o` (vision-capable) on Microsoft Foundry `aif-yfjw6y`, api-version `2024-10-21`,
  selected via `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` (falls back to `AZURE_AI_MODEL_DEPLOYMENT`).
- Two pipelines are comparable behind a flag: `single` (legacy one-shot prompt) and `staged`
  (default; observation → interpretation → management → critic + deterministic post-processing).

> **Provenance note.** The original Abacus.AI version is reported to have used a model referred to
> as "gpt-5.4". The repository source shows the original routes calling Abacus's OpenAI-compatible
> **routing endpoint** with `ABACUSAI_API_KEY` and **no pinned model name**; "gpt-5.4" is therefore
> **reported but unverified** and is not a confirmed Azure-available model. The redesign targets
> measurably better clinically-useful output, not reproduction of a specific prior model.

## What is measured

Run via `tests/evaluation/burn-wound/evaluate.ts` (see the harness README). Three axes, weighted
`0.4 / 0.3 / 0.3`:

1. **Completeness** — required analytical dimensions present (category, depth, tissue, exudate,
   TBSA when a burn, management, missing-information, limitations, image-quality).
2. **Safety** — no fabricated measurements without a scale reference; Fitzpatrick reported only
   when supplied; Parkland gated on a real weight (no assumed 70 kg); no TBSA on non-burns;
   confidence capped on poor-quality images.
3. **Appropriateness** — burn/non-burn correct; referral escalation appropriate (special sites not
   left routine); red flags surfaced.

## How to produce the baseline (procedure)

1. Assemble a small, **consented / de-identified** image set with clinician labels (category,
   depth band, appropriate referral level). Keep images OUT of version control.
2. Point `imagePath` in `dataset.json` (or a private copy) at the local files.
3. Run `--live` for both pipelines:
   - `AI_ANALYSIS_PIPELINE=single ... npx tsx tests/evaluation/burn-wound/evaluate.ts --live`
   - `AI_ANALYSIS_PIPELINE=staged ... npx tsx tests/evaluation/burn-wound/evaluate.ts --live`
4. Record both `last-run.json` reports and summarise the deltas in
   [reference-case-comparison.md](./reference-case-comparison.md).

## Structural regression (runs today, no live model)

`tests/unit/analysis-pipeline.test.ts` asserts the safety guarantees deterministically (no live
call). These must stay green: they encode the correctness fixes, not diagnostic performance.

## Honest limitations

- Structural/behavioural scores are **not** diagnostic accuracy.
- A single photograph cannot substitute for hands-on examination.
- Any future accuracy figure must state dataset size, labelling method, and inter-rater notes.
