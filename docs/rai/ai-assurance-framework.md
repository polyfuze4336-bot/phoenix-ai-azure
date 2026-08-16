# AI Assurance framework

Phoenix AI organises its Responsible AI controls into five assurance layers that every AI-assisted
assessment passes through. The framework is governed by this documentation, its code register,
tests, and the diagram
[`docs/architecture/diagrams/current-ai-assurance.mmd`](../architecture/diagrams/current-ai-assurance.mmd).

```
Clinical input
  → Input Assurance      (validate + quality-gate the image)
  → Analysis Assurance   (observe vs interpret, confidence + evidence)
  → Output Validation    (schema validation, consistency review, limitations)
  → Clinical Oversight   (clinician reviews / modifies / escalates)
  → Audit & Operations   (managed identity, privacy-safe telemetry, versioning, evaluation)
```

## 1. Input Assurance
- **RAI-SAFE-001** image MIME/base64/signature/decoded-dimension/integrity/size validation before any model call.
- **RAI-SAFE-002** stage-1 image-quality assessment (focus, lighting, framing, scale).
- **RAI-PRIV-006** request-size limits.

## 2. Analysis Assurance
- **RAI-SAFE-004** observation separated from interpretation, each with an evidence basis.
- **RAI-TRANS-001** per-field confidence (high/moderate/low/insufficient).
- **RAI-FAIR-001/002** no Fitzpatrick/ethnicity/age/pain inference from a photo.
- **RAI-SAFE-006/011** deterministic Parkland (weight-gated) and Lund & Browder TBSA.
- **RAI-SAFE-007** no fabricated measurements without a scale reference.

## 3. Output Validation
- **RAI-SAFE-003** complete-stream detection, one structured repair, core-stage Zod validation, and explicit non-core unavailable states (**RAI-SAFE-010**).
- **RAI-SAFE-005** automated consistency review (critic stage).
- **RAI-SAFE-008/009** special-site escalation and confidence capping.
- **RAI-TRANS-002/003** limitations, missing information and AI-generated metadata.

## 4. Clinical Oversight
- **RAI-ACCT-001** human-in-the-loop review; assessments start "Clinical review pending"; AI is never
  marked "approved".
- **RAI-SAFE-012** clinician refinement loop.
- **RAI-ACCT-002** persisted, auditable analysis record.

## 5. Audit & Operations
- **RAI-PRIV-001/002/003** managed identity, server-side calls, privacy-safe telemetry.
- **RAI-TRANS-004 / RAI-ACCT-005** prompt/pipeline/schema versioning and configurable model
  governance.
- **RAI-ACCT-003/004** mandatory docs-first architecture governance with local drift validation,
  and the structural evaluation harness. GitHub does not server-enforce docs synchronization for
  the rapid-prototype workflow (`LIM-011`).

The control register in [`lib/rai/controls.ts`](../../nextjs_space/lib/rai/controls.ts) is the machine
-readable source of truth for these layers.
