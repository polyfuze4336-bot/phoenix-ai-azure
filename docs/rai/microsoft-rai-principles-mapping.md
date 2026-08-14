# Microsoft Responsible AI principles — mapping

PhoenixIQ's implemented controls mapped to Microsoft's six Responsible AI principles. Each row cites a
control ID (see [control-matrix.md](./control-matrix.md)) and an honest status. Gaps are stated
plainly.

## Fairness

| Control | Implementation | Evidence | Status | Gap |
| --- | --- | --- | --- | --- |
| RAI-FAIR-001 | Skin tone is described, never converted to a Fitzpatrick type from a photo | `lib/ai/analysis/pipeline.ts`, `tests/rai/rai-unsupported-inference.test.ts` | Active | No quantitative cross-skin-tone benchmark yet |
| RAI-FAIR-002 | Prompts forbid inferring ethnicity, race, age, pain or sensation | `lib/ai/prompts/*.ts`, `tests/rai/rai-unsupported-inference.test.ts` | Active | — |
| RAI-INCL-001 | Bilingual EN / Bahasa Malaysia public and HCP AI experience | `lib/ai/language.ts`, `lib/i18n.ts` | Active | Additional languages not yet covered |

**Gap:** a governed, consented, labelled dataset to *measure* performance parity across skin tones is
not implemented. The controls above prevent *unsupported inference*; they do not certify parity.

## Reliability & Safety

| Control | Implementation | Evidence | Status |
| --- | --- | --- | --- |
| RAI-SAFE-001..012, RAI-REL-001 | Input validation, image gating, schema validation, consistency review, deterministic Parkland/TBSA, no fabricated measurements, special-site escalation, confidence capping, safe-failure, bounded execution | `lib/ai/analysis/pipeline.ts`, `lib/clinical/*`, `tests/rai/rai-safety.test.ts` | Active |
| RAI-ACCT-004 | Structural evaluation harness | `tests/evaluation/burn-wound/` | Active |

**Gap:** diagnostic-accuracy certification is out of scope; evaluation is structural.

## Privacy & Security

| Control | Implementation | Evidence | Status |
| --- | --- | --- | --- |
| RAI-PRIV-001 | Managed identity, no static keys | `lib/ai/azure-credential.ts` | Active |
| RAI-PRIV-002 | Server-side model calls only | `app/api/analyze-wound/route.ts` | Active |
| RAI-PRIV-003 | Privacy-safe telemetry (blocked-key sanitisation) | `lib/telemetry/server.ts`, `tests/rai/rai-telemetry.test.ts` | Active |
| RAI-PRIV-006 | Request size limits | `lib/ai/validation/image-input.ts` | Active |
| RAI-PRIV-007 | Bilingual patient-data legal handling notice (obligation, not certification) | `components/clinical-ai-notice.tsx`, `tests/rai/rai-controls.test.ts` | Active |

## Inclusiveness

| Control | Implementation | Evidence | Status | Gap |
| --- | --- | --- | --- | --- |
| RAI-INCL-001 | EN / Bahasa Malaysia UI and AI narrative output | `lib/ai/language.ts`, `lib/i18n.ts` | Active | More languages |
| RAI-INCL-002 | Responsive, installable (PWA) | `components/pwa-provider.tsx` | Partial | Formal WCAG audit pending |

## Transparency

| Control | Implementation | Evidence | Status |
| --- | --- | --- | --- |
| RAI-TRANS-001 | Field-level confidence | `lib/ai/schemas/burn-wound-analysis.ts` | Active |
| RAI-TRANS-002 | Limitations & missing-information disclosure | `lib/ai/analysis/pipeline.ts` | Active |
| RAI-TRANS-003 | AI labelling + analysis metadata envelope | `lib/ai/analysis/metadata.ts`, `components/v2/analysis-info-panel.tsx` | Active |
| RAI-SAFE-004 | Observation vs interpretation with evidence basis | `lib/ai/schemas/burn-wound-analysis.ts` | Active |
| RAI-TRANS-005 | Guideline basis disclosure | `lib/v2/guidelines.ts` | Partial (curated, uncited) |

## Accountability

| Control | Implementation | Evidence | Status |
| --- | --- | --- | --- |
| RAI-ACCT-001 | Human-in-the-loop review; AI never "approved" | `components/v2/clinical-review-panel.tsx` | Active |
| RAI-ACCT-002 | Analysis persistence / audit record | `lib/analysis/history.ts` | Active |
| RAI-ACCT-003 | Architecture governance (docs-sync CI) | `docs/architecture/*` | Active |
| RAI-ACCT-005 | Configurable model governance | `lib/ai/model-config.ts` | Active |
| RAI-TRANS-004 | Prompt/pipeline/schema versioning | `lib/ai/prompts/versions.ts` | Active |
