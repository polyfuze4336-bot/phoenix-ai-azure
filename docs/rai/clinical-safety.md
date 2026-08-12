# Clinical safety

Clinically sensitive quantities are computed **deterministically**, not guessed by the model, and a
set of deterministic safety rules run after every analysis.

## Deterministic calculations
- **Parkland fluid resuscitation** — [`lib/clinical/parkland.ts`](../../nextjs_space/lib/clinical/parkland.ts).
  Computed only when a weight is supplied; the pipeline **never invents a body weight** (**RAI-SAFE-006**).
  Verified by [`tests/unit/parkland.test.ts`](../../nextjs_space/tests/unit/parkland.test.ts) and
  [`tests/rai/rai-safety.test.ts`](../../nextjs_space/tests/rai/rai-safety.test.ts).
- **TBSA** — Lund & Browder age-adjusted chart
  ([`lib/clinical/tbsa.ts`](../../nextjs_space/lib/clinical/tbsa.ts), **RAI-SAFE-011**).
- **Photographic TBSA output guard** — the model-reported aggregate is bounded to `0-100%` and
   classified in application code as Minor (`<15%`) or Major (`>=15%`) (**RAI-SAFE-013**). This
   deterministic guard does not make the underlying photographic estimate deterministic or
   clinically validated.

## Deterministic safety rules (in `assembleAnalysis`)
Implemented in [`lib/ai/analysis/pipeline.ts`](../../nextjs_space/lib/ai/analysis/pipeline.ts) and
covered by the RAI + unit tests:

1. **No fabricated measurements** — numeric dimensions are stripped unless a scale reference is
   present (**RAI-SAFE-007**).
2. **Fitzpatrick forced unknown** unless clinician-supplied (**RAI-FAIR-001**).
3. **No TBSA on non-burns** (**RAI-SAFE-011**).
4. **Confidence capping** by image quality (**RAI-SAFE-009**).
5. **Special-site escalation** — face, hands, feet, perineum, major joints, circumferential burns
   never remain on a routine pathway (**RAI-SAFE-008**).
6. **Automated consistency review** flags contradictions, unsupported claims and false precision
   (**RAI-SAFE-005**).
7. **Bounded execution** — each stage runs under a timeout (**RAI-REL-001**).
8. **Multi-view non-additivity** — probable duplicate views are disclosed and instructed to be
   corroborative, not additive (**RAI-TRANS-006**, Partial after implementation because recognition
   remains model-assisted).

## Safe failure
If the model or validation fails, the app returns an explicit, clearly-labelled
"assessment could not be completed" state that preserves the medical disclaimer rather than guessing
a result (**RAI-SAFE-010**,
[`lib/ai/validation/wound-analysis-schema.ts`](../../nextjs_space/lib/ai/validation/wound-analysis-schema.ts)).

## Boundaries
Photographs cannot establish depth progression, infection, pain or sensation with certainty.
Multiple views cannot guarantee geometric registration or complete body coverage. These limits are
disclosed per assessment (see [transparency.md](./transparency.md)) and in
[known-limitations.md](./known-limitations.md).
