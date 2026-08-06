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

### Verified
- `npm install --legacy-peer-deps` succeeds (1064 packages).
- `npm run build` (`next build`) compiles successfully — 17/17 routes generated.

### Known issues / follow-ups
- `next@14.2.28` security advisory — to be addressed in a dedicated dependency-hardening change.
- `prisma generate` uses a hardcoded Linux `output` path; non-blocking (Prisma unused at runtime).
- Abacus.AI platform artifacts (LLM endpoint, injected chat widget) to be migrated/removed.
