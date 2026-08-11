# Part 11 — Dependency Changes

> Exact package changes between the original `package.json` (`abacus-source-baseline`) and the
> current HEAD. Evidence: `git show <ref>:nextjs_space/package.json` parsed for both refs.

## 1. Production dependencies — Added

| Package | Version | Purpose |
| --- | --- | --- |
| `@azure/identity` | `^4.13.1` | `DefaultAzureCredential` for AI + Storage managed-identity auth |
| `applicationinsights` | `^3.15.1` | Server-side telemetry SDK |
| `@microsoft/applicationinsights-web` | `^3.4.3` | Browser telemetry SDK |
| `jose` | `^6.2.5` | Signed httpOnly session cookie (HS256) |

## 2. Production dependencies — Removed

| Package | Original version | Reason |
| --- | --- | --- |
| `@aws-sdk/client-s3` | `^3.0.0` | AWS S3 client replaced by Azure Blob |
| `@aws-sdk/s3-request-presigner` | `^3.0.0` | AWS presign replaced by user-delegation SAS |

## 3. Production dependencies — Retained (unchanged versions)

`@azure/storage-blob` (`^12.0.0`, already present in source), `next@14.2.28`, `react@18.2.0`,
`react-dom@18.2.0`, `@prisma/client@6.7.0`, `next-auth@4.24.11`, `zod@3.23.8`,
`recharts@2.15.3`, `framer-motion@10.18.0`, `lucide-react@0.446.0`, all `@radix-ui/*`,
`@tanstack/react-query@5.0.0`, `chart.js@4.4.9`, `plotly.js@2.35.3`, `maplibre-gl@4.7.1`,
`react-hook-form@7.53.0`, `tailwind-scrollbar-hide`, `bcryptjs`, `jsonwebtoken`, and the rest of
the original UI/runtime set (unchanged).

## 4. Dev dependencies — Added

| Package | Version | Purpose |
| --- | --- | --- |
| `@playwright/test` | `^1.49.1` | E2E / API / visual / network test runner |
| `pixelmatch` | `^5.3.0` | Visual-parity pixel diffing |
| `pngjs` | `^7.0.0` | PNG decode for visual diffing |
| `@types/pixelmatch` | `^5.2.6` | Types |
| `@types/pngjs` | `^6.0.5` | Types |

## 5. Dev dependencies — Changed (version aligned to Next 14)

| Package | Original | Current | Reason |
| --- | --- | --- | --- |
| `eslint` | `9.24.0` | `8.57.1` | Align with `eslint-config-next@14` (Next 14 lint stack) |
| `eslint-config-next` | `15.3.0` | `14.2.28` | Match the pinned `next@14.2.28` |

All other dev dependencies (TypeScript `5.2.2`, `prisma@6.7.0`, `tsx`, `tailwindcss@3.3.3`,
`@typescript-eslint/*@7.0.0`, type packages) are retained at their original versions.

## 6. Lockfile & engines

- `package-lock.json` regenerated: **+4,478 / −882** lines.
- `engines` added: `"node": ">=22 <23"` (was absent in the original).

## 7. Net summary

| Category | Added | Removed | Changed |
| --- | --- | --- | --- |
| Production deps | 4 | 2 | 0 |
| Dev deps | 5 | 0 | 2 |

The change is deliberately minimal: the entire original UI dependency surface is preserved to
protect visual parity; new packages exist only for Azure identity, telemetry, sessions, and testing.
