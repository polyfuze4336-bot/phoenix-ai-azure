# RAI implementation inventory

Every Responsible AI control in Phoenix AI, traced to code and tests. Status is honest: **Implemented**
(Active), **Partially Implemented** (Partial), **Planned**, **Not Implemented**, or **Not Applicable**.
Control IDs are stable and match [`lib/rai/controls.ts`](../../nextjs_space/lib/rai/controls.ts).

| RAI ID | Capability | Principle | Implementation | Location | User Visible | Evidence (tests) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RAI-SAFE-001 | Image input validation | Reliability & Safety | MIME, normalized data URL/base64, signature, decoded dimensions/integrity, and size validation before any model call | `lib/ai/validation/image-input.ts`, `app/api/analyze-wound/route.ts`, `app/api/community-analyze/route.ts` | Yes | `tests/unit/image-input.test.ts`, `tests/api/routes.spec.ts`, `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-002 | Image-quality gating | Reliability & Safety | Stage-1 adequacy assessment; downstream confidence capped | `lib/ai/prompts/wound-visual-observation.ts`, `lib/ai/analysis/pipeline.ts` | Yes | `tests/unit/analysis-pipeline.test.ts` | Implemented |
| RAI-SAFE-003 | Schema-validated output | Reliability & Safety | Complete-stream detection, tolerant JSON extraction, one repair, Zod validation, required core stages, explicit non-core unavailable states | `lib/ai/streaming/collect.ts`, `lib/ai/analysis/pipeline.ts`, `lib/ai/validation/wound-analysis-schema.ts` | No | `tests/unit/ai-collect.test.ts`, `tests/unit/analysis-pipeline.test.ts`, `tests/unit/ai-parsing.test.ts` | Implemented |
| RAI-SAFE-004 | Observation vs interpretation | Transparency | Per-field observation/interpretation/confidence/basis | `lib/ai/schemas/burn-wound-analysis.ts` | Yes | `tests/unit/wound-schema.test.ts` | Implemented |
| RAI-SAFE-005 | Automated consistency review | Reliability & Safety | Stage-4 critic auditing contradictions/overclaim | `lib/ai/prompts/wound-analysis-critic.ts`, `lib/ai/analysis/pipeline.ts` | Yes | `tests/unit/analysis-pipeline.test.ts` | Implemented |
| RAI-SAFE-006 | Weight-gated Parkland | Reliability & Safety | Deterministic; never assumes weight | `lib/clinical/parkland.ts`, `lib/ai/analysis/pipeline.ts` | Yes | `tests/unit/parkland.test.ts`, `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-007 | No fabricated measurements | Reliability & Safety | Dimensions stripped without a scale reference | `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-008 | Special-site escalation | Reliability & Safety | High-risk sites never routine | `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-009 | Confidence capping | Reliability & Safety | Confidence bounded by image quality | `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-SAFE-010 | Safe-failure state | Reliability & Safety | Labelled unavailable result or actionable input rejection; disclaimer preserved | `lib/ai/validation/wound-analysis-schema.ts`, Original analysis clients | Yes | `tests/unit/ai-parsing.test.ts`, `tests/api/routes.spec.ts` | Implemented |
| RAI-SAFE-011 | Deterministic TBSA | Reliability & Safety | Lund & Browder age-adjusted | `lib/clinical/tbsa.ts` | Yes | `tests/unit/tbsa.test.ts` | Implemented |
| RAI-SAFE-012 | Clinician refinement loop | Reliability & Safety | Second-pass with human answers, no re-upload | `app/api/analyze-wound/route.ts` | Yes | — | Implemented |
| RAI-REL-001 | Bounded stage execution | Reliability & Safety | Configurable bounded timeout and three-attempt transient-only retry policy | `lib/ai/analysis/pipeline.ts`, `lib/ai/openai-compatible.ts` | No | `tests/unit/analysis-pipeline.test.ts`, `tests/unit/ai-transport.test.ts` | Implemented |
| RAI-FAIR-001 | Skin tone described, not inferred | Fairness | Fitzpatrick forced unknown unless supplied | `lib/ai/prompts/wound-clinical-interpretation.ts`, `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-unsupported-inference.test.ts` | Implemented |
| RAI-FAIR-002 | No demographic inference | Fairness | Prompts forbid ethnicity/race/age/pain inference | `lib/ai/prompts/*.ts` | Yes | `tests/rai/rai-unsupported-inference.test.ts` | Implemented |
| RAI-TRANS-001 | Field-level confidence | Transparency | high/moderate/low/insufficient per field | `lib/ai/schemas/burn-wound-analysis.ts` | Yes | `tests/unit/wound-schema.test.ts` | Implemented |
| RAI-TRANS-002 | Limitations & missing info | Transparency | Always-present disclosure lists | `lib/ai/analysis/pipeline.ts` | Yes | `tests/rai/rai-safety.test.ts` | Implemented |
| RAI-TRANS-003 | AI labelling + metadata | Transparency | Metadata envelope is generated; the complete envelope is not yet presented in the retained clinical interface | `lib/ai/analysis/metadata.ts`, `app/api/analyze-wound/route.ts` | No | `tests/rai/rai-metadata.test.ts` | Partially Implemented |
| RAI-TRANS-004 | Prompt/pipeline/schema versioning | Accountability | Version constants recorded per analysis | `lib/ai/prompts/versions.ts`, `lib/ai/analysis/metadata.ts` | Yes | `tests/rai/rai-metadata.test.ts` | Implemented |
| RAI-TRANS-005 | Guideline basis disclosure | Transparency | Curated general references, **not** version-pinned citations | `app/hcp/guidelines/_components/guidelines-client.tsx`, `lib/ai/prompts/wound-management.ts` | Yes | — | Partially Implemented |
| RAI-ACCT-001 | Human-in-the-loop review | Accountability | Review states exist; persisted review actions are not yet available in the retained clinical interface | `lib/ai/analysis/metadata.ts`, `app/hcp/analysis/_components/structured-analysis.tsx` | No | `tests/rai/rai-metadata.test.ts` | Partially Implemented |
| RAI-ACCT-002 | Analysis persistence / audit | Accountability | Persisted result + image ref + timestamp | `lib/analysis/history.ts`, `prisma/schema.prisma` | Yes | `tests/unit/db-mappings.test.ts` | Implemented |
| RAI-ACCT-003 | Architecture governance | Accountability | Mandatory docs-first change policy + local drift validation; no server-side enforcement | `docs/architecture/*`, `scripts/validate-architecture.mjs` | No | — | Implemented |
| RAI-ACCT-004 | Structural evaluation harness | Reliability & Safety | Completeness/safety/appropriateness scoring | `tests/evaluation/burn-wound/evaluate.ts` | Yes | — | Implemented |
| RAI-ACCT-005 | Configurable model governance | Accountability | Deployment is config, not hard-coded | `lib/ai/model-config.ts` | Yes | — | Implemented |
| RAI-PRIV-001 | Managed-identity access | Privacy & Security | DefaultAzureCredential; no static keys | `lib/ai/azure-credential.ts` | No | — | Implemented |
| RAI-PRIV-002 | Server-side model calls | Privacy & Security | Browser never calls model directly | `app/api/analyze-wound/route.ts` | No | — | Implemented |
| RAI-PRIV-003 | Privacy-safe telemetry | Privacy & Security | Blocked-key sanitisation; no clinical content | `lib/telemetry/server.ts`, `lib/ai/telemetry.ts` | No | `tests/rai/rai-telemetry.test.ts` | Implemented |
| RAI-PRIV-006 | Request size limits | Privacy & Security | Body size checked | `lib/ai/validation/image-input.ts` | No | `tests/unit/image-input.test.ts` | Implemented |
| RAI-PRIV-007 | Patient-data legal handling notice | Privacy & Security | Exact bilingual confidentiality and applicable Malaysian personal-data reminders; forbids real identifiable demo data unless explicitly authorized; makes no legal-advice or compliance claim | `components/clinical-ai-notice.tsx`, Original HCP analysis and chat | Yes | `tests/rai/rai-controls.test.ts`, `tests/e2e/bilingual-language.spec.ts` | Implemented |
| RAI-INCL-001 | Bilingual application experience | Inclusiveness | Root-scoped, persisted EN / Bahasa Malaysia state across HCP and Community surfaces | `lib/i18n.ts`, `components/language-provider.tsx`, `components/language-toggle.tsx` | Yes | `tests/unit/language.test.ts` | Implemented |
| RAI-INCL-003 | AI output language consistency | Inclusiveness | Every AI route requires `en` or `ms`, adds a strict non-mixing instruction, checks completed output values, and permits one language-only rewrite on a confident mismatch | `lib/ai/language.ts`, `lib/ai/analysis/pipeline.ts`, `app/api/analyze-wound/route.ts`, `app/api/hcp-chat/route.ts`, `app/api/community-chat/route.ts`, `app/api/community-analyze/route.ts` | Yes | `tests/unit/ai-language.test.ts`, `tests/rai/rai-controls.test.ts` | Implemented |
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
