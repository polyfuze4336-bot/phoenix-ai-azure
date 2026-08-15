# Responsible AI roadmap

Honest staging. **Implemented** items are in the product today; **Next** and **Future** items are
**not** present yet and are never shown in-product as current capabilities.

## Implemented (today)
- Five-layer AI assurance model maintained in the code register, documentation, and tests.
- Input validation + image-quality gating (RAI-SAFE-001/002).
- Observation/interpretation separation with field-level confidence + evidence (RAI-SAFE-004,
  RAI-TRANS-001).
- Deterministic Parkland (weight-gated) and Lund & Browder TBSA (RAI-SAFE-006/011).
- No fabricated measurements; Fitzpatrick/ethnicity non-inference (RAI-SAFE-007, RAI-FAIR-001/002).
- Schema validation, automated consistency review, special-site escalation, confidence capping,
  safe-failure (RAI-SAFE-003/005/008/009/010).
- AI labelling + analysis metadata + prompt/pipeline/schema versioning (RAI-TRANS-003/004).
- Human-in-the-loop review; audit persistence (RAI-ACCT-001/002).
- Managed identity, server-side calls, privacy-safe telemetry (RAI-PRIV-001/002/003).
- Structural evaluation harness + RAI test suite (RAI-ACCT-004).

## Next (planned, not yet implemented)
- Provide an Original-compatible, in-product AI Assurance view without reintroducing v2 routes.
- Version-pinned guideline citations to replace curated general references (upgrade RAI-TRANS-005
  Partial → Active).
- Persisted clinical-review audit trail wired to real cases (extend RAI-ACCT-001 beyond demo state).
- Formal WCAG accessibility audit (upgrade RAI-INCL-002 Partial → Active).
- Continuous evaluation published as a tracked CI artifact and trend.

## Future (aspirational, requires governed data / approvals)
- Quantitative fairness benchmark across skin tones with a governed, consented, labelled dataset.
- Prospective clinical validation against clinician ground truth.
- Additional community languages.

> These Next/Future items must not be presented to users as existing features.
