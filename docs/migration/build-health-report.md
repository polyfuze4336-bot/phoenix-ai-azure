# Phoenix AI — Source Build Health Report (Step 4)

**Purpose:** Establish an honest build-health baseline of the *imported, unmodified* Phoenix AI
source (`nextjs_space/`) before any Azure migration code changes. This report records the result of
running the project exactly as shipped, using the package manager and lock file provided by the
project. **No source code was changed. No build checks were set to "ignore" to make anything pass.**

- **Date:** 2026-06 (Step 4 of the migration)
- **Branch:** `migration/azure-port`
- **Source baseline commit:** `d200b5a` (tag `abacus-source-baseline`)
- **App root:** `nextjs_space/`

---

## Environment

| Item | Value |
| --- | --- |
| **Node.js version** | `v22.19.0` (matches repo `.nvmrc` = 22) |
| **Package manager** | npm `10.9.3` |
| **OS** | Windows (development host) |
| **Install command** | `npm ci --legacy-peer-deps` (lock-file install) |

> `--legacy-peer-deps` is required because of a **pre-existing** peer-dependency conflict in the
> source (`eslint@9` vs `@typescript-eslint/parser@7`, which wants `eslint@^8`). This is a
> dev-tooling conflict inherited from the source, not something introduced by the migration.

---

## Results summary

| Check | Command | Result |
| --- | --- | --- |
| **Install** | `npm ci --legacy-peer-deps` | ✅ PASS (exit 0) |
| **Type-check** | `npx tsc --noEmit` | ✅ PASS (exit 0, 0 errors) |
| **Build** | `npm run build` (`next build`) | ✅ PASS (exit 0, 17/17 routes) |
| **Lint** | `npm run lint` (`next lint`) | ⚠️ CANNOT RUN — tooling incompatibility (see below) |
| **Security audit** | `npm audit` | ⚠️ 25 vulnerabilities (2 low, 1 moderate, 21 high, 1 critical) |
| **Runtime (dev server)** | `npm run dev` + route smoke tests | ✅ PASS (14/14 routes HTTP 200, no server errors) |

---

## Install result

- Command: `npm ci --legacy-peer-deps` (run in `nextjs_space/`).
- **Exit code: 0.** `added 1064 packages, and audited 1065 packages in 3m`.
- `node_modules/.bin/next.cmd` present; 734 top-level packages installed.
- **Deprecation warnings emitted during install (non-fatal):**
  - `mumath@3.3.4` — "Redundant dependency in your project" (transitive via plotly.js).
  - `uuid@8.3.2` — deprecated major line.
  - `recharts@2.15.3` — deprecation notice from the publisher.
  - `@aws-sdk/core@3.977.3` — deprecation notice.
  - `next@14.2.28` — flagged with a security advisory
    (<https://nextjs.org/blog/security-update-2025-12-11>).

These are inherited from the source `package.json` / `package-lock.json` and are **not fixed** in
Step 4 (no dependency upgrades performed, per instructions).

---

## Type-check result

- Command: `npx tsc --noEmit` (no dedicated `typecheck` script exists in `package.json`).
- **Exit code: 0. Zero type errors.**
- Consistent with `next.config.js` → `typescript.ignoreBuildErrors: false` (types are enforced by
  the build, and they pass).

---

## Build result

- Command: `NEXTAUTH_URL=http://localhost:3000 npm run build`.
  - `NEXTAUTH_URL` is only needed so Next.js can resolve `metadataBase` for absolute OG/canonical
    URLs. It does **not** enable any real auth backend (auth is mock/client-side). Absence would
    produce a metadata warning, not a failure.
- **Exit code: 0.** `✓ Compiled successfully`, `✓ Generating static pages (17/17)`.
- **Route table (17 routes):**

| Route | Rendering |
| --- | --- |
| `/` | dynamic |
| `/_not-found` | dynamic |
| `/api/analyze-wound` | dynamic (API) |
| `/api/community-analyze` | dynamic (API) |
| `/api/community-chat` | dynamic (API) |
| `/api/hcp-chat` | dynamic (API) |
| `/community` | dynamic |
| `/community/articles` | dynamic |
| `/community/assessment` | dynamic |
| `/community/chat` | dynamic |
| `/community/first-aid` | dynamic |
| `/community/image-check` | dynamic |
| `/hcp` | dynamic |
| `/hcp-login` | dynamic |
| `/hcp/analysis` | dynamic |
| `/hcp/chat` | dynamic |
| `/hcp/guidelines` | dynamic |
| `/hcp/parkland` | dynamic |
| `/hcp/tbsa` | dynamic |

- **Build-time note (NOT a change made in Step 4):** the source `next.config.js` already ships with
  `eslint.ignoreDuringBuilds: true`, so the build prints `Skipping linting`. This is a
  **pre-existing** source setting (documented as known issue #10). Per instructions, it was left
  exactly as-is — it was **not** added to make the build pass, and no new ignore flags were
  introduced.

---

## Lint result

- Command: `npm run lint` (`next lint`).
- **The source ships no ESLint config file.** On first run, `next lint` interactively prompts to
  create one. That prompt was answered only to observe behaviour; the auto-created `.eslintrc.json`
  was **deleted immediately afterwards** so the source tree stays pristine (`git status` clean).
- **Lint cannot run in this environment.** With a config present, `next lint` fails with:

  ```
  Invalid Options:
  - Unknown options: useEslintrc, extensions, resolvePluginsRelativeTo, rulePaths,
    ignorePath, reportUnusedDisableDirectives
  - 'extensions' has been removed.
  - 'resolvePluginsRelativeTo' has been removed.
  - 'ignorePath' has been removed.
  - 'rulePaths' has been removed. Please define your rules using plugins.
  - 'reportUnusedDisableDirectives' has been removed.
  ```

- **Root cause:** the source `package.json` pins **`eslint@9`**, but `next lint` in Next.js
  `14.2.28` calls the **legacy ESLint API** (`useEslintrc`, `extensions`, etc.) that ESLint 9
  removed. `eslint@9` and `next@14.2.x`'s `next lint` are mutually incompatible. This is also the
  reason the source disables lint during builds (`eslint.ignoreDuringBuilds: true`).
- **Impact on migration:** none for parity — linting is a dev-time quality gate, not a runtime
  requirement. It is recorded here honestly rather than worked around. A future step may pin a
  compatible ESLint version or migrate to flat config; **not** done in Step 4 (no dependency
  changes / no broad code changes).

---

## Runtime result (development server + route smoke tests)

- Command: `NEXTAUTH_URL=http://localhost:3000 npm run dev` → `✓ Ready in 4s` on
  `http://localhost:3000`.
- Every application route was smoke-tested with an HTTP GET. **All returned HTTP 200:**

| Route | Status |
| --- | --- |
| `/` | 200 |
| `/hcp-login` | 200 |
| `/hcp` | 200 |
| `/hcp/analysis` | 200 |
| `/hcp/chat` | 200 |
| `/hcp/guidelines` | 200 |
| `/hcp/parkland` | 200 |
| `/hcp/tbsa` | 200 |
| `/community` | 200 |
| `/community/articles` | 200 |
| `/community/assessment` | 200 |
| `/community/chat` | 200 |
| `/community/first-aid` | 200 |
| `/community/image-check` | 200 |

- **Server console errors:** none. The dev log contains only `✓ Compiling` / `✓ Compiled` /
  `GET … 200` lines — no `error`, `warn`, `Module not found`, `404`, or unhandled-rejection entries.
- **Auth behaviour note (by design, not a bug):** the `/hcp/*` pages return **200 at the server**
  because the auth guard is **client-side** (`sessionStorage` `hcp_auth`). Without a session, the
  page renders and then the client JS redirects to `/hcp-login`. This preserves the original
  Abacus behaviour.
- **API routes** (`/api/analyze-wound`, `/api/hcp-chat`, `/api/community-chat`,
  `/api/community-analyze`) were **not** invoked with live payloads because they call the external
  LLM and require `ABACUSAI_API_KEY` (see below). They compile and are registered by the build;
  their live behaviour is out of scope for the build baseline and belongs to the Azure OpenAI
  cutover step.

---

## Missing environment variables

`.env` is git-ignored and absent from the source tree. The following variables are referenced:

| Variable | Used by | Blocking? |
| --- | --- | --- |
| `ABACUSAI_API_KEY` | The 4 AI API routes (`analyze-wound`, `hcp-chat`, `community-chat`, `community-analyze`) at **runtime only** | Not blocking for install/type-check/build/UI render. Blocks live AI calls. To be replaced by Azure OpenAI in a later step. |
| `NEXTAUTH_URL` | `metadataBase` resolution during build/render | Not blocking (only a metadata warning if absent). Set to `http://localhost:3000` for this baseline. |
| `DATABASE_URL` | Prisma schema/helpers (**not imported by the UI**) | Not blocking — Prisma/PostgreSQL is dead code for parity. |
| `AWS_*` (S3 helpers) | AWS S3 helper (**not imported by the UI**) | Not blocking — S3 is dead code for parity. |
| `NEXT_OUTPUT_MODE`, `NEXT_DIST_DIR` | Optional build knobs in `next.config.js` | Not blocking (default to `.next` / normal output). |

**Conclusion:** no environment variable is required to install, type-check, build, or render the UI.
Only live AI functionality needs a key, which the Azure OpenAI cutover step will supply.

---

## Broken imports

- **None.** `tsc --noEmit` (0 errors) and `next build` (compiled successfully) both resolve every
  import, including the `@/*` path alias. No missing-module or unresolved-import errors were seen in
  type-check, build, or dev-server output.

---

## Browser console errors

- Not separately captured via a headless browser in this step. Server-side rendering produced no
  errors for any route, and all routes returned 200. A dedicated in-browser console audit (for
  hydration warnings, etc.) is deferred to the UI parity-verification step; nothing in the SSR/dev
  logs indicates a client-side failure.

---

## Server console errors

- **None** during startup, compilation, or the 14-route smoke test. Dev log shows only successful
  compile + `200` responses.

---

## Missing assets

- **None detected.** No 404s for static assets during route rendering. The critical branding asset
  `public/logo.png` (SHA-256 `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241`,
  346 691 bytes) and all `public/**` assets are present per the Step-3 source baseline manifest.

---

## Failed routes

- **None.** 17/17 routes built; 14/14 application routes returned HTTP 200 at runtime.

---

## Unsupported packages

No package is *unsupported* on the target Node 22 runtime, but the following are flagged for
awareness (inherited from source; **not** changed in Step 4):

- **`next@14.2.28`** — publisher security advisory
  (<https://nextjs.org/blog/security-update-2025-12-11>); also `next lint` is incompatible with the
  pinned `eslint@9` (see Lint result).
- **`eslint@9`** vs **`@typescript-eslint/parser@7`** / `next lint` — incompatible tooling
  combination (forces `--legacy-peer-deps` and prevents linting).
- **Deprecated transitive/dev deps:** `mumath@3.3.4`, `uuid@8.3.2`, `recharts@2.15.3`,
  `@aws-sdk/core@3.977.3` (see Install result).
- **Dead-code stacks (installed but not wired into the UI):** Prisma/`@prisma/client`,
  `@aws-sdk/*` S3 helpers, `@azure/storage-blob`, and several unused state libs
  (`@tanstack/react-query`, `zustand`, `jotai`, `swr`). Not required for parity.

---

## Security audit findings

- Command: `npm audit` → **25 vulnerabilities: 2 low, 1 moderate, 21 high, 1 critical.**
- The majority are within the **ESLint dev-tooling chain** (dev-only, not shipped to the runtime).

| Package | Severity | Advisory (summary) |
| --- | --- | --- |
| `next-auth` | **critical** | NextAuth.js email misdelivery vulnerability *(not used by the UI)* |
| `next` | high | Information exposure in Next.js dev server (lack of origin verification) |
| `lodash` | high | Code injection via `_.template` |
| `js-cookie` | high | Per-instance prototype hijack in `assign()` → cookie-attribute injection |
| `react-use` | high | via `js-cookie` |
| `postcss` | high | Line-return parsing error |
| `ajv` | high | via `fast-uri` |
| `fast-uri` | high | Host confusion via backslash authority introducer |
| `brace-expansion` | high | ReDoS (bypasses CVE-2026-14257 mitigation) |
| `minimatch` | high | ReDoS via repeated wildcards |
| `eslint` | high | via `@eslint/config-array` *(dev tooling)* |
| `@eslint/config-array` | high | via `minimatch` *(dev tooling)* |
| `@eslint/eslintrc` | high | via `minimatch` *(dev tooling)* |
| `eslint-config-next` | high | via `eslint-plugin-import` *(dev tooling)* |
| `eslint-plugin-import` | high | via `minimatch` *(dev tooling)* |
| `eslint-plugin-jsx-a11y` | high | via `minimatch` *(dev tooling)* |
| `eslint-plugin-react` | high | via `minimatch` *(dev tooling)* |
| `@typescript-eslint/eslint-plugin` | high | via `@typescript-eslint/type-utils` *(dev tooling)* |
| `@typescript-eslint/parser` | high | via `@typescript-eslint/typescript-estree` *(dev tooling)* |
| `@typescript-eslint/type-utils` | high | via `@typescript-eslint/typescript-estree` *(dev tooling)* |
| `@typescript-eslint/typescript-estree` | high | via `minimatch` *(dev tooling)* |
| `@typescript-eslint/utils` | high | via `@typescript-eslint/typescript-estree` *(dev tooling)* |
| `uuid` | moderate | Missing buffer bounds check in v3/v5/v6 when `buf` provided |
| `@eslint/plugin-kit` | low | ReDoS in `ConfigCommentParser` *(dev tooling)* |
| `webpack` | low | `buildHttp` allow-list bypass (build-time SSRF) |

- **Not remediated in Step 4** (no dependency upgrades per instructions). `npm audit fix --force`
  would install `next-auth@4.24.15` and `webpack@5.109.2` *outside the stated ranges* — a breaking
  change that must be evaluated during the dependency-modernisation / Azure OpenAI cutover steps,
  not silently applied here.

---

## Honesty statement

- No source files under `nextjs_space/` were modified during Step 4.
- No build/type/lint check was newly set to "ignore" to force a pass. The single pre-existing
  `eslint.ignoreDuringBuilds: true` is a source setting (known issue #10), left untouched and
  documented above.
- All failures (lint tooling incompatibility, 25 audit findings, deprecations) are reported in
  full above rather than hidden.

## Overall verdict

The imported Phoenix AI source is **build-healthy**: it installs, type-checks, builds, and runs all
routes cleanly on Node 22. The only true failure is **linting**, blocked by an inherited
ESLint-9 / `next lint` incompatibility (dev-time only). Security advisories exist but are dominated
by dev-tooling; the one runtime-relevant critical (`next-auth`) affects code not wired into the UI.
None of these block the migration from proceeding.
