# CHANGE-20260816 — Original HCP clinical notice

## Summary

Activate the planned `UI-CLINICAL-NOTICE` component on the Original HCP analysis and chat surfaces.
The concise English/Bahasa Melayu notice reminds clinicians to use authorized and preferably
de-identified information, follow Malaysia's PDPA 2010 and professional confidentiality duties,
and treat AI output as decision support rather than diagnosis.

## Impact assessment

- **Level:** MEDIUM.
- **Architecture version:** `4.0.0` to `4.1.0`.
- **ADR:** None; this activates an already inventoried component and restores a previously governed
  control without changing product or integration strategy.
- **Changed component:** `UI-CLINICAL-NOTICE` (`PLANNED` to `ACTIVE`).
- **Changed Responsible AI control:** `RAI-PRIV-007` (restored as Active).
- **Integration impact:** None; static content uses the existing browser/application channel.
- **Azure impact:** None.

## Intended implementation

1. Add the bilingual notice component using the root `en`/`ms` language state.
2. Render it only on Original HCP analysis and chat, where patient images or clinical text enter AI
   workflows.
3. Add RAI evidence proving the required handling, confidentiality, PDPA, and decision-support
   statements remain present in both languages.

## Honest boundary

The notice communicates user obligations and product limitations. It is not legal advice, a
technical data-loss-prevention control, or evidence that the prototype or any user is compliant
with the PDPA or other law.

## Validation

PASS:

- Unit tests: 96 passed.
- Responsible AI tests: 27 passed.
- Integration tests: 14 passed.
- Production HTTP API tests: 24 passed, including missing and invalid language rejection on every
   AI route.
- Retained-route E2E tests: 24 passed, including English and Bahasa Melayu notice coverage on HCP
   analysis and chat.
- TypeScript, ESLint, and the Next.js production build passed.
- Architecture drift validation passed.
- Seven Mermaid diagrams parsed successfully.

Local validation intentionally ran without Azure AI or PostgreSQL credentials. Existing AI and
history checks reached their explicit unconfigured states; no test was skipped or allowed to hang.