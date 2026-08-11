# Part 12 — Configuration Changes

> Environment-variable and build-configuration changes between the original source and the
> current codebase. Evidence: `git show <ref>:.env.example`, `next.config.js`, `tsconfig.json`,
> and `package.json` scripts.

## 1. Environment variables — Removed

| Variable | Original role |
| --- | --- |
| `ABACUSAI_API_KEY` | Abacus.AI model authentication |
| `AWS_REGION` | AWS S3 region |
| `AWS_BUCKET_NAME` | AWS S3 bucket |
| `AWS_FOLDER_PREFIX` | AWS S3 key prefix |

## 2. Environment variables — Retained / repurposed

| Variable | Note |
| --- | --- |
| `NEXTAUTH_URL` | Retained; on Azure the base URL also derives from `WEBSITE_HOSTNAME` when unset |
| `DATABASE_URL` | Retained; now points at Azure PostgreSQL; `lib/db.ts` auto-appends `sslmode=require` + pool defaults |

## 3. Environment variables — Added

### AI provider (`lib/ai`)
`AZURE_AI_ENDPOINT`, `AZURE_AI_PROJECT_ENDPOINT`, `AZURE_AI_MODEL_DEPLOYMENT`,
`AZURE_AI_API_VERSION` (default `2024-10-21`), `AZURE_AI_AUTH` (default `identity`),
`AZURE_AI_API_KEY` (temporary fallback only), `AZURE_AI_MAX_IMAGE_MB`, `AZURE_CLIENT_ID`.
Legacy fallbacks: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`,
`AZURE_OPENAI_API_VERSION`.

### Authentication (`lib/auth`)
`AUTH_MODE` (default `demo`), `DEMO_AUTH_PASSWORD`, `DEMO_AUTH_ADMIN_PASSWORD`,
`AZURE_ENTRA_TENANT_ID`, `AZURE_ENTRA_CLIENT_ID`, `AZURE_ENTRA_CLIENT_SECRET`,
`AZURE_ENTRA_REDIRECT_URI`, `AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI`, `AZURE_ENTRA_SCOPES`,
`AZURE_ENTRA_GROUP_ADMIN`, `AZURE_ENTRA_GROUP_DOCTOR`, `AZURE_ENTRA_GROUP_NURSE`,
`SESSION_SECRET`, `AUTH_SESSION_TTL_MINUTES`.

### Storage (`lib/storage`)
`AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_ACCOUNT_URL`, `AZURE_STORAGE_CONTAINER`
(default `clinical-uploads`), `AZURE_STORAGE_MAX_FILE_MB`.

### Database (optional)
`DIRECT_DATABASE_URL` (for pooled connections during migrations).

### Observability
`APPLICATIONINSIGHTS_CONNECTION_STRING` (server),
`NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING` (browser).

All new variables default to safe no-ops when unset (telemetry off, auth = demo, storage/AI
tolerant), so local development and demo runs need no secrets.

## 4. Build configuration

| File | Change |
| --- | --- |
| `next.config.js` | `output: "standalone"` for App Service; Azure hostname base URL; removed Abacus assumptions |
| `tsconfig.json` | portable path/base settings so `@/*` aliases resolve on case-sensitive Linux |
| `.eslintrc.json` (new) | ESLint config aligned to `eslint-config-next@14` |
| `.gitignore` | Azure/tooling ignores |

## 5. npm scripts (added)

`typecheck`, `test:unit`, `test:integration`, `test:e2e`, `test:smoke`, `test:journeys`,
`test:api`, `test:visual`, `test:network`, `db:generate`, `db:validate`, `db:migrate:validate`,
`db:migrate:deploy`, `db:migrate:status`, `db:seed`, `db:readiness`, `format:check`.

## 6. Secret-handling posture

- No secrets committed; `.env` git-ignored; template only in `.env.example`.
- On Azure: App Service app settings + Key Vault `kv-phx-yun55ezsi4yoq`.
- **Environment constraint:** MCAPS sandbox policy forces Key Vault public network access off, so
  `DATABASE_URL` is a direct app setting in this deployment rather than a Key Vault reference.
  See [tradeoffs-and-limitations.md](tradeoffs-and-limitations.md).
