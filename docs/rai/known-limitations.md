# Known limitations

Documented, honestly. Each has a stable ID in the governed control register and documentation.

| ID | Limitation |
| --- | --- |
| LIM-001 | Confidence values reflect the model's self-report and image-quality gating, **not** validated diagnostic accuracy. |
| LIM-002 | A single photograph cannot establish depth progression, infection, pain or sensation with certainty. |
| LIM-003 | Clinical guidance draws on **curated general references** that are not yet version-pinned citations (RAI-TRANS-005 is Partial). |
| LIM-004 | The evaluation harness measures **structural** behaviour (completeness / safety / referral appropriateness), not diagnostic correctness against clinician ground truth. |
| LIM-005 | No **quantitative** fairness benchmark across skin tones is implemented; only non-inference guardrails are (RAI-FAIR-001/002). |
| LIM-006 | A formal **WCAG accessibility** audit has not yet been completed (RAI-INCL-002 is Partial). |
| LIM-007 | Image measurements require a visible scale reference; without one, dimensions are withheld rather than estimated. |
| LIM-008 | AI-assisted output is **decision-support only** and must be confirmed by a qualified clinician. |
| LIM-009 | The runtime does not currently provide an in-product AI Assurance page; reviewers must use this governed documentation and test evidence. |
| LIM-010 | AI output-language detection is heuristic: short or highly technical output may be classified as ambiguous and accepted. A confidently mismatched response is rewritten once only; retries are deliberately bounded to prevent loops. |
| LIM-011 | Architecture documentation synchronization is required by repository policy and checked locally, but is not enforced by a GitHub status check in the rapid-prototype direct-main workflow. |
| LIM-012 | Decoding verifies structural image integrity and dimensions but does not prove that an image is clinically useful; focus, lighting, framing, occlusion and scale adequacy remain model-assessed and clinician-reviewed. |

These limitations are not defects to hide — they define the responsible scope of the tool. See
[rai-roadmap.md](./rai-roadmap.md) for what is planned.
