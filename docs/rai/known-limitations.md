# Known limitations

Documented, honestly. Each has a stable ID and is surfaced on the AI Assurance page's Limitations tab.

| ID | Limitation |
| --- | --- |
| LIM-001 | Confidence values reflect the model's self-report and image-quality gating, **not** validated diagnostic accuracy. |
| LIM-002 | A one-time image submission (single photo or multi-view set) cannot establish depth progression, infection, pain or sensation with certainty. |
| LIM-003 | Clinical guidance draws on **curated general references** that are not yet version-pinned citations (RAI-TRANS-005 is Partial). |
| LIM-004 | The evaluation harness measures **structural** behaviour (completeness / safety / referral appropriateness), not diagnostic correctness against clinician ground truth. |
| LIM-005 | No **quantitative** fairness benchmark across skin tones is implemented; only non-inference guardrails are (RAI-FAIR-001/002). |
| LIM-006 | A formal **WCAG accessibility** audit has not yet been completed (RAI-INCL-002 is Partial). |
| LIM-007 | Image measurements require a visible scale reference; without one, dimensions are withheld rather than estimated. |
| LIM-008 | AI-assisted output is **decision-support only** and must be confirmed by a qualified clinician. |

These limitations are not defects to hide — they define the responsible scope of the tool. See
[rai-roadmap.md](./rai-roadmap.md) for what is planned.
