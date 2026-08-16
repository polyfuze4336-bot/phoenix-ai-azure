# CHANGE-20260816: Safe analysis retry, reliability telemetry and prototype delivery

- **Date:** 2026-08-16
- **Author:** Phoenix AI prototype maintainers
- **Related ADR:** ADR-0013
- **Architecture version:** 5.1.0 -> 6.0.0
- **Impact level:** HIGH

## Summary

Add retained-context analysis recovery, privacy-safe analysis lifecycle telemetry, a safe-demo-image
API reliability harness, low-information degradation for explicit unreadable/non-burn model output,
and one approval-free direct-main Azure deployment workflow.

## Components affected

- `UI-HCP`, `UI-I18N`, `API-HCP-ANALYSIS`, `AI-ANALYSIS-PIPELINE`, `AI-TELEMETRY`, `AI-RELIABILITY-TEST`
- `OBS-APPINSIGHTS`, `DEVOPS-GHA`, `GOV-CI`, `GOV-VALIDATE`

## Integrations affected

- `INT-BROWSER-APP`, `INT-APP-APPINSIGHTS`, `INT-GHA-AZURE`, `INT-DEPLOY-ACR`,
  `INT-GHA-DBMIGRATE`

## Boundaries

- Image data remains ephemeral and is never added to telemetry.
- Reliability testing measures API completion only, not diagnostic or clinical accuracy.
- Empty or malformed core model output still fails; only structurally explicit unreadable-image or
  non-burn output degrades to an honest low-information result.
- Azure resources, region, identity, RBAC, secrets, model, storage, database schema, and network are
  unchanged. Existing OIDC authentication and reviewer-free Development secret scope are retained.

## Validation plan

- Focused safe-retry UI, telemetry-sanitization, and reliability-summary tests.
- Pre-fix live baseline: 2/10 completed (20%); 8/10 returned `AI_SCHEMA_VALIDATION_FAILED`, with no
  timeout or parsing failure.
- Post-deployment live result: 10/10 completed (100%) with 28,584 ms average latency, no failures,
  timeouts, or parsing failures. The `>=95%` demo API-completion target was met under these recorded
  sequential synthetic-image conditions; this is not clinical-accuracy evidence or an SLA.
- Typecheck, unit, RAI, production build, workflow diagnostics, Bicep, Mermaid, architecture drift,
  secret scan, Actions deployment, named-revision health, liveness, and HCP/community smoke checks.