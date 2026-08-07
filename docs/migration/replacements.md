# Part 5 — Replacements

> Capabilities where an original mechanism was swapped for an Azure-native equivalent that
> performs the **same job** by a different means. Replacements preserve the user-visible
> behaviour while changing the underlying provider or platform.

## 1. AI / model backend — Abacus.AI → Azure OpenAI (Microsoft Foundry)

| Aspect | Original | Replacement |
| --- | --- | --- |
| Endpoint | Abacus.AI OpenAI-compatible endpoint | Azure OpenAI on Foundry account `aif-yfjw6y` (eastus2) |
| Model | Abacus-hosted vision model | `gpt-4o` deployment (vision-capable) + `text-embedding-3-small` |
| API version | provider default | `2024-10-21` |
| Auth | `ABACUSAI_API_KEY` (static key in every route) | `DefaultAzureCredential` managed identity (default); key only as explicit temporary fallback |
| Integration | inline `fetch` in each `app/api/*` route | portable `lib/ai/*` provider layer |
| Contract | streaming + structured assessment JSON | **preserved** (same request/response shape, plus Zod validation) |

Evidence of completeness: current source contains **no** `ABACUSAI`/Abacus runtime references
(only two documentation comments in `lib/auth/demo-users.ts` and `lib/auth/types.ts` describing
the *original mock login* for parity). Live readiness reports `azure-ai=ok (auth=identity)`.

## 2. Object storage — AWS S3 → Azure Blob Storage

| Aspect | Original | Replacement |
| --- | --- | --- |
| Helper | `lib/s3.ts` + `lib/aws-config.ts` | `lib/storage/{azure-blob-provider,storage-provider,types}.ts` |
| SDK | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | `@azure/storage-blob` + `@azure/identity` |
| Auth | AWS credentials | managed identity (`DefaultAzureCredential`), no account key |
| Access | S3 presigned URLs | private container + user-delegation SAS reads |
| UI wiring | none (S3 helpers never used by UI) | none (parity preserved — no workflow persists user files yet) |

Note: because neither the original S3 helpers nor the new Blob provider is wired into a visible
workflow, this is a like-for-like replacement of a latent capability, not a behaviour change.

## 3. Runtime host — Abacus-hosted app → Azure App Service

| Aspect | Original | Replacement |
| --- | --- | --- |
| Hosting | Abacus.AI platform | Azure App Service (Linux, P1v3), `app-phoenixai-yun55ezsi4yoq` |
| Build/output | platform-managed | Next.js `output: "standalone"`, prebuilt zip via `scripts/make-standalone-zip.py` |
| Base URL | platform-provided | derived from `WEBSITE_HOSTNAME` (no localhost dependency) |

## 4. Secrets & configuration source

| Aspect | Original | Replacement |
| --- | --- | --- |
| Secret source | `.env` / platform env | App Service app settings + Azure Key Vault (`kv-phx-yun55ezsi4yoq`) |
| Identity | static keys | user-assigned managed identity `id-phoenixai-yun55ezsi4yoq` |

> Constraint recorded honestly: MCAPS sandbox policy forces Key Vault public network access
> **off**, so `DATABASE_URL` is supplied as a **direct App Service app setting** rather than a
> Key Vault reference in this environment. See
> [tradeoffs-and-limitations.md](tradeoffs-and-limitations.md).

## 5. Authentication mechanism (of the HCP portal)

| Aspect | Original | Replacement |
| --- | --- | --- |
| Login | client-side mock (`sessionStorage`, hardcoded users) | server-verified demo provider (default) with the **same** quick-login cards |
| Optional SSO | none | Microsoft Entra ID (OIDC), opt-in `AUTH_MODE=entra` |

The demo provider is a faithful behavioural replacement of the original mock login; it is **not**
enterprise authentication and is not intended for real clinical use. See
[docs/security/authentication.md](../security/authentication.md).
