# Human oversight

AI output in Phoenix AI is **decision-support only**. A qualified clinician remains the decision-maker.

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
- **Assessment result** — structured confidence, limitations, missing information and evidence are
  shown for clinician review. The complete metadata envelope is not currently presented.
- **Review actions** — persisted reviewed / modified / escalated actions are not currently available
  in the retained clinical interface; `RAI-ACCT-001` remains Partial.
- **Refinement loop** — clinicians answer the model's follow-up questions to tighten an assessment
  without re-uploading (**RAI-SAFE-012**).

## Persistence
Reviewed assessments can be persisted with their result, image reference and timestamp
([`lib/analysis/history.ts`](../../nextjs_space/lib/analysis/history.ts)), providing an auditable
record of AI-assisted decisions (**RAI-ACCT-002**).
