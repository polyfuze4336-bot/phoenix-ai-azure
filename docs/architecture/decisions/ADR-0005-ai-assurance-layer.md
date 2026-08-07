# ADR-0005: Responsible AI assurance layer surfaced from a code-based control register

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** Phoenix AI migration team
- **Related components:** LIB-RAI, AI-PROMPT-VERSIONS, AI-ANALYSIS-METADATA, UI-V2-AI-ASSURANCE, AI-ANALYSIS-PIPELINE, AI-BURN-WOUND-SCHEMA, CLIN-PARKLAND, CLIN-TBSA
- **Related integrations:** INT-APP-FOUNDRY, INT-APP-INSIGHTS

## Context

The task "PhoenixIQ — Surface Responsible AI Framework, Controls and Evidence" requires making the
**already-implemented** Responsible AI / clinical-safety / transparency / human-oversight capabilities
visible and demonstrable across the app, the repository, the architecture docs and the test evidence —
**without** fabricating assurance (no cartoon shields, gamified trust scores, fake certifications, or
claims like "100% safe" / "bias free" / "clinically certified").

Many controls already existed in code (deterministic Parkland/TBSA, no-fabricated-measurements,
Fitzpatrick/ethnicity non-inference, schema validation, consistency critic, confidence capping,
special-site escalation, managed-identity access, privacy-safe telemetry) but were not discoverable as
a coherent, evidence-linked framework.

## Decision

Introduce a **Responsible AI assurance layer** whose single source of truth is **code**, not prose:

1. **Code-based control register.** `nextjs_space/lib/rai/controls.ts` enumerates every control with a
   stable ID, Microsoft RAI principle, assurance layer, honest status (Active / Partial / Planned), and
   links to code + tests. Its integrity is guarded by `tests/rai/rai-controls.test.ts`.
2. **Governance snapshot & versioning.** `lib/rai/governance.ts`, `lib/ai/prompts/versions.ts` and
   `lib/ai/analysis/metadata.ts` record the (non-secret) model deployment name, prompt/pipeline/schema
   versions, image-quality band and review status with every analysis.
3. **In-product surface.** `/v2/hcp/ai-assurance` renders the register (overview, controls, matrix,
   governance, limitations); per-assessment surfaces add an AI-generated status line, an "Analysis
   Information" panel and a clinician review panel.
4. **Documentation as evidence.** `docs/rai/` mirrors the register and maps controls to Microsoft's six
   RAI principles, with an honest "known limitations" and roadmap.
5. **Honesty rule enforced by governance.** A Responsible AI change policy (in
   `.github/copilot-instructions.md`, `AGENTS.md` and the PR template) requires status accuracy and
   forbids unevidenced assurance claims.

## Alternatives Considered

- **Documentation-only framework.** A `docs/rai/` set with no code register. Rejected — prone to drift
  and to overstating capabilities; nothing enforces honesty.
- **A prominent "trust score" / shield UI.** Rejected — explicitly disallowed; implies unearned
  assurance and misrepresents a decision-support tool as certified.
- **Marking all controls Active.** Rejected — guideline citations, quantitative fairness benchmark and
  WCAG audit are genuinely Partial/absent; they are graded honestly and tracked in the roadmap.

## Consequences

- **Positive:** Controls are discoverable, evidence-linked and testable; docs cannot silently drift from
  code; honest Partial/Planned grading preserves credibility; no new Azure resources.
- **Negative / trade-offs:** The register must be kept in sync with code changes (mitigated by the RAI
  change policy and `test:rai`); additional UI surface increases bundle size slightly.
- **Follow-ups:** Version-pin guideline citations (RAI-TRANS-005), wire clinician-review persistence to
  real cases, complete a WCAG audit (RAI-INCL-002), and add a quantitative fairness benchmark — tracked
  in `docs/rai/rai-roadmap.md`.
