# CHANGE-20260811: Enable all GitHub Actions workflow permissions

- **Date:** 2026-08-11
- **Author:** Copilot Coding Agent
- **Related ADR:** N/A
- **Architecture version:** 2.1.0 -> 2.2.0
- **Impact level:** LOW

## Summary

All repository GitHub Actions workflows now explicitly set `permissions: write-all` to satisfy the
operator request to enable all workflow permissions.

## Before

- Workflow token permissions were least-privilege per file (for example `contents: read`, and
  `id-token: write` only where OIDC login is used).
- DevOps component `DEVOPS-GHA` and build-time integrations were active with constrained token scope.

## After

- Every workflow file under `.github/workflows/` in active use now declares
  `permissions: write-all`.
- No workflow topology, trigger, environment gate, or Azure integration endpoint changed.

## Components affected

- Changed: `DEVOPS-GHA`

## Integrations affected

- Changed: `INT-GHA-AZURE`, `INT-DEPLOY-ACR`, `INT-GHA-DBMIGRATE`

## Diagrams updated

- None (no topology change).

## Validation

- Workflow YAML syntax checked locally.
- `nextjs_space/scripts/validate-architecture.mjs` passes.
