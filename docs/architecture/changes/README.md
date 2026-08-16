# Architecture Change Records

This directory holds a durable, append-only history of **architecture-impacting changes** to
Phoenix AI. A change record is the per-change companion to the higher-level
[ARCHITECTURE_CHANGELOG.md](../ARCHITECTURE_CHANGELOG.md): the changelog states *what version
changed*, while a change record captures *the before/after detail of a specific change*.

## When to add a change record

Add one whenever a change affects the architecture — i.e. it touches components,
integrations, data/identity/storage/observability strategy, or the Azure resource footprint.
Documentation-only clarifications (PATCH) do not require a change record but may add one.

## Structure

- Records: `CHANGE-YYYYMMDD-short-description.md` (one per architecture-impacting change).
  If multiple records share a date, add a numeric suffix: `CHANGE-YYYYMMDD-01-...`.
- Diagrams: `diagrams/` holds any before/after diagram snapshots referenced by a record.
- **Records are append-only** — never delete or rewrite a merged record. To correct one, add a
  new record that supersedes it.

## Record template

```markdown
# CHANGE-YYYYMMDD: <short description>

- **Date:** YYYY-MM-DD
- **Author:** <name>
- **Related ADR:** ADR-XXXX (if any)
- **Architecture version:** <before> -> <after>
- **Impact level:** NONE | LOW | MEDIUM | HIGH | MAJOR

## Summary
One paragraph describing the change.

## Before
Relevant AS-IS state (components/integrations/resources), with status labels.

## After
The new state, with status labels.

## Components affected
Component IDs added / changed / removed.

## Integrations affected
Integration IDs added / changed / removed.

## Diagrams updated
Which `docs/architecture/diagrams/*.mmd` (and any `changes/diagrams/*`) changed.

## Validation
Build, tests, Mermaid validation, drift check results.
```
