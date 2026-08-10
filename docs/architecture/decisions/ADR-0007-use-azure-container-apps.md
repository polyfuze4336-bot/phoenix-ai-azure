# ADR-0007: Host Phoenix AI on Azure Container Apps Consumption

- **Status:** Accepted; supersedes ADR-0001
- **Date:** 2026-08-09
- **Deciders:** Phoenix AI migration team and BFG Solutions subscription owner
- **Related components:** APP-NEXT, INFRA-CONTAINERAPP, INFRA-ACA-ENV, INFRA-ACR, INFRA-MI, INFRA-APPSERVICE, INFRA-PLAN
- **Related integrations:** INT-BROWSER-APP, INT-DEPLOY-ACR, INT-ACR-CONTAINERAPP, INT-GHA-AZURE, INT-GHA-APPSERVICE

## Context

The approved customer deployment initially selected Azure App Service P0v4 in East US 2. ARM
subscription validation rejected the plan because the subscription's governing App Service `Total
Regional VMs` quota is zero. P0v4 reports a separate 30-worker SKU limit, but the total limit takes
precedence. The same zero total was confirmed across eight US regions and is marked non-adjustable
through `Microsoft.Quota`; preserving App Service would require an Azure support enablement request.
The subscription owner selected Azure Container Apps as the recovery path.

## Current Architecture

`APP-NEXT` is a Next.js 14 standalone Node 22 server with API routes, SSR, streaming, and PWA assets.
It listens on port 3000 and has no local-disk persistence requirement. `INFRA-MI` supplies Azure AI,
Blob, Key Vault, and telemetry access. PostgreSQL and Blob hold state outside the compute host.

## Decision

Run `APP-NEXT` in Azure Container Apps Consumption with external HTTPS ingress, single-revision
traffic, startup/liveness/readiness probes on `/api/health/live`, and zero-to-three replica scaling.
Store its OCI image in an environment-owned Azure Container Registry Basic account. Build remotely
with ACR Tasks, disable registry admin credentials, and grant the existing user-assigned managed
identity `AcrPull` at registry scope. Resolve `DATABASE_URL` from Key Vault through the same identity.

## Alternatives Considered

- **Request App Service quota.** Preserves ADR-0001 but introduces an external support dependency and
  indeterminate delay; the subscription owner selected Container Apps instead.
- **Azure Static Web Apps plus Functions.** Rejected because splitting App Router SSR/API routes
  changes the runtime topology and risks parity.
- **AKS.** Rejected because its cost and operational surface are disproportionate for one demo app.

## Rationale

The existing standalone server is container-compatible without application behavior changes.
Container Apps Consumption avoids the blocked App Service worker quota, can scale to zero for a demo,
supports managed identity and Key Vault references, and keeps state in existing managed services.
ACR adds image-build/storage overhead but provides private, repeatable, credential-free delivery.

## Architecture Impact

Architecture version changes from 1.4.0 to 2.0.0. `INFRA-APPSERVICE` and `INFRA-PLAN` become
deprecated. `INFRA-CONTAINERAPP`, `INFRA-ACA-ENV`, and `INFRA-ACR` are added. `INT-GHA-APPSERVICE`
becomes deprecated; `INT-DEPLOY-ACR` and `INT-ACR-CONTAINERAPP` are added. Application runtime and
all data/AI contracts are unchanged.

## Security Impact

The ACR admin account is disabled. The user-assigned identity receives only `AcrPull` on ACR and
existing resource-scoped data roles. `DATABASE_URL` remains in Key Vault and is injected through a
Key Vault-backed Container Apps secret. External ingress enforces HTTPS; the container runs as the
non-root Node user and has no writable application dependency.

## Operational Impact

Deployment becomes two-stage: provision infrastructure with a private bootstrap revision, build the
image remotely in ACR, then deploy the immutable image tag with external ingress. Readiness gates
traffic in single-revision mode. Log Analytics receives platform/container logs; Application Insights
continues application telemetry. Rollback selects the previous image tag in a new revision.

## Cost Impact

Removes the fixed P0v4 plan. Adds ACR Basic and consumption-based Container Apps execution. With
minimum replicas zero, idle compute cost is minimized, with cold-start latency accepted for the demo.

## Risks

- Scale-to-zero introduces cold starts; health probes and a generous startup threshold mitigate this.
- ACR role propagation can delay the first private image pull; deployment verifies the assignment
  before switching from the private bootstrap revision.
- The local Docker engine is unavailable; ACR remote build is therefore a required deployment step.

## Rollback

Redeploy the previous known-good ACR image tag. Returning to App Service requires restoring ADR-0001
in a new ADR and first obtaining nonzero total App Service worker quota. Stateful resources are not
affected by compute rollback.

## Validation

Bicep build/lint, subscription validation/what-if, remote image build, image metadata inspection,
revision health, live/ready probes, browser/API journeys, managed-identity AI/Blob access, database
migrations, architecture drift, Mermaid parse, and Responsible AI tests must pass.