# ADR-0008: Multi-image TBSA assessment with non-additive duplicate views

- **Status:** Accepted
- **Date:** 2026-08-12
- **Deciders:** Phoenix AI migration team; clinical product owner
- **Related components:** UI-HCP, UI-V2-HCP, API-HCP-ANALYSIS, AI-ANALYSIS-PIPELINE, AI-ANALYSIS-SCHEMA, LIB-RAI
- **Related integrations:** INT-BROWSER-APP, INT-APP-FOUNDRY

## Context

The HCP image-analysis flow accepts one photograph and displays an AI-estimated TBSA. Clinicians need
to submit several views to cover distinct burn regions or provide better views of the same region.
Adding every image estimate would double-count duplicate views; pixel overlay is not reliable without
camera calibration, landmarks, or geometric registration. The requested Minor/Major threshold also
overlaps at exactly 15%.

## Decision

Accept one to five images in one assessment. Send all views together to the existing staged
multimodal pipeline. Prompts require image-by-image anatomical coverage, identification of probable
duplicate views, and one deduplicated aggregate TBSA. Duplicate views are corroborative evidence only
and are never additive. Application code clamps the model-reported aggregate to `0-100%` and assigns
Minor below 15% and Major at or above 15%.

The result exposes image count, distinct regions, probable duplicate views, aggregation note, TBSA
estimate/range/method, deterministic size band, and explicit limitations. The UI labels this as an
AI photographic estimate requiring clinician confirmation. Existing single-image requests remain
supported.

## Alternatives Considered

- **Sum each image estimate:** rejected because duplicate views would inflate TBSA.
- **Pixel-level image overlay:** rejected because uncalibrated clinical photographs lack reliable
  registration and may show different angles, scale, lighting, or anatomy.
- **Require one image only:** rejected because it cannot cover non-contiguous burns or use a clearer
  duplicate view as corroborating evidence.
- **Replace the Lund & Browder calculator:** rejected; clinician-entered deterministic calculation
  remains separate and authoritative.

## Architecture Impact

Architecture version `2.4.0`. Existing components and integrations are extended; no new Azure
resource or topology is introduced. API input is backward-compatible. Prompt, pipeline, and schema
versions are bumped and included in analysis metadata.

## Security Impact

Input remains server-side validated. A maximum of five images and bounded total decoded bytes limits
resource use. No image bytes enter telemetry. Persistence continues to retain only the primary image
with the aggregate result; this limitation is disclosed.

## Operational Impact

Multi-image staged requests may consume more model tokens and latency. Existing route timeout,
health checks, telemetry, ACR build, and Container Apps application-only rollout remain unchanged.

## Risks

The model may fail to recognize duplicate views or infer anatomy incorrectly. Mitigations are
non-additive prompt rules, schema validation, deterministic range/clamp/banding, visible coverage and
limitations, confidence gating, critic review, and mandatory clinician oversight.

## Rollback

Restore single-file UI selection and send the legacy `image`/`mimeType` payload. The API remains
compatible with that request shape.

## Validation

Required before acceptance: input-boundary tests, deterministic TBSA band/clamp tests, prompt
guardrail tests, schema tests, full test/build, architecture/RAI validation, and deployed browser
journey verification.