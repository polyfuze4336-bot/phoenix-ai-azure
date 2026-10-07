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
7. **Bounded execution** — each model call uses configurable `AI_ANALYSIS_TIMEOUT_MS` with a
   30-second default. Transport makes no more than three total attempts and retries only 408, 429,
   500, 502, 503, 504, or transient network failures, honoring `Retry-After` where supplied.
   A transient Acute Burn staged failure makes one validated single-pass fallback attempt; content
   filtering, safety, authentication, invalid input, and invalid fallback output do not bypass the
   safe-failure path (**RAI-REL-001**, **RAI-SAFE-010**).
8. **Parkland indication before calculation** — below-threshold burns receive a bilingual
   not-required state without volumes; missing category is uncertain, and indicated cases without
   weight request weight without calculating a placeholder (**RAI-SAFE-006**).
9. **Assessment-mode isolation** — General Wound uses a separate prompt/schema, strips the burn
   calculation surface entirely, forces unsupported dimensions to an unavailable statement, and
   accepts TIMERS social/patient factors only from clinician-supplied social context.

## Safe failure
Community burn assessment uses the existing Self-Assessment cause/size/appearance/pain scores
and thresholds (`<=3` minor; `4–7` moderate; `>=8` emergency). The public mapping is
Minor Burn / Major Burn / Major Burn; emergency is a separate 999 disposition. Explicit
prototype questionnaire red flags can only escalate, never be downgraded by image observations.
Contact, Other and Unsure have no approved cause score: absent a deterministic hospital or
emergency flag, the result is indeterminate and requests professional assessment. Age and time
are context only and shown in the result. Uncertain symptoms that do not independently
escalate still receive an explicit professional-discussion notice. These new escalation rules have **not** been clinically validated and need
clinical review (**RAI-SAFE-013**, `tests/rai/community-burn.test.ts`).

If HCP model or validation fails, the API returns a categorized failure and the client
retains retry/manual-assessment guidance rather than reporting a completed clinical
result (**RAI-SAFE-010**, [`app/api/analyze-wound/route.ts`](../../nextjs_space/app/api/analyze-wound/route.ts)).

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
(source, category, severity, and the `content_filter` / `ResponsibleAIPolicyViolation` /
`content_policy_violation` error codes) without recording raw provider errors or image content. The
`gpt-4o` uses the custom `phoenix-clinical-imagery` Azure content-filter policy declared in
`infra/modules/foundry-connection.bicep`. After a supplied severe hand-burn image was rejected as
input on five consecutive Acute Burn/General Wound attempts, Violence Prompt classification was
made non-blocking; two post-deployment retries still failed with source `input` and no category.
Violence and Self-harm Prompt classification therefore remain enabled but are non-blocking
annotation for severe accidental-injury imagery. Their completions remain blocked at High, Hate
and Sexual input/output remain blocked at Medium, and Jailbreak protection remains on
(**RAI-SAFE-014**). This is an explicit medical-imagery exception, not a general filters-off policy.
Provider refusals from every retained protection still fail safely without a fabricated result.
An explicit model refusal is treated the same way: it is not replaced with a fabricated result.
The HCP interface provides a neutral bilingual retry/manual-assessment path. Clinical imagery of
normally private body regions is not rejected by the image validator based on anatomy; prompts
request only medically necessary wound findings and respect patient dignity. This cannot guarantee
that Azure will accept every image or that any assessment is clinically accurate.
Failure diagnostics record the assessment mode, stage and sanitized category, and provider HTTP
status and validated request ID when available. They do not record image bytes, raw provider
responses or patient context. Failed wound-analysis responses return the safe request correlation ID
in their JSON body and `x-correlation-id` header. When Azure supplies structured filter evidence,
the response and Application Insights event may also include only the allowlisted input/output
source, harm category, and severity. Azure can omit those fields, so the correlation ID improves
incident tracing but does not guarantee that every rejection identifies a category.

## Boundaries
A single photograph cannot establish depth progression, infection, pain or sensation with certainty.
Structural decoding does not establish that an image is clinically useful; focus, lighting, framing,
occlusion and scale remain model-assessed and clinician-reviewed.
These limits are disclosed per assessment (see [transparency.md](./transparency.md)) and in
[known-limitations.md](./known-limitations.md).
