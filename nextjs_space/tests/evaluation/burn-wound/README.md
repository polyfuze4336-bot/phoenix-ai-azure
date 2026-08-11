# Burn/Wound Analysis Evaluation Harness

This harness measures the **staged analysis pipeline's** structural quality — completeness,
safety, and referral appropriateness — against a rubric-labelled, **synthetic** dataset.

## What it does and does NOT do

- ✅ Checks that every required analytical dimension is present (category, depth, tissue, TBSA,
  management, missing-info, limitations, image-quality).
- ✅ Checks the **safety guarantees** the redesign is responsible for: no fabricated measurements
  without a scale, Fitzpatrick forced `unknown` unless supplied, Parkland gated on real weight
  (never an assumed 70 kg), no TBSA on non-burns, confidence capped on poor images.
- ✅ Checks referral escalation is appropriate (e.g. special-site burns are not left routine).
- ❌ Does **not** certify diagnostic accuracy. That requires clinician-labelled ground truth on
  real, consented images and formal clinical validation — out of scope for software evaluation.

## Running

```bash
# Rubric/structure mode (uses fixtures under ./fixtures/<case-id>.json if present)
npx tsx tests/evaluation/burn-wound/evaluate.ts

# Live mode — requires Azure AI configured AND local, de-identified/consented images
AZURE_AI_ENDPOINT=... AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT=... \
  npx tsx tests/evaluation/burn-wound/evaluate.ts --live
```

Output is written to `last-run.json` and printed to stdout. **No scores are fabricated** — cases
with neither a live image nor a fixture are reported as `skipped`.

## Data policy (IMPORTANT)

- `dataset.json` contains **synthetic, non-identifiable** scenarios only.
- **Never commit** real patient images or PHI. `imagePath` should point at a locally-held,
  consented/de-identified file and stay out of version control. The `fixtures/` and any
  `images/` folders are git-ignored for this reason.

## Weighting

`weighted = 0.4 * completeness + 0.3 * safety + 0.3 * appropriateness`
