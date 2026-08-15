# Control matrix

Stable control IDs. The authoritative, machine-readable version is
[`lib/rai/controls.ts`](../../nextjs_space/lib/rai/controls.ts); this table is a human-readable mirror.
Status: **Active** (implemented + evidenced) · **Partial** · **Planned**.

| ID | Title | Principle | Layer | Status |
| --- | --- | --- | --- | --- |
| RAI-SAFE-001 | Image input validation | Reliability & Safety | Input | Active |
| RAI-SAFE-002 | Image-quality gating | Reliability & Safety | Input | Active |
| RAI-PRIV-006 | Request size limits | Privacy & Security | Input | Active |
| RAI-SAFE-004 | Observation vs interpretation | Transparency | Analysis | Active |
| RAI-FAIR-001 | Skin tone described, not inferred | Fairness | Analysis | Active |
| RAI-FAIR-002 | No demographic inference | Fairness | Analysis | Active |
| RAI-SAFE-006 | Weight-gated Parkland | Reliability & Safety | Analysis | Active |
| RAI-SAFE-011 | Deterministic TBSA | Reliability & Safety | Analysis | Active |
| RAI-SAFE-007 | No fabricated measurements | Reliability & Safety | Analysis | Active |
| RAI-TRANS-005 | Guideline basis disclosure | Transparency | Analysis | Partial |
| RAI-SAFE-003 | Schema-validated output | Reliability & Safety | Output | Active |
| RAI-SAFE-005 | Automated consistency review | Reliability & Safety | Output | Active |
| RAI-SAFE-008 | Special-site referral escalation | Reliability & Safety | Output | Active |
| RAI-SAFE-009 | Confidence capping on poor images | Reliability & Safety | Output | Active |
| RAI-SAFE-010 | Safe-failure state | Reliability & Safety | Output | Active |
| RAI-TRANS-001 | Field-level confidence | Transparency | Output | Active |
| RAI-TRANS-002 | Limitations & missing-info disclosure | Transparency | Output | Active |
| RAI-TRANS-003 | AI labelling + analysis metadata | Transparency | Output | Partial |
| RAI-TRANS-004 | Prompt/pipeline/schema versioning | Accountability | Output | Active |
| RAI-ACCT-001 | Human-in-the-loop review | Accountability | Oversight | Partial |
| RAI-SAFE-012 | Clinician refinement loop | Reliability & Safety | Oversight | Active |
| RAI-ACCT-002 | Analysis persistence / audit record | Accountability | Oversight | Active |
| RAI-PRIV-001 | Managed-identity access | Privacy & Security | Operations | Active |
| RAI-PRIV-002 | Server-side model calls | Privacy & Security | Operations | Active |
| RAI-PRIV-003 | Privacy-safe telemetry | Privacy & Security | Operations | Active |
| RAI-ACCT-005 | Configurable model governance | Accountability | Operations | Active |
| RAI-ACCT-003 | Architecture governance (docs-sync) | Accountability | Operations | Active |
| RAI-ACCT-004 | Structural evaluation harness | Reliability & Safety | Operations | Active |
| RAI-INCL-001 | Bilingual public experience | Inclusiveness | Operations | Active |
| RAI-INCL-002 | Responsive, installable access | Inclusiveness | Operations | Partial |
| RAI-REL-001 | Bounded stage execution | Reliability & Safety | Operations | Active |
