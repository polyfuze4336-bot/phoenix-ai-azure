# CHANGE-20260812: GitHub OIDC deployment identity

- **Date:** 2026-08-12
- **Author:** Phoenix AI migration team
- **Related ADR:** None; completes the OIDC deployment design already represented by `DEVOPS-GHA`
- **Architecture version:** 2.1.0 -> 2.2.0
- **Impact level:** MEDIUM
- **Status:** COMPLETE

## Summary

Configure a dedicated Entra app registration and service principal named
`github-phoenixai-deploy` for secretless GitHub Actions authentication. Two federated identity
credentials trust only the repository's `Demo` and `Development` GitHub environments. GitHub
issues immutable-ID subjects for this repository:

- `repo:polyfuze4336-bot@225331490/phoenix-ai-azure@1324632738:environment:Demo`
- `repo:polyfuze4336-bot@225331490/phoenix-ai-azure@1324632738:environment:Development`

## Components and integrations

| ID | Change |
| --- | --- |
| OPS-GHA-OIDC-RBAC | Added as the operational deployment identity and RBAC boundary |
| DEVOPS-GHA | Bound to the dedicated workload identity rather than a human Azure session |
| INT-GHA-AZURE | Records environment-bound OIDC and the exact deployment scopes |

## Security boundary

- No Azure username, password, client secret, certificate, or refresh token is stored in GitHub.
- `Contributor` is assigned at subscription scope because `infra/main.bicep` has
  `targetScope = 'subscription'` and creates or updates the workload resource group.
- `Role Based Access Control Administrator` is assigned only on
  `rg-phoenixai-bfgs-demo`, allowing Bicep to manage workload identities without delegating access
  elsewhere in the subscription.
- Demo remains manual-dispatch only. Required-reviewer protection is pending because the repository
  does not identify which available collaborator is the authorized human approver.

## Responsible AI impact

NONE. Deployment authentication does not change models, prompts, analysis behavior, confidence,
limitations, telemetry content, clinical oversight, or any Responsible AI control status.

## Validation

- PASS: both federated credential subjects exactly match the immutable-ID claims issued for the
  GitHub `Demo` and `Development` environments and audience `api://AzureADTokenExchange`.
- PASS: the service principal has subscription `Contributor` and RG-scoped
  `Role Based Access Control Administrator`, with no broader RBAC delegation role.
- PASS: both GitHub environments contain the three OIDC identifiers, `PG_ADMIN_PASSWORD`, and
  `DATABASE_URL`; no Azure client secret or human credential is stored.
- PASS: architecture drift validation and both changed Mermaid diagrams parse successfully.
- PASS: Demo run `31586321978` completed OIDC login, Bicep validation, and subscription what-if.
  The later infrastructure bootstrap failed on a pre-existing PostgreSQL version mismatch: source
  requests 15, the live server is 16, and the current Azure API accepts 17 or 18. PostgreSQL
  remediation is a separate governed change because it may require a major-version upgrade.
- PENDING: configure a required human reviewer for the `Demo` GitHub environment after the
  repository owner designates the approver.