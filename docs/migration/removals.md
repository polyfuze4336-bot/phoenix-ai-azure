# Part 6 — Removals

> Code, dependencies, and configuration present in the original Abacus.AI source that were
> deleted during the migration. Evidence: `git diff --name-status` (status `D`) and the
> `package.json` / `.env.example` diffs.

## 1. Deleted files (2)

| File | Reason for removal | Verified impact |
| --- | --- | --- |
| `nextjs_space/lib/aws-config.ts` | AWS S3 configuration helper; not wired into any UI workflow | Replaced by `lib/storage/*` (Azure Blob). No UI import existed. |
| `nextjs_space/lib/s3.ts` | AWS S3 upload/presign helper; not wired into any UI workflow | Replaced by `lib/storage/*`. No UI import existed. |

Both files were confirmed unused by the visible application before removal (the original app
reads images client-side via `FileReader` and sends base64 to the AI routes).

## 2. Removed runtime dependencies

| Package | Original version | Reason |
| --- | --- | --- |
| `@aws-sdk/client-s3` | `^3.0.0` | AWS S3 client no longer needed after Blob replacement |
| `@aws-sdk/s3-request-presigner` | `^3.0.0` | AWS presigned-URL helper no longer needed |

No other production dependency was removed; the entire original UI dependency set
(Radix UI, Recharts, Framer Motion, Lucide, Tailwind, etc.) is retained — see
[dependency-changes.md](dependency-changes.md).

## 3. Removed configuration / environment variables

| Variable | Original role | Status |
| --- | --- | --- |
| `ABACUSAI_API_KEY` | Abacus.AI model auth | Removed (replaced by Azure AI managed identity) |
| `AWS_REGION` | S3 region | Removed |
| `AWS_BUCKET_NAME` | S3 bucket | Removed |
| `AWS_FOLDER_PREFIX` | S3 key prefix | Removed |

## 4. Removed build/runtime assumptions

| Assumption | Original | Status |
| --- | --- | --- |
| Prisma generator `output = "/home/ubuntu/..."` | hardcoded Abacus build path | Removed (portable default output) |
| `linux-musl-arm64-openssl-3.0.x` binary target | Abacus platform arch | Replaced with `debian-openssl-3.0.x` for App Service |
| Abacus browser runtime dependency | present in source | Removed (commit `73a3225`) |
| Abacus build/filesystem assumptions | present | Removed (commit `7378462`) |

## 5. What was NOT removed (guardrail confirmation)

- The Phoenix AI **logo** — byte-identical (blob `370601e`).
- The Phoenix AI **name and branding**.
- All original UI components, colour palette (`#8B0000`), typography, journeys, clinical
  terminology, EN/BM content, and seeded/mock demo behaviour.
- The `@azure/storage-blob` dependency (already present in the original source; retained).

## 6. Residual references (intentional)

A grep of `nextjs_space/{app,lib,components}` for `abacus|ABACUSAI|aws-sdk|s3.|AWS_BUCKET|aws-config`
returns **only two matches**, both explanatory comments that document the original mock login for
parity purposes:

- `lib/auth/demo-users.ts` — "Parity defaults — mirror the original Abacus.AI mock login."
- `lib/auth/types.ts` — "...fictional users that mirrors the original Abacus.AI mock login."

No Abacus or AWS **runtime code** remains.
