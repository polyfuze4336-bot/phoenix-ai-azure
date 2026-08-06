# Contributing — Phoenix AI (Azure migration)

This repository is a **faithful parity migration** of Phoenix AI from Abacus.AI to Azure.
The guiding rule for every change:

> Preserve the original visible user experience and behaviour. Do **not** improve, modernise,
> reinterpret or redesign the interface unless an incompatibility prevents faithful migration.
> Where the original implementation is unclear, preserve the visible UX and **document the
> assumption** in the migration audit trail.

## Golden rules

- **Do not modify the original Abacus.AI source** beyond what migration requires. The imported
  app under `nextjs_space/` is the source of truth; keep changes minimal and reviewable.
- **Never replace the Phoenix AI logo** with an emoji, generic flame, Microsoft/Lucide icon,
  text-only wordmark, or any AI-generated / newly designed symbol. Use the original asset
  (`nextjs_space/public/logo.png`).
- **Never commit secrets** — credentials, connection strings, API keys, certificates or access
  tokens. Use `.env` locally (git-ignored) and Azure Key Vault / app settings in the cloud.
- **The deployed runtime must be Azure-hosted only** — no dependency on a developer laptop,
  local database, local file share or `localhost` service.
- **Prefer reuse** of existing suitable Azure resources; create a new resource group only for
  resources that cannot be reused.

## Workflow

1. Work in **small, reviewable commits** with clear, conventional messages
   (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
2. Branch from `main`: `git switch -c <type>/<short-description>`.
3. At the end of every migration step:
   1. Run all relevant checks (`npm run build`, `npm run lint`, tests).
   2. Report files added / modified / deleted.
   3. Report tests executed and their results.
   4. List unresolved issues.
   5. Commit with a clear message.
   6. Update [docs/migration/MIGRATION.md](docs/migration/MIGRATION.md).
4. Open a Pull Request into `main`. Do not push directly to `main`.

## Local checks

```powershell
cd nextjs_space
npm install --legacy-peer-deps
npm run build      # must pass
npm run lint       # advisory (source sets eslint.ignoreDuringBuilds)
```

## Recommended branch protection rules for `main`

Configure these in **GitHub → Settings → Branches → Branch protection rules** (or via
Rulesets) for the `main` branch. They are recommendations to be applied by a repo admin:

- **Require a pull request before merging**
  - Require at least **1 approving review**.
  - Dismiss stale approvals when new commits are pushed.
  - Require review from Code Owners (if a `CODEOWNERS` file is added).
- **Require status checks to pass before merging**
  - Require the **CI / build** check (`.github/workflows/ci.yml`) to pass.
  - Require branches to be **up to date** before merging.
- **Require conversation resolution before merging.**
- **Require linear history** (squash or rebase merges).
- **Do not allow force pushes** to `main`.
- **Do not allow deletions** of `main`.
- **Include administrators** in the above restrictions.
- Optionally: **require signed commits**.

> These rules cannot be committed as code; a repository administrator must enable them in
> GitHub settings. This section is the authoritative record of the intended configuration.

## Commit message convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional scope): <description>

[optional body]
[optional footer(s)]
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`.
