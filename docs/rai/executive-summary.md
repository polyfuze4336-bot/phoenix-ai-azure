# Phoenix AI Responsible AI — executive summary

## What this is
Phoenix AI is an AI-assisted burn & wound assessment tool. This summary describes the Responsible AI
controls that are **actually implemented in the codebase today**, with links to the code and the tests
that evidence them. It intentionally makes no unverified claims of certification, approval or
diagnostic accuracy.

## Approach
AI output is treated as **clinical decision-support under human supervision**. Clinically sensitive
values (fluid resuscitation, TBSA) are computed **deterministically**, not guessed by the model, and a
layer of deterministic safety rules runs after every AI analysis.

## Assurance model (five layers)
1. **Input** — validation + image-quality gating.
2. **Analysis** — separated observation vs interpretation, field-level confidence + evidence, bounded
   execution.
3. **Output** — schema validation, automated consistency review, no fabricated measurements,
   confidence capping, special-site escalation, safe failure.
4. **Oversight** — AI labelling, transparency of limitations, clinician review (reviewed / modified /
   escalated), audit persistence.
5. **Operations** — managed-identity access, server-side-only model calls, privacy-safe telemetry,
   model/prompt/schema versioning, structural evaluation harness.

## Evidence
- **31 controls** in a single source of truth
  ([`lib/rai/controls.ts`](../../nextjs_space/lib/rai/controls.ts)), each mapped to code, a Microsoft
  RAI principle and (where applicable) tests.
- **RAI test suite** (`npm run test:rai`) plus the existing unit and evaluation suites.
- Governed code register, documentation, and test evidence; a complete in-product assurance view is
   not currently published.

## Honest limitations
Confidence ≠ validated accuracy; guideline basis is curated (not version-pinned citations — Partial);
no quantitative skin-tone fairness benchmark yet; no formal WCAG audit yet; the evaluation harness
measures structure, not diagnostic correctness. See [known-limitations.md](./known-limitations.md) and
[rai-roadmap.md](./rai-roadmap.md).

## Microsoft RAI mapping
Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, Accountability — see
[microsoft-rai-principles-mapping.md](./microsoft-rai-principles-mapping.md).
