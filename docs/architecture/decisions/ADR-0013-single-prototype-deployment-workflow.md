# ADR-0013: Single approval-free prototype deployment workflow

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** Phoenix AI prototype maintainers
- **Related components:** DEVOPS-GHA, GOV-CI, GOV-VALIDATE
- **Related integrations:** INT-GHA-AZURE, INT-DEPLOY-ACR, INT-GHA-DBMIGRATE
- **Supersedes:** ADR-0012 delivery-workflow details; its direct-main decision remains accepted

## Context

The prototype has separate CI, Development deployment, Demo deployment, database migration, and
infrastructure workflows. CI and deployment repeat installation/build work, active deployment jobs
bind GitHub Environments, and the paths are more complex than the requested Codespaces workflow.

## Decision

Use `.github/workflows/deploy.yml` as the sole automatic workflow on pushes to `main`. It installs,
type-checks, unit-tests, builds, authenticates with existing Azure OIDC, remotely builds an immutable
container, deploys the existing Container App through Bicep, applies committed database migrations
when configured, waits for readiness, checks liveness, smoke-tests `/hcp` and `/community`, and
reports the revision and URL. A failed pre-deployment build stops deployment as basic build safety,
not an approval gate.

Keep `.github/workflows/infrastructure.yml` manual-only for explicit infrastructure work. Retain the
reviewer-free `Development` environment solely because the working secret values are scoped there;
GitHub reports zero protection rules. Retire overlapping CI, Development, Demo, and standalone
database-migration workflows. Pull requests remain optional.

## Security Impact

GitHub secrets/variables and Azure OIDC remain in use. No long-lived Azure credential is introduced,
and no credential, connection string, token, certificate, or API key is committed or logged.

## Consequences

- One auditable direct-main deployment path with no workflow approval dependency.
- Less duplicated runner work and fewer overlapping GitHub Actions surfaces.
- Infrastructure remains deliberate and manual without blocking normal application delivery.
- Repository owners must keep `Development` free of account-level deployment protection rules (or
  move the secrets to repository scope and remove the binding); workflow code cannot change those
  settings.

## Rollback

Restore the retired workflows from Git history and supersede this ADR. Existing Azure resources and
OIDC identity do not need replacement.

## Validation

Validate YAML diagnostics, local typecheck/unit/build, Bicep compilation, architecture drift, secret
scanning, direct-main Actions completion, deployed liveness, and `/hcp` plus `/community` smoke tests.