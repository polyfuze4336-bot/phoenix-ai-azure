# Transparency

PhoenixIQ is explicit about what an AI-assisted assessment is, how confident it is, and what it could
not determine.

## AI-generated labelling
Every AI-assisted result is labelled AI-generated and accompanied by a compact status line:

> AI-generated · Structured validation complete · Clinical review pending

Implemented in
[`components/v2/analysis-info-panel.tsx`](../../nextjs_space/components/v2/analysis-info-panel.tsx)
(**RAI-TRANS-003**).

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

For multi-image assessment, the result also discloses image count, distinct anatomical regions,
probable duplicate views, and the aggregation rule. Duplicate detection is model-assisted and is not
presented as guaranteed image registration (**RAI-TRANS-006**).

## Analysis metadata
The "Analysis Information" panel exposes a non-sensitive traceability record: analysis id, timestamp,
model deployment name, pipeline mode/version, prompt versions, schema version, image-quality band,
overall confidence and review status
([`lib/ai/analysis/metadata.ts`](../../nextjs_space/lib/ai/analysis/metadata.ts)).

## What is never exposed
API keys, connection strings, system prompts and model chain-of-thought are never surfaced. The model
deployment **name** is configuration, not a secret.

## Guideline basis (honest limitation)
Clinical guidance draws on curated general references that are **not yet version-pinned citations**
(**RAI-TRANS-005**, Partial). This is disclosed rather than presented as a validated evidence base.
