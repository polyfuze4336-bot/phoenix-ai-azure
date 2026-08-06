# Changelog

All notable changes to the Phoenix AI Azure migration are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to migration-step-based versioning. Detailed, per-step
technical notes live in [docs/migration/MIGRATION.md](docs/migration/MIGRATION.md).

## [Unreleased]

### Added
- Initialised the Phoenix AI Azure migration repository:
  - `.gitignore`, `.editorconfig`, `.nvmrc` (Node 22), `.env.example` (no secrets).
  - `README.md` stating this is a parity migration of Phoenix AI from Abacus.AI to Azure.
  - `CONTRIBUTING.md` (workflow + recommended `main` branch protection rules).
  - `CHANGELOG.md` (this file).
  - `docs/migration/`, `docs/architecture/`, `docs/testing/` documentation.
  - `.github/workflows/ci.yml` (install + build verification).
  - `.github/copilot-instructions.md` (migration guardrails for AI assistance).
- Imported the pristine Phoenix AI source from the Abacus.AI archive into `nextjs_space/`.
- `docs/migration/source-code-audit.md`: complete read-only audit of the imported source —
  architecture, all 13 pages and 4 API routes, design tokens, dependencies, environment
  variables, security risks, and Azure migration blockers, with the 12 known issues confirmed.
- `docs/migration/source-baseline-manifest.md`: SHA-256 manifest of all 162 tracked files
  establishing an immutable source baseline. Canonical `public/logo.png` SHA-256 recorded
  (`dfb40a3e…917d8241`). Tag `abacus-source-baseline` + branch `migration/azure-port` created.
- `docs/migration/build-health-report.md`: build-health baseline of the unmodified source on
  Node 22 / npm 10.9.3 â€” install, type-check, build, and runtime (14/14 routes HTTP 200) all
  pass; lint is blocked by an inherited `eslint@9` / `next lint` incompatibility; `npm audit`
  records 25 vulnerabilities (2 low, 1 moderate, 21 high, 1 critical). No source code changed.

### Verified
- `npm install --legacy-peer-deps` succeeds (1064 packages).
- `npm ci --legacy-peer-deps` succeeds (exit 0) with Node v22.19.0 / npm 10.9.3.
- `npx tsc --noEmit` passes with 0 type errors.
- `npm run build` (`next build`) compiles successfully â€” 17/17 routes generated.
- Development server serves all 14 application routes with HTTP 200 and no server errors.

### Known issues / follow-ups
- `next@14.2.28` security advisory — to be addressed in a dedicated dependency-hardening change.
- `prisma generate` uses a hardcoded Linux `output` path; non-blocking (Prisma unused at runtime).
- Abacus.AI platform artifacts (LLM endpoint, injected chat widget) to be migrated/removed.
