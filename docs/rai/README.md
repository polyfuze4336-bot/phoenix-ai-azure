# PhoenixIQ — Responsible AI & AI Assurance

This directory documents the Responsible AI (RAI) controls that are **actually implemented** in
PhoenixIQ, mapped to Microsoft's six Responsible AI principles, traced to source code and tests, and
surfaced to clinicians in the product.

> **Honesty rule.** Nothing here claims a capability that is not in the codebase. Controls are marked
> **Active**, **Partial** or **Planned**. PhoenixIQ makes **no** claim of being "100% safe", "bias
> free", "hallucination free", "clinically certified" or "regulatory approved". AI output is
> decision-support only and is reviewed by a clinician.

## What PhoenixIQ is (and is not)

- **Is:** an AI-assisted burn & wound assessment aid that separates observation from interpretation,
  gates confidence on image quality, computes clinically sensitive quantities deterministically, runs
  an automated consistency review, and presents results for clinician review.
- **Is not:** an autonomous diagnostic device, a certified medical device, or a replacement for
  clinical judgement.
- **Data-handling boundary:** HCP surfaces warn that patient data and images must be handled under
  Malaysia's PDPA 2010 and applicable Malaysian law. This is an obligation notice, not a compliance
  certification.

## Contents

| Document | Purpose |
| --- | --- |
| [executive-summary.md](./executive-summary.md) | Two-page summary for reviewers/leadership |
| [rai-implementation-inventory.md](./rai-implementation-inventory.md) | Every control: principle, implementation, location, evidence, test, status |
| [microsoft-rai-principles-mapping.md](./microsoft-rai-principles-mapping.md) | Mapping to Microsoft's six RAI principles + gaps |
| [ai-assurance-framework.md](./ai-assurance-framework.md) | The five-layer assurance model |
| [control-matrix.md](./control-matrix.md) | Stable control IDs and status |
| [model-governance.md](./model-governance.md) | Model selection, versioning, identity |
| [prompt-governance.md](./prompt-governance.md) | Prompt versioning and change control |
| [human-oversight.md](./human-oversight.md) | Human-in-the-loop review model |
| [clinical-safety.md](./clinical-safety.md) | Deterministic calculations and safety rules |
| [fairness-and-skin-tone.md](./fairness-and-skin-tone.md) | Skin-tone handling and non-inference |
| [transparency.md](./transparency.md) | Confidence, limitations, metadata, labelling |
| [evaluation-framework.md](./evaluation-framework.md) | The structural evaluation harness |
| [known-limitations.md](./known-limitations.md) | Documented limitations (with IDs) |
| [rai-roadmap.md](./rai-roadmap.md) | Implemented / Next / Future |
| [rai-code-traceability.md](./rai-code-traceability.md) | Control → source file map |

## Single source of truth

The control register that drives the in-product **AI Assurance** page
(`/v2/hcp/ai-assurance`) and this documentation lives in code at
[`nextjs_space/lib/rai/controls.ts`](../../nextjs_space/lib/rai/controls.ts). Its integrity is
guarded by [`tests/rai/rai-controls.test.ts`](../../nextjs_space/tests/rai/rai-controls.test.ts).
