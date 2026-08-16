# CHANGE-20260816: PostgreSQL version and prototype workflow audit

- **Date:** 2026-08-16
- **Related ADR:** None
- **Architecture version:** 6.1.0 -> 6.1.1
- **Impact level:** LOW (documentation correction only)

## Summary

A read-only Azure control-plane and SQL audit verified that the deployed Phoenix AI database is
PostgreSQL 17.10. The application workflow inventory verified that the repository already has the
minimal prototype shape: one direct-main deployment workflow and one manual infrastructure workflow.

## Boundaries

- No PostgreSQL upgrade, restore, restart, configuration change, schema change, or data write.
- No temporary server or PITR restore because PostgreSQL 17 requires no upgrade.
- No Bicep change; the declared major version already matches deployed major version 17.
- No workflow change; the existing fast unit tests are retained and no governance/approval gates
  exist in active GitHub Actions.
- No resource, identity, RBAC, secret, model, storage, network, SKU, region, UI, API, or AI behavior
  change.

## Validation

- PASS: read-only GitHub OIDC audit run `31944207967` selected the expected subscription.
- PASS: Azure server state `Ready`; Azure major/minor `17`/`10`; SQL `server_version` `17.10`.
- PASS: application endpoint host matches the deployed Flexible Server FQDN and database `phoenix`.
- PASS: five tables, eleven indexes, zero sequences/triggers/views/user routines, one extension, and
  two finished Prisma migrations were inventoried without reading record content.
- PASS: workflow inventory confirms exactly `deploy.yml` and manual `infrastructure.yml`.