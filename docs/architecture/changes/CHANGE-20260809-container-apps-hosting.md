# CHANGE-20260809: Container Apps hosting

- **Date:** 2026-08-09
- **Author:** Phoenix AI migration team
- **Related ADR:** [ADR-0007](../decisions/ADR-0007-use-azure-container-apps.md)
- **Architecture version:** 1.4.0 -> 2.0.0
- **Impact level:** HIGH
- **Status:** APPROVED / IN PROGRESS

## Summary

Replace the quota-blocked Azure App Service plan with Azure Container Apps Consumption and private
ACR image delivery while preserving the standalone Next.js runtime, visible UX, API contracts,
managed identity, data services, AI behavior, and Responsible AI controls.

## Trigger

The official subscription validation failed with `SubscriptionIsOverQuotaForSku`: P0v4 had a
30-instance SKU limit, but the governing `Total Regional VMs` limit was zero. Eight US regions had
the same total limit. The subscription owner explicitly selected Container Apps rather than waiting
for an App Service support quota request.

## Components affected

| ID | Change |
| --- | --- |
| INFRA-APPSERVICE | Deprecated; no App Service resource is deployed |
| INFRA-PLAN | Deprecated; no App Service plan is deployed |
| INFRA-CONTAINERAPP | Added as the active Next.js runtime |
| INFRA-ACA-ENV | Added for Consumption execution and platform logs |
| INFRA-ACR | Added for private image storage and remote build |
| INFRA-MI | Extended with registry-scoped `AcrPull`; existing roles retained |
| INFRA-ALERTS | Retargeted from App Service metrics to Application Insights request metrics |

## Integrations affected

| ID | Change |
| --- | --- |
| INT-GHA-APPSERVICE | Deprecated Kudu/ZIP deployment path |
| INT-DEPLOY-ACR | Added remote source-to-image build path |
| INT-ACR-CONTAINERAPP | Added managed-identity OCI image pull |
| INT-APP-KV | Source becomes Container App; Key Vault-backed secret is active for `DATABASE_URL` |

## Responsible AI impact

NONE. Model family/version, API version, prompts, staged analysis, response schema, confidence and
limitation behavior, telemetry, and human oversight are unchanged. Existing RAI tests remain gates.

## Validation

Required before completion: architecture drift, Mermaid parse, Bicep build/lint, ARM validation and
what-if, ACR remote build, image inspection, Container Apps revision health, application build/tests,
database migration, managed-identity integration checks, and live UX/API smoke tests.