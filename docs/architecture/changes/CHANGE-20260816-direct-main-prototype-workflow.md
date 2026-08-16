# CHANGE-20260816: Direct-main rapid-prototype workflow

- **Date:** 2026-08-16
- **Author:** Phoenix AI prototype maintainers
- **Related ADR:** ADR-0012
- **Architecture version:** 4.1.0 -> 5.0.0
- **Impact level:** MAJOR

## Summary

Align repository automation with the approved prototype workflow: direct `main` commits, no PR or
environment approval gates, non-gating push CI, and automatic Development deployment to Azure.

## Before

- `main` was unprotected in GitHub, but CONTRIBUTING still prohibited direct pushes.
- CI and infrastructure workflows listened for pull requests.
- a separate Architecture Governance workflow could fail independently.
- a report-only dependency audit consumed a full CI job.
- Development deployment already ran successfully on every `main` push.

## After

- direct reviewed commits and pushes to `main` are the documented default.
- CI and Development deployment listen to `main` push/manual events; deployment remains independent.
- Demo, infrastructure, and database operations remain manual and reviewer-free.
- `GOV-CI` is `LEGACY`; `GOV-VALIDATE` remains mandatory locally.
- GitHub settings remain unprotected with no rulesets or environment protection rules.

## Components affected

- `DEVOPS-GHA`: changed workflow policy.
- `GOV-CI`: `ACTIVE` to `LEGACY`.
- `GOV-VALIDATE`: remains `ACTIVE`, local rather than server-enforced.

## Integrations affected

- `INT-GHA-AZURE`: same OIDC/RBAC/data; Development trigger clarified as direct `main` push.

## Diagrams updated

- `docs/architecture/diagrams/current-architecture.mmd`
- `docs/architecture/diagrams/current-deployment.mmd`

## Validation

- PASS: all five active workflow files parse as YAML.
- PASS: ESLint, TypeScript, 96 unit, 27 RAI, 14 integration, 24 production HTTP API, and 24 retained-route E2E tests.
- PASS: offline validation of two Prisma migrations and the Next.js production build.
- PASS: Bicep compilation, architecture drift validation, and all seven Mermaid diagrams.
- PASS: fast-forwarded `main` to `3cec995`; only CI run `31929174358` and Development deployment
	run `31929174360` were triggered, and both completed successfully. No Architecture Governance run
	was created. An independent probe returned `alive` from `/api/health/live` and HTTP 200 with
	Phoenix AI content from `/`.