# RAI implementation inventory

Every Responsible AI control in PhoenixIQ, traced to code and tests. Status is honest: **Implemented**
(Active), **Partially Implemented** (Partial), **Planned**, **Not Implemented**, or **Not Applicable**.
Control IDs are stable and match [`lib/rai/controls.ts`](../../nextjs_space/lib/rai/controls.ts).

| RAI ID | Capability | Principle | Implementation | Location | User Visible | Evidence (tests) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RAI-SAFE-001 | Image input validation | Reliability & Safety | MIME + size + count validation before any model call (including multi-image HCP submissions) | `lib/ai/validation/image-input.ts` | No | `tests/unit/image-input.test.ts`, `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-002 | Image-quality gating | Reliability & Safety | Stage-1 adequacy assessment; downstream confidence capped | `lib/ai/prompts/wound-visual-observation.ts`, `lib/ai/analysis/pipeline.ts` | Yes | `tests/unit/analysis-pipeline.test.ts` | Implemented |
| RAI-SAFE-003 | Schema-validated output | Reliability & Safety | Zod validation; explicit unavailable state | `lib/ai/validation/wound-analysis-schema.ts` | No | `tests/unit/wound-schema.test.ts`, `tests/unit/ai-parsing.test.ts` | Implemented |
| RAI-SAFE-004 | Observation vs interpretation | Transparency | Per-field observation/interpretation/confidence/basis | `lib/ai/schemas/burn-wound-analysis.ts` | Yes | `tests/unit/wound-schema.test.ts` | Implemented |
| RAI-SAFE-005 | Automated consistency review | Reliability & Safety | Stage-4 critic auditing contradictions/overclaim | `lib/ai/prompts/wound-analysis-critic.ts`, `lib/ai/analysis/pipeline.ts` | Yes | `tests/unit/analysis-pipeline.test.ts` | Implemented |
| RAI-SAFE-006 | Indication- and weight-gated Parkland | Reliability & Safety | Deterministic; age-aware TBSA threshold; never assumes weight or calculates routine volumes for small burns | `lib/clinical/parkland.ts`, `lib/ai/analysis/pipeline.ts` | Yes | `tests/unit/parkland.test.ts`, `tests/unit/analysis-pipeline.test.ts`, `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-007 | No fabricated measurements | Reliability & Safety | Dimensions stripped without a scale reference | `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-008 | Special-site escalation | Reliability & Safety | High-risk sites never routine | `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-009 | Confidence capping | Reliability & Safety | Confidence bounded by image quality | `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-010 | Safe-failure state | Reliability & Safety | Labelled unavailable result, disclaimer preserved | `lib/ai/validation/wound-analysis-schema.ts` | Yes | `tests/unit/ai-parsing.test.ts` | Implemented |
| RAI-SAFE-011 | Deterministic TBSA | Reliability & Safety | Lund & Browder age-adjusted | `lib/clinical/tbsa.ts` | Yes | `tests/unit/tbsa.test.ts` | Implemented |
| RAI-SAFE-012 | Clinician refinement loop | Reliability & Safety | Second-pass with human answers, no re-upload | `app/api/analyze-wound/route.ts` | Yes | — | Implemented |
| RAI-REL-001 | Bounded stage execution | Reliability & Safety | Per-stage timeouts | `lib/ai/analysis/pipeline.ts` | No | — | Implemented |
| RAI-FAIR-001 | Skin tone described, not inferred | Fairness | Fitzpatrick forced unknown unless supplied | `lib/ai/prompts/wound-clinical-interpretation.ts`, `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-unsupported-inference.test.ts` | Implemented |
| RAI-FAIR-002 | No demographic inference | Fairness | Prompts forbid ethnicity/race/age/pain inference | `lib/ai/prompts/*.ts` | Yes | `tests/rai/rai-unsupported-inference.test.ts` | Implemented |
| RAI-TRANS-001 | Field-level confidence | Transparency | high/moderate/low/insufficient per field | `lib/ai/schemas/burn-wound-analysis.ts` | Yes | `tests/unit/wound-schema.test.ts` | Implemented |
| RAI-TRANS-002 | Limitations & missing info | Transparency | Always-present disclosure lists | `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-TRANS-003 | AI labelling + metadata | Transparency | Metadata envelope + status line + info panel | `lib/ai/analysis/metadata.ts`, `components/v2/analysis-info-panel.tsx` | Yes | `tests/rai/rai-metadata.test.ts` | Implemented |
| RAI-TRANS-004 | Prompt/pipeline/schema versioning | Accountability | Version constants recorded per analysis | `lib/ai/prompts/versions.ts`, `lib/ai/analysis/metadata.ts` | Yes | `tests/rai/rai-metadata.test.ts` | Implemented |
| RAI-TRANS-005 | Guideline basis disclosure | Transparency | Curated general references, **not** version-pinned citations | `lib/v2/guidelines.ts` | Yes | — | Partially Implemented |
| RAI-ACCT-001 | Human-in-the-loop review | Accountability | Review states; AI never "approved" | `lib/ai/analysis/metadata.ts`, `components/v2/clinical-review-panel.tsx` | Yes | `tests/rai/rai-metadata.test.ts` | Implemented |
| RAI-ACCT-002 | Analysis persistence / audit | Accountability | Persisted result + image ref + timestamp | `lib/analysis/history.ts`, `prisma/schema.prisma` | Yes | `tests/unit/db-mappings.test.ts` | Implemented |
| RAI-ACCT-003 | Architecture governance | Accountability | Docs-sync CI + change policy | `docs/architecture/*`, `scripts/validate-architecture.mjs` | No | — | Implemented |
| RAI-ACCT-004 | Structural evaluation harness | Reliability & Safety | Completeness/safety/appropriateness scoring | `tests/evaluation/burn-wound/evaluate.ts` | Yes | — | Implemented |
| RAI-ACCT-005 | Configurable model governance | Accountability | Deployment is config, not hard-coded | `lib/ai/model-config.ts` | Yes | — | Implemented |
| RAI-PRIV-001 | Managed-identity access | Privacy & Security | DefaultAzureCredential; no static keys | `lib/ai/azure-credential.ts` | No | — | Implemented |
| RAI-PRIV-002 | Server-side model calls | Privacy & Security | Browser never calls model directly | `app/api/analyze-wound/route.ts` | No | — | Implemented |
| RAI-PRIV-003 | Privacy-safe telemetry | Privacy & Security | Blocked-key sanitisation; no clinical content | `lib/telemetry/server.ts`, `lib/ai/telemetry.ts` | No | `tests/rai/rai-telemetry.test.ts` | Implemented |
| RAI-PRIV-006 | Request size limits | Privacy & Security | Body size checked | `lib/ai/validation/image-input.ts` | No | `tests/unit/image-input.test.ts` | Implemented |
| RAI-PRIV-007 | Patient-data legal handling notice | Privacy & Security | Bilingual HCP notice requires authorized/de-identified handling under PDPA 2010 and applicable Malaysian law; makes no compliance-certification claim | `components/clinical-ai-notice.tsx` | Yes | `tests/rai/rai-controls.test.ts` | Implemented |
| RAI-PRIV-008 | Server-authorized retained analysis access | Privacy & Security | Analysis record create/list/detail APIs require a verified Entra HCP session, are scoped to that session's email, and are unavailable under client-only demo auth | `lib/auth/analysis-api-authorization.ts`, `app/api/hcp/analyses/*`, `lib/analysis/history.ts` | No | `tests/unit/auth.test.ts` | Implemented |
| RAI-INCL-001 | Bilingual AI experience | Inclusiveness | EN / Bahasa Malaysia public guidance, HCP chat and HCP analysis narratives | `lib/ai/language.ts`, `lib/ai/analysis/pipeline.ts`, `lib/i18n.ts` | Yes | `tests/unit/language.test.ts`, `tests/unit/analysis-pipeline.test.ts` | Implemented |
| RAI-INCL-002 | Responsive, installable access | Inclusiveness | PWA + responsive; WCAG audit pending | `components/pwa-provider.tsx` | No | — | Partially Implemented |

## Not implemented / not applicable (documented honestly)

- **Version-pinned guideline citations** — Planned. Current guidance is curated general knowledge
  (RAI-TRANS-005 is Partial).
- **Automated bias/fairness benchmark across skin tones with a labelled dataset** — Not Implemented
  (requires a governed, consented dataset). The *non-inference* guardrails (RAI-FAIR-001/002) are
  implemented; a quantitative fairness benchmark is not.
- **Diagnostic-accuracy certification** — Not Applicable to the current scope. The evaluation harness
  is explicitly structural (RAI-ACCT-004), not a clinical-accuracy claim.
- **Formal WCAG accessibility certification** — Planned (RAI-INCL-002 Partial).
