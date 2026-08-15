# Human oversight

AI output in PhoenixIQ is **decision-support only**. A qualified clinician remains the decision-maker.

## Review states
Defined in [`lib/ai/analysis/metadata.ts`](../../nextjs_space/lib/ai/analysis/metadata.ts)
(`ReviewStatus`):

| State | Meaning | Label shown |
| --- | --- | --- |
| `awaiting_review` | Default for every fresh assessment | "Clinical review pending" |
| `reviewed` | A clinician has reviewed the assessment | "Clinician reviewed" |
| `modified` | A clinician changed the assessment | "Modified by clinician" |
| `escalated` | A clinician escalated for specialist input | "Escalated" |

**AI is never labelled "approved".** The word "approved" is deliberately absent; the reviewer is a
clinician, not the model. This is asserted in
[`tests/rai/rai-metadata.test.ts`](../../nextjs_space/tests/rai/rai-metadata.test.ts).

## Surfaces
- **Assessment result** — an assurance status line (`AI-generated · Structured validation complete ·
  Clinical review pending`) and the "Analysis Information" panel
  ([`components/v2/analysis-info-panel.tsx`](../../nextjs_space/components/v2/analysis-info-panel.tsx)).
- **Case detail** — a Clinical Review panel where a clinician records reviewed / modified / escalated
  ([`components/v2/clinical-review-panel.tsx`](../../nextjs_space/components/v2/clinical-review-panel.tsx)).
  On the synthetic demo cases this records to component state (clearly a demonstration); in a wired
  deployment the same action persists to the audit record.
- **Refinement loop** — clinicians answer the model's follow-up questions to tighten an assessment
  without re-uploading (**RAI-SAFE-012**).

## Persistence
Reviewed assessments can be persisted with their result, image reference and timestamp
([`lib/analysis/history.ts`](../../nextjs_space/lib/analysis/history.ts)), providing an auditable
record of AI-assisted decisions (**RAI-ACCT-002**).
