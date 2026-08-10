# CHANGE-20260810: Demo resource-group Owner access

- **Date:** 2026-08-10
- **Author:** Phoenix AI migration team
- **Related ADR:** None required; reversible operational RBAC grant at an existing resource-group boundary
- **Architecture version:** 2.0.0 -> 2.1.0
- **Impact level:** MEDIUM
- **Status:** COMPLETE

## Summary

Grant the existing Microsoft Entra security group `BFG Solutions` the built-in Azure `Owner` role
on the dedicated `rg-phoenixai-bfgs-demo` resource group. The group currently has three members.
This is the most permissive Azure control-plane role, but its scope is intentionally bounded to the
Phoenix AI demo resource group rather than the full subscription.

## Trigger and decision

The subscription operator requested the most permissive access for demo users. Tenant discovery
showed 42 users and no all-users security group; `BFG Solutions` contains only three of those users.
The operator explicitly selected the `BFG Solutions` group and the demo resource-group scope.

## Components affected

| ID | Change |
| --- | --- |
| OPS-DEMO-OWNER-RBAC | Added as the operational Owner assignment for the `BFG Solutions` group |
| INFRA-ROLES | Unchanged; continues to own workload managed-identity RBAC only |

## Integrations affected

| ID | Change |
| --- | --- |
| INT-DEMO-OPERATORS-ARM | Added for Entra-authenticated ARM and IAM administration of the demo RG |

## Security boundary and trade-off

- Group members can create, modify, and delete every resource in `rg-phoenixai-bfgs-demo` and can
  grant or revoke RBAC within that resource group.
- The grant does not elevate the group at subscription scope and does not affect other resource groups.
- Existing inherited `Contributor` at subscription scope remains unchanged.
- Membership in `BFG Solutions` becomes the access-management boundary; group owners must remove
  members who should no longer administer the demo.
- The assignment is operationally managed rather than emitted by workload Bicep, preventing an
  application deployment from silently granting human `Owner` access.

## Responsible AI impact

NONE. The role assignment does not change model deployment, prompts, analysis behavior, confidence,
limitations, human-oversight workflow, application telemetry, or any RAI control status.

## Validation

- Azure role assignment `152a0de9-1a48-4645-99d6-6ea08e5ffa31` resolves to principal type `Group`,
  built-in role `Owner` (`8e3af657-a8ff-443c-a75c-2fe8c4bcb635`), and exact scope
  `/subscriptions/376a2984-f8d4-46e3-a1cb-90f58274d2dc/resourceGroups/rg-phoenixai-bfgs-demo`.
- Effective access includes the direct RG `Owner` assignment and inherited subscription
  `Contributor`; the group has zero subscription-scoped `Owner` assignments.
- Group membership count was rechecked as three after assignment.
- Architecture drift and both changed Mermaid diagrams passed before and after the Azure operation.
- Post-change lint, typecheck, standalone production build, Bicep compilation, 104 unit tests,
  22 RAI tests, and 14 integration tests passed.
- Container App revision `ca-phoenixai-oaprp7dte7bw2--0000002` remained Healthy; live readiness
  returned `ok` for runtime, Azure AI identity, PostgreSQL, and Blob Storage after scale-up from zero.