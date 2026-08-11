# ADR-0003: Staged multimodal wound-analysis pipeline

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** Phoenix AI migration team
- **Related components:** AI-ANALYSIS-PIPELINE, AI-ANALYSIS-SCHEMA, AI-ANALYSIS-CRITIC, AI-MODEL-SELECTOR, AI-ANALYSIS-EVAL, API-HCP-ANALYSIS, AI-PROVIDER, AI-VALIDATION, CLIN-PARKLAND
- **Related integrations:** INT-APP-FOUNDRY

## Context

The wound image analysis behind `/api/analyze-wound` was a **single-pass** prompt to `gpt-4o`
that produced the 22-field HCP contract in one call. Review of the prompt and outputs surfaced
recurring accuracy and clinical-consistency risks: the model was asked to both observe and
diagnose in one step (mixing what is *seen* with what is *inferred*), it computed Parkland fluid
volumes from an **assumed 70 kg** weight, reported an exact **Fitzpatrick** skin type from a
single photo, stated **precise measurements** without any scale reference, and had no mechanism to
detect internal contradictions or false precision before returning a result.

This task is explicitly about improving analysis **accuracy, completeness and clinical
consistency** — not about making responses more verbose — while preserving the existing user
experience and the request/response contract.

## Decision

Introduce a **staged analysis pipeline** (`lib/ai/analysis/pipeline.ts`) that decomposes the
analysis into four sequential model stages plus deterministic post-processing:

1. **Visual observation** — describe only what is visible (no diagnosis).
2. **Clinical interpretation & quantification** — separate observation from interpretation;
   Fitzpatrick `unknown` unless clinician-supplied; measurements `unavailable` without a scale;
   TBSA as a range, not a fluid figure.
3. **Management & referral** — location-aware guidance; no fluid computation in the prompt.
4. **Consistency / safety critic** — audit for contradictions, false precision, and overclaiming.

Deterministic app code then enforces safety invariants (`assembleAnalysis`): Parkland is computed
by `lib/clinical/parkland.ts` from a **supplied** weight only, confidence is capped on
poor-quality images, non-burn cases carry no TBSA, and special-site burns are escalated. The rich
result (`lib/ai/schemas/burn-wound-analysis.ts`) is mapped back to the existing 22-field contract
via a back-compat adapter, and the full structure is returned under `result.structured` for the
enhanced UI and a second-pass **REFINE** flow.

Model selection is split (`lib/ai/model-config.ts`) so analysis and chat can point at different
deployments, both defaulting to the existing `AZURE_AI_MODEL_DEPLOYMENT`.

The pipeline is the **default** (`AI_ANALYSIS_PIPELINE=staged`); `single` reverts to the original
single-pass call for instant rollback.

## Alternatives Considered

- **Keep single-pass, improve the prompt only:** lower cost/latency but cannot reliably separate
  observation from inference or prevent the model from fabricating measurements and fluid volumes.
- **Consensus / self-ensembling on every request:** higher accuracy potential but roughly doubles
  cost and latency; retained as an opt-in flag (`AI_ANALYSIS_CONSENSUS_MODE`, default off).
- **Move all reasoning into deterministic code:** infeasible for open-ended visual assessment;
  deterministic code is used only for the calculations that must never be guessed.

## Rationale

Separating observation from interpretation and moving the numeric calculations into deterministic,
unit-tested code directly targets the identified failure modes without changing the visible
contract. The critic stage and confidence/gap fields make uncertainty explicit rather than hidden.

## Architecture Impact

Extends the AI layer captured in [../current-architecture.md](../current-architecture.md) §3.3 and
[../diagrams/current-ai-architecture.mmd](../diagrams/current-ai-architecture.mmd). Backward
compatible (new route topology behind a default-on flag). Architecture version `1.0.0` → `1.1.0`
(MINOR). See change record
[../changes/CHANGE-20260807-improve-ai-analysis-accuracy.md](../changes/CHANGE-20260807-improve-ai-analysis-accuracy.md).

## Security Impact

- No new external dependencies or secrets; same managed-identity path to Foundry.
- Multiple stages increase token spend per analysis; bounded by per-stage timeouts and the
  single-pass rollback flag.

## Operational Impact

- Higher per-analysis latency and cost (multi-stage); route `maxDuration` raised accordingly.
- New environment variables (`AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT`, `AZURE_AI_CHAT_MODEL_DEPLOYMENT`,
  `AI_ANALYSIS_PIPELINE`, `AI_ANALYSIS_CONSENSUS_MODE`), all with safe defaults.

## Clinical-Safety Note

This decision improves **structural** rigor and internal consistency. It does **not** certify
diagnostic accuracy. The evaluation harness (`tests/evaluation/burn-wound/`) is scaffolded but
requires live Azure calls against a labelled, consented dataset before any accuracy claim can be
made. Phoenix AI remains a demonstration/decision-support tool and must not be represented as
validated for production clinical use on the basis of software evaluation alone.
