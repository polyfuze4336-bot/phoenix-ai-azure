# CHANGE-20260809: Customer-owned Azure AI account

- **Date:** 2026-08-09
- **Author:** Phoenix AI migration team
- **Related ADR:** [ADR-0006](../decisions/ADR-0006-customer-owned-azure-ai.md)
- **Architecture version:** 1.3.0 -> 1.4.0
- **Impact level:** MEDIUM
- **Status:** APPROVED / IN PROGRESS

## Summary

Move the Phoenix AI deployment from a shared external Azure AI account to an environment-owned
Azure AI Services account and `gpt-4o` deployment in `rg-phoenixai-bfgs-demo`, while preserving the
existing managed-identity integration and all application-visible AI behavior.

## Before

- `AZ-FOUNDRY` was `aif-yfjw6y` in external resource group `rg-aisgemini-dev`.
- `INFRA-FOUNDRY-CONN` only referenced that account and created an inference role assignment.
- The reference deployment ran in `rg-phoenixai-demo` in Southeast Asia on P1v3.

## After

- `AZ-FOUNDRY` is an `AIServices` S0 account owned by `rg-phoenixai-bfgs-demo` in East US 2.
- Bicep provisions `gpt-4o` `2024-11-20` Global Standard at 10K TPM and grants the app identity the
  Cognitive Services OpenAI User role.
- The customer deployment uses a P0v4 Linux App Service plan, the lowest validated worker quota in
  the target subscription.
- `INT-APP-FOUNDRY`, model version, API version, prompts, pipeline, response contracts, and RAI
  controls remain unchanged.

## Components affected

| ID | Change |
| --- | --- |
| INFRA-BICEP | Customer resource group, region, plan SKU, and AI ownership parameters |
| INFRA-FOUNDRY-CONN | Reference-only module becomes account/model/RBAC provisioning module |
| AZ-FOUNDRY | Shared external resource becomes environment-owned resource |
| INFRA-MI | Same identity, now assigned inference access to the owned account |

## Integrations affected

| ID | Change |
| --- | --- |
| INT-APP-FOUNDRY | Destination ownership changes; protocol, auth, data, and runtime behavior do not |
| INT-GHA-AZURE | Deployment creates the AI account/model in the workload resource group |

## Diagrams updated

- `docs/architecture/diagrams/current-architecture.mmd`
- `docs/architecture/diagrams/current-deployment.mmd`

## Validation

Required before completion: Bicep build/lint, subscription validation/what-if, Mermaid parse,
`node nextjs_space/scripts/validate-architecture.mjs`, application test suite, managed-identity RBAC
inspection, and live AI streaming/vision smoke tests.