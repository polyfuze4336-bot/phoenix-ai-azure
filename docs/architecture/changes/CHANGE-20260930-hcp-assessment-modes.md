# CHANGE-20260930 — HCP assessment modes

## Summary

The shared HCP portal now has two explicit modes: `acute_burn` and `general_wound`.
The modes reuse the existing shell, EN/BM provider, Azure AI provider, image validation,
PostgreSQL database and retained-history APIs.

## Architecture impact

- **Impact:** MEDIUM
- **Version:** 8.2.0 → 8.3.0
- **ADR:** Not required. This extends existing components and integrations without changing topology.
- **Data:** `AnalysisRecord.assessmentType` is nullable. New rows require an explicit value; existing
  rows remain unclassified, are counted in a compatibility notice, and are not silently assigned.
- **AI:** Acute Burn adds clinical TIMERS. General Wound has a separate prompt and schema and cannot
  emit TBSA, Rule of Nines, Lund & Browder, Parkland or burn-fluid fields.
- **References:** General Wound reference cards are bilingual placeholders without links or files.

## Validation

TypeScript, lint, unit, API, E2E, RAI, migration, architecture and production-build validation are
required before completion.
