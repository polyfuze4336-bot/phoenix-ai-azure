# ADR-0014: Codespaces development and immutable-image rollback

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** Phoenix AI prototype maintainers
- **Related components:** DEV-CODESPACES, DEVOPS-GHA, OPS-DEMO-ROLLBACK, INFRA-ACR, INFRA-CONTAINERAPP
- **Related integrations:** INT-CODESPACES-GITHUB, INT-GHA-AZURE, INT-ROLLBACK-ACR

## Context

The direct-main prototype workflow deploys every explicit push as an immutable SHA-tagged ACR image.
Developers need a reproducible Codespaces setup and a fast rollback that preserves Git history and
does not couple rollback to database reversal.

## Decision

Use a Node.js 22 devcontainer with dependency setup, Azure/GitHub CLIs, Copilot extensions, and port
3000 forwarding. Keep commit creation explicit. Extend `deploy.yml` with a manual dispatch requiring
a full Git SHA; verify that image exists in ACR, deploy it as a new Container App revision, run health
and smoke checks, and record actor, SHA, and revision. Do not rerun migrations during rollback.

## Alternatives Considered

- Automatically commit every edit: rejected because it removes the developer-selected rollback boundary.
- Rewrite or reset `main`: rejected because rollback must preserve repository history.
- Rebuild an old commit: rejected because the previously deployed immutable image is stronger evidence.
- Reverse database migrations: rejected because destructive schema rollback is unsafe and separate.

## Consequences

Rollback is fast, auditable, and limited to images that already exist. A target whose image was
deleted cannot be restored through this path. Data/schema compatibility must be considered before
choosing an old image. Architecture version becomes `6.1.0`; Azure resources and security boundaries
do not change.