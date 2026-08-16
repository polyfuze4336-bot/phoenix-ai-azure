# CHANGE-20260816: Codespaces optimisation and immutable-image rollback

- **Date:** 2026-08-16
- **Related ADR:** ADR-0014
- **Architecture version:** 6.0.0 -> 6.1.0
- **Impact level:** MEDIUM

## Summary

Add a secret-free Node.js 22 Codespaces environment, one quick verification command, explicit
developer-selected commits, and a manual known-SHA rollback through the existing deployment workflow.

## Boundaries

- Direct `main` push remains the only automatic deployment trigger.
- No daemon commits Copilot edits or deploys every file change.
- Rollback deploys an existing immutable image and never rewrites Git history or reverses migrations.
- No Azure resource, identity, RBAC, secret, model, database, storage, network, SKU, or region change.
- Responsible AI controls and AI behavior are unchanged.

## Validation

- PASS: devcontainer JSON and workflow/editor diagnostics.
- PASS: `npm run verify`, unit `107/107`, Responsible AI `29/29`, integration `14/14`, production
  HTTP API `24/24`, and full retained-route/bilingual E2E `27/27`.
- PASS: complete English and Malay HCP/Community journeys, including analysis, chat, calculators,
  guidance/first aid, mobile navigation, clinical notices, failure recovery, and logout.
- PASS: architecture drift and both changed Mermaid diagrams.
- PASS: changed-surface credential scan; the only pattern match is an existing localhost-only Prisma
  test fixture. Local Bash syntax execution is unavailable on this Windows host; the workflow runs
  Bash on its Linux runner.