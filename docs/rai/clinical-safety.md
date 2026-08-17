# Clinical safety

Clinically sensitive quantities are computed **deterministically**, not guessed by the model, and a
set of deterministic safety rules run after every analysis.

## Deterministic calculations
- **Parkland fluid resuscitation** — [`lib/clinical/parkland.ts`](../../nextjs_space/lib/clinical/parkland.ts).
  Image Analysis first applies the approved adult `TBSA >=15%` or child `TBSA >=10%` indication
  threshold after the clinician explicitly selects the patient category. It then computes volumes
  only when weight is supplied; the pipeline never infers category or weight (**RAI-SAFE-006**).
  Verified by [`tests/unit/parkland.test.ts`](../../nextjs_space/tests/unit/parkland.test.ts) and
  [`tests/rai/rai-safety.test.ts`](../../nextjs_space/tests/rai/rai-safety.test.ts).
- **TBSA** — Lund & Browder age-adjusted chart
  ([`lib/clinical/tbsa.ts`](../../nextjs_space/lib/clinical/tbsa.ts), **RAI-SAFE-011**).

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
7. **Bounded execution** — each stage uses configurable `AI_ANALYSIS_TIMEOUT_MS`; transport makes no
   more than three total attempts and retries only 408, 429, 500, 502, 503, 504, or transient network
   failures, honoring `Retry-After` where supplied (**RAI-REL-001**).
8. **Parkland indication before calculation** — below-threshold burns receive a bilingual
   not-required state without volumes; missing category is uncertain, and indicated cases without
   weight request weight without calculating a placeholder (**RAI-SAFE-006**).

## Safe failure
If the model or validation fails, the app returns an explicit, clearly-labelled
"assessment could not be completed" state that preserves the medical disclaimer rather than guessing
a result (**RAI-SAFE-010**,
[`lib/ai/validation/wound-analysis-schema.ts`](../../nextjs_space/lib/ai/validation/wound-analysis-schema.ts)).

Before model invocation, image input is limited to JPEG, PNG, WebP, and GIF; data URLs are
normalized and MIME type, base64 syntax, decoded size, file signature, dimensions, and structural
integrity are checked. Unsupported HEIC/HEIF or malformed, truncated, empty, or mismatched payloads
receive an actionable HTTP 400 and are not sent to the model (**RAI-SAFE-001**).

Structured output may be extracted from fences or surrounding commentary and receives one bounded
repair attempt. Observation and interpretation are core stages: if either remains unavailable, no
clinical result is returned. Management and critic are non-core stages: when either remains
unavailable, the validated core result is retained and the missing subsection is labelled rather
than invented (**RAI-SAFE-003**).

Azure input and output content-filter stops are classified from allowlisted structured fields
(source, category, severity) without recording raw provider errors or image content. The repository
provisions `Microsoft.Default`; a live policy/category must still be verified manually in Azure.

## Boundaries
A single photograph cannot establish depth progression, infection, pain or sensation with certainty.
Structural decoding does not establish that an image is clinically useful; focus, lighting, framing,
occlusion and scale remain model-assessed and clinician-reviewed.
These limits are disclosed per assessment (see [transparency.md](./transparency.md)) and in
[known-limitations.md](./known-limitations.md).
