# CHANGE-20260816: Image-analysis resilience and HCP notices

- **Date:** 2026-08-16
- **Author:** Phoenix AI prototype maintainers
- **Related ADR:** ADR-0003 (consistent implementation; no new decision)
- **Architecture version:** 5.0.0 -> 5.1.0
- **Impact level:** MEDIUM

## Summary

Complete Steps 12-22 for the retained HCP experience: contextual bilingual notices and demo
boundary, decoded-image validation, categorized failures, bounded Azure AI retries and timeout,
robust structured parsing/repair, preservation of validated core results, and factual loading stages.

## Before

- Analysis and chat shared one combined notice; TBSA/Parkland and the HCP shell had no compact
  contextual decision-support/demo indicator.
- Image validation checked MIME, base64, signature, and size but not dimensions or truncated decode.
- Analysis used hard-coded stage timeouts; transport retried every 5xx and exposed upstream detail.
- Empty/interrupted streams and malformed stage JSON were not consistently categorized.
- Analysis displayed a single generic loading message.

## After

- Compact bilingual notices appear near decision support, uploads/chat inputs, results, TBSA/
  Parkland, and a discreet Demo Environment badge appears in the HCP shell.
- Images must decode with valid dimensions before AI submission; API errors carry stable categories
  and language-aware safe messages without stack traces or upstream response bodies.
- `AI_ANALYSIS_TIMEOUT_MS` controls a bounded timeout. Retry is limited to three total attempts and
  only 408/429/500/502/503/504 or transient network errors, with jitter and `Retry-After`.
- Structured JSON extraction tolerates fences/commentary, repairs once, requires core observation and
  interpretation, and preserves core output when management/critic alone remains unavailable.
- Four factual bilingual loading stages are displayed without percentages.

## Components affected

- `UI-CLINICAL-NOTICE`, `UI-HCP`, `UI-I18N`
- `API-HCP-ANALYSIS`, `API-COMMUNITY-ANALYSIS`
- `AI-PROVIDER`, `AI-STREAMING`, `AI-VALIDATION`, `AI-ANALYSIS-PIPELINE`, `AI-ANALYSIS-SCHEMA`

## Integrations affected

- No integration or Azure endpoint change. Azure AI retains managed identity and the existing
  OpenAI-compatible protocol; timeout/retry behavior changes within the application.

## Diagrams updated

- `docs/architecture/diagrams/current-ai-architecture.mmd`

## Responsible AI impact

- `RAI-SAFE-001`, `RAI-SAFE-003`, `RAI-PRIV-007`, and bounded stage execution are strengthened and
  remain Active. `LIM-012` records the structural-decoding boundary.

## Validation plan

- Focused unit tests for image decoding, retry/error categorization, parsing/repair, partial stages,
  and timeout configuration.
- RAI, unit, integration, API, retained E2E, lint, typecheck, production build, architecture drift,
  Bicep, and Mermaid validation.

## Validation results

- PASS: TypeScript typecheck and ESLint.
- PASS: 105 unit tests, 27 RAI tests, 14 integration tests, 24 API tests, and 24 retained E2E tests.
- PASS: Next.js production build (18 pages), Bicep compilation, changed Mermaid diagram render,
  architecture drift, whitespace check, and changed-source credential scan.
- PASS with no score: the governed analysis evaluation harness ran in rubric-only mode; all four
  cases were honestly skipped because no consented live images or saved fixtures are available.
- Expected local advisories: no Azure AI model deployment or `DATABASE_URL` is supplied to offline
  Playwright servers. API/E2E terminal-state tests pass without external credentials.