# Phoenix AI — Original vs v2.0

This document maps every route and capability of the **Original experience** (v1, preserved
unchanged) to its counterpart in the additive **Phoenix AI v2.0** experience (`/v2/*`). It exists
so reviewers can confirm feature parity and that no original behaviour was altered.

See also: [ADR-0004](../architecture/decisions/ADR-0004-dual-experience-v2.md) ·
[v2 design system](./v2-design-system.md) ·
[change record](../architecture/changes/CHANGE-20260807-phoenix-v2-experience.md).

## Guiding principles

- **The Original is not overwritten or redesigned.** Every original route (`app/hcp/*`,
  `app/community/*`, and the original landing `app/_components/landing-client.tsx`) remains
  reachable and byte-for-byte unchanged.
- **v2 is additive and isolated.** It lives entirely under `app/v2/*`, `components/v2/*`, and
  `lib/v2/*`, and is gated by feature flags (`NEXT_PUBLIC_FEATURE_*`, default ON). Setting
  `NEXT_PUBLIC_FEATURE_V2_ENABLED=false` cleanly reverts to Original-only.
- **Same backend, same contracts.** v2 reuses the existing API routes and their request/response
  shapes; it adds no new Azure resources or external integrations.
- **Honest by design.** v2 dashboards, cases, and insights render deterministic, clearly-labelled
  **synthetic** data (`lib/v2/demo-data.ts`). No fabricated accuracy or analytics claims; no dead
  buttons — feature-flagged capabilities hide their entry points when disabled.

## Entry point

| Concern | Original (v1) | Phoenix AI v2.0 |
| --- | --- | --- |
| Root `/` | Portal landing (`landing-client.tsx`) | Experience selector (`experience-selector-client.tsx`) offering **Original** (→ `/hcp-login`, `/community`) or **v2** (→ `/v2`). Degrades to the original landing when v2 is disabled. |
| Brand & logo | `public/logo.png`, `#8B0000`, KKM/HKL banner | Identical logo, palette, and banner — reused, never redrawn |

## HCP (clinician) experience

| Capability | Original route | v2 route | Backend reused |
| --- | --- | --- | --- |
| Overview / dashboard | *(none — direct to tools)* | `/v2/hcp` | synthetic (`lib/v2/demo-data.ts`) |
| Case list & detail | *(history only)* | `/v2/hcp/cases`, `/v2/hcp/cases/[id]` | synthetic |
| Wound/burn analysis | `/hcp/analysis` | `/v2/hcp/analysis` | `POST /api/analyze-wound` (+ `StructuredAnalysis`) |
| Clinical chat | `/hcp/chat` | `/v2/hcp/chat` | `POST /api/hcp-chat` |
| TBSA + Parkland calculators | `/hcp/tbsa`, `/hcp/parkland` | `/v2/hcp/calculators` | `lib/clinical/parkland.ts` |
| Clinical guidelines | `/hcp/guidelines` | `/v2/hcp/guidelines` | static content (`lib/v2/guidelines.ts`) |
| Reports | *(none)* | `/v2/hcp/reports` (flag `reports`) | synthetic, printable |
| Insights / analytics | *(none)* | `/v2/hcp/insights` (flag `insights`) | synthetic, disclaimer-labelled |

## Community (public) experience

| Capability | Original route | v2 route | Backend reused |
| --- | --- | --- | --- |
| Home | `/community` | `/v2/community` | — |
| Self assessment | `/community/assessment` | `/v2/community/assessment` | deterministic triage (no AI) |
| Image check | `/community/image-check` | `/v2/community/image-check` | `POST /api/community-analyze` |
| Ask Phoenix (chat) | `/community/chat` | `/v2/community/chat` | `POST /api/community-chat` |
| First aid | `/community/first-aid` | `/v2/community/first-aid` | parity content (`lib/v2/first-aid.ts`) |
| Health education | `/community/articles` | `/v2/community/education` | `DEMO_ARTICLES` (`scripts/seed-data.ts`) |

## Cross-cutting

| Concern | Original | v2 |
| --- | --- | --- |
| Language (EN/BM) | `language-provider` | Same provider reused |
| Theme | `theme-toggle` | Same toggle reused |
| Motion | Framer Motion | Framer Motion with `MotionConfig reducedMotion="user"` (honours `prefers-reduced-motion`) |
| Navigation | Per-portal headers | Shared `PhoenixV2Shell` (nav rail, mobile sheet, command palette) |
| Switch back | — | "Switch experience" in the v2 shell returns to `/` |

## Rollback

Set `NEXT_PUBLIC_FEATURE_V2_ENABLED=false` and redeploy (or rebuild). The `/v2/*` routes return
`notFound()` via `app/v2/layout.tsx`, and `/` renders the original landing. No data migration or
resource change is involved.
