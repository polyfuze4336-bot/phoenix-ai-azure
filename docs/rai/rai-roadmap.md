# Responsible AI roadmap

Honest staging. **Implemented** items are in the product today; **Next** and **Future** items are
**not** present yet and are never shown in-product as current capabilities.

## Implemented (today)
- Five-layer AI assurance model maintained in the code register, documentation, and tests.
- Input validation + image-quality gating (RAI-SAFE-001/002).
- Narrow clinical-imagery filter boundary: Violence input is classified but non-blocking, while
  output and all other retained category protections remain blocking (RAI-SAFE-014).
- Observation/interpretation separation with field-level confidence + evidence (RAI-SAFE-004,
  RAI-TRANS-001).
- Deterministic Parkland (weight-gated) and Lund & Browder TBSA (RAI-SAFE-006/011).
- No fabricated measurements; Fitzpatrick/ethnicity non-inference (RAI-SAFE-007, RAI-FAIR-001/002).
- Schema validation, automated consistency review, special-site escalation, confidence capping,
  safe-failure (RAI-SAFE-003/005/008/009/010).
- AI labelling + analysis metadata + prompt/pipeline/schema versioning (RAI-TRANS-003/004).
- Human-in-the-loop review; audit persistence (RAI-ACCT-001/002).
- Managed identity, server-side calls, privacy-safe telemetry (RAI-PRIV-001/002/003).
- Privacy-safe wound-analysis failure correlation in JSON/headers plus allowlisted Azure filter
  source/category/severity when the provider supplies them (RAI-PRIV-003).
- Bilingual patient-data, confidentiality, PDPA, and clinical decision-support notice on HCP AI
  input surfaces (RAI-PRIV-007).
- Structural evaluation harness + RAI test suite (RAI-ACCT-004).
- All-route AI language propagation, strict non-mixing instructions, completed-output detection, and
  one bounded rewrite retry (RAI-INCL-003).
- Thirty-second bounded model-call default with one schema-validated Acute Burn single-pass fallback
  after transient staged failure; provider safety and content-filter stops remain terminal
  (RAI-REL-001, RAI-SAFE-010).

## Next (planned, not yet implemented)
- Provide an in-product AI Assurance view consistent with the retained experience.
- Version-pinned guideline citations to replace curated general references (upgrade RAI-TRANS-005
  Partial → Active).
- Persisted clinical-review audit trail wired to real cases (extend RAI-ACCT-001 beyond demo state).
- Operate verified Entra HCP identity, private Blob image retention and PostgreSQL history
  together in the target environment; establish an organisational retention/deletion
  policy before promising durable audit coverage in the default demo mode (RAI-ACCT-002).
- Formal WCAG accessibility audit (upgrade RAI-INCL-002 Partial → Active).
- Continuous evaluation published as a tracked CI artifact and trend.

## Future (aspirational, requires governed data / approvals)
- Quantitative fairness benchmark across skin tones with a governed, consented, labelled dataset.
- Prospective clinical validation against clinician ground truth.
- Additional community languages.

> These Next/Future items must not be presented to users as existing features.
# Community burn prototype review

Clinical/manual review remains required for the new public red-flag combinations, indeterminate
handling, and AI image observation wording before this prototype can be treated as clinically
validated. The existing HCP structural evaluation harness does not establish Community
diagnostic accuracy (RAI-SAFE-013).
