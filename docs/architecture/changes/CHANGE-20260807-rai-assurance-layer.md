# CHANGE-20260807: Surface the PhoenixIQ Responsible AI / AI Assurance layer

- **Date:** 2026-08-07
- **Author:** Phoenix AI team
- **Related ADR:** [ADR-0005](../decisions/ADR-0005-ai-assurance-layer.md) — "AI Assurance layer over the staged analysis pipeline" (Accepted)
- **Builds on:** [ADR-0003](../decisions/ADR-0003-staged-wound-analysis-pipeline.md) (staged pipeline), [ADR-0004](../decisions/ADR-0004-dual-experience-v2.md) (dual experience)
- **Architecture version:** 1.2.0 -> 1.3.0 (MINOR — additive AI Assurance surfacing layer; no change to the AI request/response contract)
- **Impact level:** MEDIUM (new documentation layer, one new v2 route, additive metadata + UI; the existing staged pipeline safety logic is unchanged and only surfaced)
- **Status:** IMPLEMENTED — 2026-08-07.

> Mandatory architecture pre-check gate for the "Surface Responsible AI Framework, Controls and
> Evidence" task. This change makes **already-implemented** Responsible AI controls visible and
> traceable; it does **not** invent new safety claims. Where a capability is not implemented
> (e.g. versioned guideline citations), it is documented as **Partial** or **Planned**, never as
> Implemented.

---

## 1. Current AI architecture (AS-IS, evidence-based)

Authoritative reference: [../current-architecture.md](../current-architecture.md) §3.3 and
[../diagrams/current-ai-architecture.mmd](../diagrams/current-ai-architecture.mmd).

The staged analysis pipeline already encodes substantial Responsible AI logic:

- **Input assurance** — image MIME/size validation
  ([lib/ai/validation/image-input.ts](../../../nextjs_space/lib/ai/validation/image-input.ts));
  stage-1 image-quality assessment
  ([lib/ai/prompts/wound-visual-observation.ts](../../../nextjs_space/lib/ai/prompts/wound-visual-observation.ts)).
- **Analysis assurance** — observation-vs-interpretation separation with field-level confidence
  and evidence basis ([lib/ai/schemas/burn-wound-analysis.ts](../../../nextjs_space/lib/ai/schemas/burn-wound-analysis.ts)),
  four-stage evidence-gated pipeline ([lib/ai/analysis/pipeline.ts](../../../nextjs_space/lib/ai/analysis/pipeline.ts)).
- **Output assurance** — Zod schema validation
  ([lib/ai/validation/wound-analysis-schema.ts](../../../nextjs_space/lib/ai/validation/wound-analysis-schema.ts)),
  consistency/safety critic (stage 4), deterministic post-processing (`assembleAnalysis`):
  no assumed Parkland weight, Fitzpatrick forced `unknown` unless supplied, no fabricated
  measurements without a scale reference, confidence capping on poor images, special-site
  escalation, explicit safe fallback (`HCP_ASSESSMENT_UNAVAILABLE`).
- **Clinical oversight** — clinician-supplied context, REFINE (second-pass) flow, persisted
  analyses ([lib/analysis/history.ts](../../../nextjs_space/lib/analysis/history.ts)).
- **Operational assurance** — privacy-safe telemetry that never logs image bytes or clinical
  text ([lib/telemetry/server.ts](../../../nextjs_space/lib/telemetry/server.ts),
  [lib/ai/telemetry.ts](../../../nextjs_space/lib/ai/telemetry.ts)); managed identity
  ([lib/ai/azure-credential.ts](../../../nextjs_space/lib/ai/azure-credential.ts)); structural
  evaluation harness ([tests/evaluation/burn-wound/](../../../nextjs_space/tests/evaluation/burn-wound/)).

**Gaps at AS-IS:** these controls are not surfaced to the clinician as a coherent assurance model;
prompts are not version-stamped; analyses carry no metadata envelope (analysis id, model
deployment, pipeline/prompt/schema version, review status); there is no control register mapping
controls to Microsoft's six RAI principles, to source files, and to tests.

## 2. Change (TO-BE)

Additive, evidence-based surfacing layer. No change to the `/api/analyze-wound` request/response
shape beyond an **additive** `result.meta` object.

New source-of-truth libraries (server + client safe):

- `lib/ai/prompts/versions.ts` — version constants for the staged clinical prompts + pipeline.
- `lib/ai/analysis/metadata.ts` — `buildAnalysisMetadata()` producing a non-sensitive metadata
  envelope (analysis id, timestamp, model deployment name, pipeline/prompt/schema versions,
  image-quality band, overall confidence, `reviewStatus: 'awaiting_review'`).
- `lib/rai/controls.ts` — typed RAI control register (stable IDs, principle, assurance layer,
  status, evidence path, test) and the five-stage assurance model.
- `lib/rai/governance.ts` — governance snapshot (active model deployment, prompt/schema versions,
  architecture version, evaluation status) assembled from env + constants.

New v2 surface:

- Route `app/v2/hcp/ai-assurance` + nav item **AI Assurance** — assurance-flow overview,
  implemented-controls table, control matrix, governance, known limitations, "How PhoenixIQ Uses AI".
- `components/v2/analysis-info-panel.tsx` — "Analysis Information" expandable panel + compact
  assurance status line, wired into the v2 assessment result.
- `components/v2/clinical-review-panel.tsx` — human-oversight state + actions on the (synthetic)
  case detail, recorded to the case timeline.

New documentation: `docs/rai/*` (inventory, principles mapping, framework, control matrix, code
traceability, model/prompt governance, human oversight, clinical safety, fairness, transparency,
evaluation, known limitations, roadmap, executive summary).

New tests: `tests/rai/*` (safety rules, unsupported-inference guards, control-register integrity).

New governance: RAI sections in `.github/PULL_REQUEST_TEMPLATE.md`,
`.github/copilot-instructions.md`, `AGENTS.md`.

New architecture artefacts: `docs/architecture/diagrams/current-ai-assurance.mmd`; control points
added to `current-ai-architecture.mmd`; §3.9 in `current-architecture.md`; inventory rows;
version bump to 1.3.0.

## 3. Affected components / integrations

| ID | Change |
| --- | --- |
| API-HCP-ANALYSIS | Additive `result.meta` envelope; no contract break |
| AI-ANALYSIS-PIPELINE | Unchanged logic; version constants referenced |
| UI-V2-HCP | New `ai-assurance` route + contextual assurance surfaces |
| LIB-RAI (new) | Control register + governance snapshot |
| AI-PROMPT-VERSIONS (new) | Prompt/pipeline version constants |
| AI-ANALYSIS-METADATA (new) | Analysis metadata envelope |

## 4. Impact assessment

- **Reliability/behaviour:** none — surfacing only; the safety logic in `assembleAnalysis` is
  unchanged and now additionally covered by `tests/rai/*`.
- **Privacy:** metadata envelope contains no secrets, no image bytes, no clinical free text; model
  deployment **name** is not a secret. Internal system prompts and chain-of-thought are never
  exposed in the UI.
- **Rollback:** v2 route is feature-flag gated (`v2Enabled`); `result.meta` is additive and
  ignored by the Original client.

## 5. Validation

`npm run typecheck`, `npm run test:unit`, `npm run test:rai`, `npm run build`, Mermaid render of the
new/updated diagrams, and `scripts/validate-architecture` must pass. Evidence audit for unsupported
claims completed (§42 of the task).
