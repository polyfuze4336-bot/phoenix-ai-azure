# Prototype GitHub Actions Audit

- **Audit date:** 2026-08-16
- **Repository mode:** PROTOTYPE / DEMO
- **Workflows before audit:** 2
- **Workflows after audit:** 2

## Inventory

| Workflow | Trigger | Purpose | Observed/runtime profile | Blocks app deployment? | Classification |
| --- | --- | --- | --- | --- | --- |
| `deploy.yml` | Push to `main`; manual full-SHA rollback | Install, typecheck, fast unit tests, production build, OIDC login, immutable ACR build, safe migration, Container App revision, health/smoke checks | Latest push run: about 9 minutes; ACR remote build is the dominant cost, while 107 unit tests complete in seconds | Yes, only on technical failure in the same deployment | **KEEP** |
| `infrastructure.yml` | Manual dispatch only | Bicep lint/build/what-if; optional infrastructure deployment | On demand; never started by an application push | No | **KEEP** |

## Decision

No workflow removal or simplification is required in this task. The repository already has the
preferred two-workflow shape. Previously overlapping CI, Development, Demo, database-migration,
architecture-governance, and PR-template gates are absent from the active workflow directory.

The fast unit suite remains in `deploy.yml` because it is reliable and adds seconds rather than
meaningful deployment latency. Removing it would reduce useful defect detection without making the
approximately nine-minute image/deployment path materially faster.

## Default Deployment Path

```text
Codespace / VS Code
  -> Copilot change
  -> npm run verify
  -> explicit commit
  -> push main
  -> npm ci --legacy-peer-deps
  -> Prisma generate
  -> typecheck
  -> fast unit tests
  -> production build
  -> Azure OIDC
  -> immutable container build
  -> prisma migrate deploy (only when DATABASE_URL is configured)
  -> Container App revision
  -> health + HCP/Community smoke checks
```

Build, install, typecheck, and safe migration failures stop deployment. There is no `migrate reset`,
schema drop/recreate, mandatory PR, reviewer dependency, manual environment approval, architecture
gate, RAI gate, Mermaid gate, visual matrix, accessibility scan, blocking dependency audit, release
approval, or multiple Node-version matrix.

## Security Boundary

- `Development` has zero protection rules and no required reviewers; it scopes existing secrets but
  adds no approval step.
- Azure login remains secretless GitHub OIDC; no service-principal password was introduced.
- Application secrets remain in GitHub/Azure secret stores and `.env` remains excluded from Git.
- Infrastructure remains manual because it is not part of routine application delivery.