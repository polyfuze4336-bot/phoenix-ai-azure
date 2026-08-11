# Fairness & skin tone

Burn assessment is known to be harder on deeply pigmented skin (e.g. erythema is less visible).
PhoenixIQ handles skin tone carefully and avoids unsupported demographic inference.

## What the system does
- **Describes** observed skin tone in plain terms (e.g. "light brown", "deeply pigmented") at the
  observation stage ([`lib/ai/prompts/wound-visual-observation.ts`](../../nextjs_space/lib/ai/prompts/wound-visual-observation.ts)).
- **Explains** how observed skin tone affects interpretation (e.g. rely on texture/temperature/oedema
  where erythema is harder to see) at the interpretation stage.
- **Does not** assign a Fitzpatrick skin type from a photograph. Fitzpatrick describes UV response and
  cannot be determined from an image; it is forced to `unknown` unless a clinician supplies it
  (**RAI-FAIR-001**).
- **Does not** infer ethnicity, race, age, pain or sensation from an image (**RAI-FAIR-002**).

## Evidence
- Deterministic enforcement: `assembleAnalysis` in
  [`lib/ai/analysis/pipeline.ts`](../../nextjs_space/lib/ai/analysis/pipeline.ts).
- Prompt guardrails asserted by
  [`tests/rai/rai-unsupported-inference.test.ts`](../../nextjs_space/tests/rai/rai-unsupported-inference.test.ts)
  and [`tests/rai/rai-safety.test.ts`](../../nextjs_space/tests/rai/rai-safety.test.ts).

## Honest gap
A **quantitative** fairness benchmark measuring performance parity across skin tones is **not
implemented** — it requires a governed, consented, labelled dataset. The controls above prevent
*unsupported inference*; they do not, on their own, certify parity. This gap is tracked in
[rai-roadmap.md](./rai-roadmap.md) and [known-limitations.md](./known-limitations.md).
