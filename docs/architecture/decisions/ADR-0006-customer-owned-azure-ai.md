# ADR-0006: Provision a customer-owned Azure AI account per environment

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Phoenix AI migration team and BFG Solutions subscription owner
- **Related components:** INFRA-BICEP, INFRA-FOUNDRY-CONN, AZ-FOUNDRY, INFRA-MI, AI-PROVIDER
- **Related integrations:** INT-APP-FOUNDRY, INT-GHA-AZURE

## Context

The existing Bicep references the shared Azure AI account `aif-yfjw6y` in `rg-aisgemini-dev`.
The approved customer subscription, `BFG Solutions-JDNAINexus`, is empty and cannot reuse that
resource without creating a cross-subscription operational dependency. Phoenix AI must deploy into
the dedicated `rg-phoenixai-bfgs-demo` resource group in East US 2 and remain independently owned,
billed, secured, and removable by the customer.

## Current Architecture

`AZ-FOUNDRY` is the model backend for `INT-APP-FOUNDRY`. The Next.js `AI-PROVIDER` calls it through
the OpenAI-compatible chat-completions API and obtains a bearer token through `INFRA-MI`. The
application contract, prompts, model selection, streaming behavior, and Responsible AI controls do
not depend on who owns the Azure AI account.

## Decision

Provision one `Microsoft.CognitiveServices/accounts` resource with `kind: AIServices`, S0 SKU,
local authentication disabled, and one `gpt-4o` `2024-11-20` Global Standard deployment at 10K TPM
inside each Phoenix AI environment resource group. Grant the application user-assigned managed
identity only the Cognitive Services OpenAI User role on that account. Bicep outputs the account
endpoint consumed by the existing application settings.

## Alternatives Considered

- **Reuse the shared `aif-yfjw6y` account.** Rejected because it is outside the customer subscription
  and would couple access, quota, billing, lifecycle, and incident response to another owner.
- **Use an Azure AI API key.** Rejected because managed identity is already implemented and avoids
  long-lived inference credentials.
- **Substitute another model/version during deployment.** Rejected because it would change a governed
  AI behavior surface and require separate evaluation and Responsible AI evidence updates.

## Rationale

Environment ownership gives the customer clear cost and quota boundaries, allows least-privilege
RBAC at the account scope, keeps deployment self-contained, and preserves the validated application
contract. East US 2 has sufficient `AIServices.S0` account quota and 450K TPM of Global Standard
`gpt-4o` quota; this deployment requests 10K TPM.

## Architecture Impact

Architecture version changes from 1.3.0 to 1.4.0. `AZ-FOUNDRY` changes ownership from shared
external Azure to environment-owned Azure; `INFRA-FOUNDRY-CONN` changes from a reference-only RBAC
module to an account/model/RBAC provisioning module. The stable integration `INT-APP-FOUNDRY`
remains unchanged. Current architecture, deployment diagram, inventories, and resource map are
updated in the same change.

## Security Impact

Local account authentication is disabled. The app uses a user-assigned managed identity and the
inference-only Cognitive Services OpenAI User role. No model key is generated, stored, or exposed to
the browser. Public network access remains enabled for the managed App Service-to-Azure AI path.

## Operational Impact

The customer owns model availability, quota, cost, retirement response, and monitoring. The Bicep
deployment creates the account before the model and role assignment, and validation must confirm
role propagation before live inference testing.

## Cost Impact

The S0 account has no fixed account charge; model inference is usage-based. A 10K TPM deployment
reserves quota, not prepaid throughput. The customer subscription receives all inference charges.

## Risks

- `gpt-4o` `2024-11-20` is catalogued as Legacy. Deployment validation must fail closed if Azure no
  longer permits new deployments; a model change requires a separate governed AI change.
- Role assignments can take time to propagate. Deployment verification retries managed-identity
  inference after confirming the assignment exists.
- Global Standard processing has different data-zone characteristics from regional Standard;
  this is explicitly recorded in the deployment plan.

## Rollback

Redeploy the prior Bicep revision to reference an approved existing account, or remove the dedicated
resource group only with explicit customer approval after preserving required data. No application
rollback is needed because the API contract is unchanged.

## Validation

Bicep build/lint, subscription validation and what-if, architecture drift validation, Mermaid parse,
managed-identity role inspection, and live streaming/vision smoke tests must pass.