# CHANGE-20260807: Improve burn/wound AI analysis accuracy, completeness and clinical consistency

- **Date:** 2026-08-07
- **Author:** Phoenix AI team
- **Related ADR:** [ADR-0003](../decisions/ADR-0003-staged-wound-analysis-pipeline.md) — "Staged multimodal wound-analysis pipeline" (Accepted)
- **Architecture version:** 1.0.0 -> 1.1.0 (MINOR — new components/integrations, backward-compatible route contract)
- **Impact level:** HIGH (AI pipeline redesign; new components, prompts, schema, config, evaluation harness)
- **Status:** IMPLEMENTED — 2026-08-07. Staged pipeline default-on (`AI_ANALYSIS_PIPELINE=staged`), single-pass retained as rollback.

> Originally the mandatory architecture pre-check gate for the "Improve AI Burn & Wound Analysis
> Accuracy" task; now implemented. Architecture docs (`current-architecture.md` §3.3,
> `current-ai-architecture.mmd`, inventories, changelog, version) were updated in the same change.
> Proposed diagram: [diagrams/CHANGE-20260807-ai-analysis-proposed.mmd](./diagrams/CHANGE-20260807-ai-analysis-proposed.mmd).

---

## 1. Current AI architecture (AS-IS, evidence-based)

Authoritative reference: [../current-architecture.md](../current-architecture.md) §3.3 and
[../diagrams/current-ai-architecture.mmd](../diagrams/current-ai-architecture.mmd).

- **Provider:** `AzureFoundryProvider` ([lib/ai/azure-foundry-provider.ts](../../../nextjs_space/lib/ai/azure-foundry-provider.ts)),
  OpenAI-compatible `/chat/completions`, managed identity (`DefaultAzureCredential`).
- **Model deployment:** a **single** deployment resolved from `AZURE_AI_MODEL_DEPLOYMENT`
  (legacy `AZURE_OPENAI_DEPLOYMENT`), currently **`gpt-4o`**, api-version `2024-10-21`. The **same
  deployment serves HCP chat, Community chat and wound image analysis** — there is no separate
  analysis model.
- **Analysis flow:** [app/api/analyze-wound/route.ts](../../../nextjs_space/app/api/analyze-wound/route.ts)
  performs a **single, uncontrolled model call**: one system prompt + `{image, mimeType}` user
  message, `responseFormat: 'json_object'`, `maxOutputTokens: 2000`, streamed back as SSE.
- **Community analysis flow:** [app/api/community-analyze/route.ts](../../../nextjs_space/app/api/community-analyze/route.ts)
  is the simplified public equivalent (3-field result).

### Current GPT-4o deployment
| Aspect | Value |
| --- | --- |
| Azure resource | Foundry `aif-yfjw6y` (rg-aisgemini-dev, eastus2) |
| Deployment | `gpt-4o` (vision-capable) |
| API version | `2024-10-21` |
| Auth | Managed identity (`id-phoenixai-yun55ezsi4yoq`) |
| Selection env | `AZURE_AI_MODEL_DEPLOYMENT` (shared by all AI routes) |

### Existing prompts
- HCP: `HCP_WOUND_ANALYSIS_SYSTEM_PROMPT` in
  [lib/ai/prompts/hcp-wound-analysis.ts](../../../nextjs_space/lib/ai/prompts/hcp-wound-analysis.ts)
  (verbatim from the Abacus source). Community: `lib/ai/prompts/community-wound-analysis.ts`.

### Existing response schema
- [lib/ai/validation/wound-analysis-schema.ts](../../../nextjs_space/lib/ai/validation/wound-analysis-schema.ts):
  `hcpWoundAnalysisSchema` — **22 flat fields** (all strings except `isBurn: boolean`), tolerant
  coercion, explicit safe-fallback `HCP_ASSESSMENT_UNAVAILABLE` when output is not valid/meaningful.
  Community: `communityWoundAnalysisSchema` (3 fields).

### Existing frontend expectations
- HCP: `AnalysisResult` interface in
  [app/hcp/analysis/_components/analysis-client.tsx](../../../nextjs_space/app/hcp/analysis/_components/analysis-client.tsx)
  reads all 22 fields; consumes SSE (`data:` lines, `processing`/`completed`, `[DONE]`).
- Community: [app/community/image-check/_components/image-check-client.tsx](../../../nextjs_space/app/community/image-check/_components/image-check-client.tsx)
  reads the 3 community fields.

### Deterministic clinical calculators (already present — reused, not the model)
- [lib/clinical/parkland.ts](../../../nextjs_space/lib/clinical/parkland.ts):
  `calculateResuscitation({weightKg, tbsaPercent, formula})` → `{total24h, first8h, next16h, …}` or `null`.
- [lib/clinical/tbsa.ts](../../../nextjs_space/lib/clinical/tbsa.ts):
  `computeTbsaBreakdown(...)`, `getSeverity(tbsa)` (Lund & Browder painter).

### Known correctness weaknesses in the current single-pass design
1. **Parkland uses an invented 70 kg patient** — the prompt instructs the model to compute Parkland
   "assuming 70 kg adult". This produces a patient-specific-looking fluid prescription from a
   fabricated weight.
2. **Exact Fitzpatrick type is guessed from a photo** — the prompt asks for `Type I–VI` from skin
   colour alone; Fitzpatrick describes UV response, not photographic appearance.
3. **TBSA false precision / no scale handling** — no separation of `visual_extent` vs
   `measured_dimensions`; centimetres/percentages can be fabricated with no calibration reference.
4. **No observation-vs-interpretation separation, no field-level confidence, no missing-information,
   no image-quality gating, no consistency critic.** A low-quality image can still yield a confident
   classification.
5. **Model performs arithmetic** that the app can and should compute deterministically.

> **Fact check (must be surfaced):** the task states the original Abacus.AI version used `gpt-5.4`.
> The repository evidence shows the original routes called Abacus's OpenAI-compatible **routing
> endpoint** authenticated with `ABACUSAI_API_KEY`; **no model name is pinned in the source**
> (see [../../migration/replacements.md](../../migration/replacements.md)). `gpt-5.4` is therefore
> **reported but unverified** and is not a confirmed Azure-available model. This does not block the
> redesign — the target is "same or better clinically useful information with fewer unsupported
> assumptions", evaluated empirically, not reproduction of a specific prior model's output.

---

## 2. Proposed architecture (TO-BE)

A **staged, evidence-gated multimodal pipeline** replaces the single uncontrolled call, behind a
feature flag so the current behaviour remains available and the route/SSE contract stays stable.

### 2.1 Staged pipeline (`lib/ai/analysis/`)
1. **Stage 1 — Visual observation** (`prompts/wound-visual-observation.ts`): describe only what is
   visible (image quality, anatomical location, skin appearance, surface, borders, exudate). **No diagnosis.**
2. **Stage 2 — Clinical interpretation** (`prompts/wound-clinical-interpretation.ts`): category,
   burn mechanism, burn depth — each with supporting/against evidence and uncertainty. Consumes Stage 1.
3. **Stage 3 — Quantification** (`prompts/wound-quantification.ts`): `visual_extent` vs
   `measured_dimensions` (`unavailable` without scale); TBSA estimate + range + method + assumptions
   + limitations (palmar method for small burns).
4. **Stage 4 — Management & referral** (`prompts/wound-management.ts`): first aid, wound care,
   dressing, referral, follow-up, red flags — **location-aware** (hands/face/feet/perineum/joints
   lower the consultation threshold; explicit hand-burn logic; differentiate
   consultation/urgent/transfer/routine).
5. **Stage 5 — Consistency / safety critic** (`prompts/wound-analysis-critic.ts`): detect internal
   contradictions, unsupported claims, false measurements, inappropriate precision, management
   contradictions, Fitzpatrick/infection overclaim, confidence mismatch → `pass` / `issues` /
   `recommended_corrections`; apply safe corrections before returning.

Stages are sequential prompts and/or separate model calls; the orchestrator lives in the route/service.

### 2.2 Strict structured output
- New `lib/ai/schemas/burn-wound-analysis.ts` (Zod + JSON Schema / Structured Outputs where the
  endpoint supports it) with the high-level structure in the task (image_quality, patient_context,
  visual_observations, skin_assessment, wound_classification, burn_assessment, wound_bed,
  exudate_and_infection, edges_and_periwound, tbsa, parkland, management, referral, follow_up,
  red_flags, missing_information, limitations, confidence, quality_checks).
- **Observation vs interpretation** on each clinically important field
  (`{observation, interpretation, confidence, basis[]}`).
- **Field-level confidence** (wound_category, burn_mechanism, burn_depth, tissue, infection, tbsa,
  location) driven by image quality/occlusion/scale/ambiguity/missing history.
- **Fitzpatrick handling:** `observed_skin_tone` + `reported_fitzpatrick_type` (=`unknown` when not
  supplied) + `skin_tone_interpretation_note`; never "unable to determine reliably from this image"
  is used instead of hallucination.

### 2.3 Deterministic calculations in app code
- Reuse [lib/clinical/parkland.ts](../../../nextjs_space/lib/clinical/parkland.ts) and
  [lib/clinical/tbsa.ts](../../../nextjs_space/lib/clinical/tbsa.ts). Model provides inputs/reasoning;
  **app computes** Parkland/TBSA arithmetic. `parkland_indicated: yes|no|uncertain`; when weight is
  absent → "Parkland calculation requires patient weight" (illustrative example clearly labelled
  "Example only — not patient-specific"). Unit-tested.

### 2.4 Configurable, purpose-specific models
- Split deployment env: `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` (image analysis) vs
  `AZURE_AI_CHAT_MODEL_DEPLOYMENT` (chat), both defaulting to `AZURE_AI_MODEL_DEPLOYMENT` for
  backward compatibility. Model chosen by **measured** completeness/accuracy/safety/latency/cost,
  not name. Optional consensus mode `AI_ANALYSIS_CONSENSUS_MODE` (default off, evidence-gated).

### 2.5 Follow-up refinement
- `recommended_follow_up_questions` + a second analysis pass (original image + observations +
  prior analysis + new context) so the HCP can **REFINE ANALYSIS** without re-uploading.

### 2.6 Guideline grounding
- `lib/clinical-guidelines/` with versioned, **approved** reference metadata → `guideline_basis`.
  No invented citations; Malaysian (KKM / 999 / local burn referral) context only when configured
  and sourced.

### 2.7 Evaluation harness
- `tests/evaluation/burn-wound/` (synthetic / de-identified only — **no patient-identifiable data**),
  `evaluate.ts` weighted scoring, `docs/ai/gpt4o-baseline-evaluation.md`,
  `docs/ai/model-comparison.md`, `docs/ai/reference-case-comparison.md`. Structural regression tests
  assert required analytical dimensions are always present (not fixed diagnoses).

### 2.8 Frontend
- Preserve the Phoenix design (`#8B0000`, logo, layout). Render structured sections (Overview,
  Visual Findings, Wound Bed, Exudate & Infection, Edges & Periwound, TBSA, Parkland [only when
  relevant], Management, Missing Info, Red Flags, Limitations, Confidence-by-Category) with
  expandable "Why this assessment?" (concise clinical evidence + limitations, **not** chain-of-thought).
  A back-compat adapter maps the new schema to the existing 22-field `AnalysisResult` so the route
  contract does not break during rollout.

---

## 3. Component & integration impact (to update on IMPLEMENTED)

New components (proposed IDs): `AI-ANALYSIS-PIPELINE`, `AI-ANALYSIS-STAGE1..5`,
`AI-ANALYSIS-SCHEMA`, `AI-ANALYSIS-CRITIC`, `AI-ANALYSIS-EVAL`, `CLINICAL-GUIDELINES`,
`AI-MODEL-SELECTOR`. Changed: `API-HCP-ANALYSIS`, `AI-PROVIDER` (model selection), `AI-VALIDATION`.
New integration: split analysis-model deployment (`INT-APP-FOUNDRY` gains an analysis-specific
deployment target). Docs to update on completion: `current-architecture.md`,
`diagrams/current-ai-architecture.mmd`, `diagrams/current-data-flow.mmd`, `component-inventory.md`,
`integration-inventory.md`, `ARCHITECTURE_CHANGELOG.md`, `ARCHITECTURE_VERSION` (→ 1.1.0).

---

## 4. Expected benefit
Higher clinical completeness and transparency (observation vs interpretation, field-level
confidence, missing-info, limitations), fewer unsupported claims (critic + evidence-gating),
no fabricated weights/measurements, safer referral logic — **to be confirmed by the evaluation
harness**, not asserted.

## 5. Cost impact
Multiple staged calls (and optional consensus) increase tokens/call volume per analysis (roughly
3–6× the single-pass token cost, depending on stages enabled). Acceptable for a prototype where
accuracy has priority; mitigated by feature flags and per-purpose model selection. Chat routes are
unaffected.

## 6. Latency impact
Sequential stages increase end-to-end latency (est. 2–5× single-pass). Kept under the App Service
~230 s front-end idle limit; `maxDuration`/timeouts revisited; streaming preserves perceived
responsiveness. Consensus mode adds further latency and is default-off.

## 7. Safety impact
Net safety improvement by design: explicit prohibition of diagnosis-from-image-alone, invented
weights, fabricated measurements, exact Fitzpatrick from colour, infection-from-appearance; critic
stage; `INSUFFICIENT` analysis-quality gate. **Explicitly not** a warrant for production clinical
use — that requires clinical validation beyond software evaluation.

## 8. Rollback plan
- All new behaviour is behind a feature flag (e.g. `AI_ANALYSIS_PIPELINE=staged|single`); default
  can revert to the current single-pass path instantly with no schema break (back-compat adapter).
- New files are additive; the existing prompt/schema/route remain until the staged path is proven.
- Env split defaults to `AZURE_AI_MODEL_DEPLOYMENT`, so unsetting the new vars restores today's model.
- Git revert of the feature commit fully restores the prior pipeline.

---

## 9. Validation (to run before marking IMPLEMENTED)
Typecheck, build, unit tests (incl. deterministic calc + schema), structural regression tests,
Mermaid validation, `scripts/validate-architecture`, and the burn-wound evaluation harness against
the baseline. Architecture docs updated in the same change. **STOP if docs lag implementation.**
