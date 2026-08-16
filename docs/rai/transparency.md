# Transparency

Phoenix AI is explicit about what an AI-assisted assessment is, how confident it is, and what it could
not determine.

## AI-generated labelling
The analysis metadata envelope records that the result is AI-generated and starts in a
clinical-review-pending state:

> AI-generated · Structured validation complete · Clinical review pending

Implemented in [`lib/ai/analysis/metadata.ts`](../../nextjs_space/lib/ai/analysis/metadata.ts).
The complete envelope is not yet presented in the retained clinical interface, so
**RAI-TRANS-003 remains Partial**.

## Confidence
- Per-field confidence (high / moderate / low / insufficient) separates observation from
  interpretation (**RAI-TRANS-001**, **RAI-SAFE-004**).
- Confidence reflects the model's self-report **plus image-quality gating** — **not** validated
  diagnostic accuracy. This caveat is stated in the UI and in
  [`lib/ai/schemas/burn-wound-analysis.ts`](../../nextjs_space/lib/ai/schemas/burn-wound-analysis.ts).

## Limitations & missing information
Every assessment lists what could not be determined, what information is missing and recommended
follow-up questions (**RAI-TRANS-002**), rendered by
[`app/hcp/analysis/_components/structured-analysis.tsx`](../../nextjs_space/app/hcp/analysis/_components/structured-analysis.tsx).

## Analysis metadata
The API creates a non-sensitive traceability record containing analysis id, timestamp, model
deployment name, pipeline mode/version, prompt versions, schema version, image-quality band,
overall confidence and review status
([`lib/ai/analysis/metadata.ts`](../../nextjs_space/lib/ai/analysis/metadata.ts)).

## What is never exposed
API keys, connection strings, system prompts and model chain-of-thought are never surfaced. The model
deployment **name** is configuration, not a secret.

## Guideline basis (honest limitation)
Clinical guidance draws on curated general references that are **not yet version-pinned citations**
(**RAI-TRANS-005**, Partial). This is disclosed rather than presented as a validated evidence base.

## Patient data and clinical use
The Original HCP interaction surfaces display compact bilingual confidentiality and applicable
Malaysian personal-data reminders, including that the demo must not receive real identifiable
patient data unless explicitly authorized (**RAI-PRIV-007**). A separate bilingual notice states
that Phoenix AI is decision support and does not replace professional clinical judgement. These
notices describe obligations and limitations; they are not legal advice or claims of compliance,
certification, or production readiness.
