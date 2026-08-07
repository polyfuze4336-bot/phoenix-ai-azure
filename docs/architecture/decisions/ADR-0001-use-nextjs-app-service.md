# ADR-0001: Host Phoenix AI as Next.js on Azure App Service

- **Status:** Accepted
- **Date:** 2024
- **Deciders:** Phoenix AI migration team
- **Related components:** APP-NEXT, INFRA-APPSERVICE, INFRA-PLAN, INFRA-MI, AI-PROVIDER, DEVOPS-GHA
- **Related integrations:** INT-BROWSER-APP, INT-APP-FOUNDRY, INT-GHA-APPSERVICE

## Context

Phoenix AI was migrated from Abacus.AI to Microsoft Azure as a **faithful parity migration**.
The imported source under `nextjs_space/` is a Next.js 14 (App Router) application whose only
live backend dependency is an LLM used by the `app/api/*` routes. The prime directive is to
preserve the original visible user experience and behaviour, so the runtime choice had to
support the existing Next.js server components, API routes, streaming, and PWA behaviour without
redesign.

## Current Architecture

- Application: Next.js 14 App Router (`app/`), React 18, TypeScript 5, standalone output
  (`node server.js`) — APP-NEXT.
- AI processing via `lib/ai` provider abstraction to Azure OpenAI / Microsoft Foundry — AI-PROVIDER.
- No hard runtime dependency on a local database or object store for parity.

## Decision

Host Phoenix AI as a **Next.js standalone server on Azure App Service (Linux, P1v3)**, using a
**user-assigned managed identity** for all Azure data-plane access, and deploy via **GitHub
Actions with OIDC federation** using **Bicep** for infrastructure.

## Alternatives Considered

- **Azure Static Web Apps + Functions:** would require splitting the App Router server and
  API routes, diverging from the imported structure and risking parity.
- **Azure Container Apps:** viable, but adds container-image build/registry overhead not needed
  for a single web workload of this size.
- **Azure Kubernetes Service:** far more operational surface than a demonstration workload warrants.

## Rationale

App Service runs the standalone Next.js server directly with minimal changes, preserving the
original UX, streaming, and API contracts. Managed identity removes stored secrets, and
GitHub Actions + Bicep give repeatable, auditable deployments.

## Architecture Impact

Establishes the baseline topology captured in [../current-architecture.md](../current-architecture.md)
and [../diagrams/current-deployment.mmd](../diagrams/current-deployment.mmd). Architecture
version `1.0.0`.

## Security Impact

- No keys in application settings; managed identity for Foundry, Storage, and Key Vault.
- Demo authentication by default; Microsoft Entra ID available as an opt-in path.

## Operational Impact

- Application Insights + Log Analytics + health probes + metric alerts provide monitoring.
- Single production slot (no deployment slots in this release).

## Cost Impact

- One App Service Plan (P1v3), one PostgreSQL Flexible Server, one Storage account, Key Vault,
  Log Analytics, and Application Insights in `rg-phoenixai-demo`.

## Risks

- Single-slot deployment means brief in-place update windows. Mitigation: off-peak deploys;
  slots can be added later via a new ADR.

## Rollback

Revert the Bicep and workflow changes; redeploy the previous known-good bundle. Because state is
in PostgreSQL/Storage (not on the App Service instance), the compute tier is disposable.

## Validation

Validated by successful `npm run build` (standalone output), health `ready` probe reporting
runtime/AI/PostgreSQL/Blob all `ok`, and Application Insights recording requests with zero
exceptions.
