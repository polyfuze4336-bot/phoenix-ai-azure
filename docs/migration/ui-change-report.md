# Part 15 — UI Change Report

> Assessment of user-interface changes between the original Abacus.AI source and the current
> Azure codebase, against the prime directive to preserve the original visible experience.
> Evidence: byte-identical logo, retained UI dependency set, and the visual-parity suite.

## 1. Verdict

The visible UI is **preserved**. The only intentional user-facing addition is the post-parity
HCP analysis history page (`/hcp/history`); everything else is pixel-preserving.

## 2. Branding parity — Retained unchanged

| Item | Evidence |
| --- | --- |
| Phoenix AI logo (`public/logo.png`) | SHA-256 `dfb40a3ef32007ceef3c06f11a48d6b1794178d240d74e716f34e6f4917d8241`; git blob `370601eccff66267cac08573e90f1015680a7c31`; 346,691 bytes — identical at baseline, HEAD, working tree |
| Phoenix AI name / wordmark | unchanged |
| Primary colour `#8B0000` | unchanged |
| Logo usage | centralised in `components/phoenix-logo.tsx` (renders the same asset; no emoji/icon/wordmark substitution) |

The logo was **never** replaced with an emoji, flame icon, Microsoft/Lucide icon, text wordmark,
or AI-generated approximation — the guardrail is satisfied and hash-verified.

## 3. Layout, typography, and interaction — Retained unchanged

| Aspect | Status |
| --- | --- |
| Page & navigation structure | unchanged |
| Typography hierarchy, spacing, radii, shadows | unchanged |
| Cards, buttons, forms, icons | unchanged (Radix UI + Lucide retained) |
| Charts & animations | unchanged (Recharts + Framer Motion retained at same versions) |
| Responsive behaviour | unchanged |
| EN / Bahasa Melayu toggle | preserved |
| PWA install prompt | preserved |
| Clinical terminology & journeys | preserved |

## 4. Modified client components (no visible change)

The following were edited for auth/telemetry/persistence wiring while preserving their rendered
output: `landing-client.tsx`, `hcp-layout-client.tsx`, `community-layout-client.tsx`,
`analysis-client.tsx`, `tbsa-client.tsx`, `parkland-client.tsx`, `layout.tsx`,
`language-provider.tsx`, `pwa-install-prompt.tsx`. Detail in
[modifications-and-enhancements.md](modifications-and-enhancements.md).

## 5. Added UI (intentional, additive)

| Page | Purpose |
| --- | --- |
| `/hcp/history` (`app/hcp/history/*`) | Clinician view of previously persisted AI analyses. Uses the existing design system (same colours, cards, typography), so it is visually consistent with the original UX. |
| `app/hcp-login/_components/login-client.tsx` | Server-backed login client; keeps the original quick-login cards and layout. |

## 6. Visual-parity result (evidence)

- **141 / 143** baseline screenshots pixel-identical between original and migrated UI.
- **2** accepted exceptions: Recharts SVG animation-frame jitter (chart animation timing), not
  layout, colour, or branding differences.
- Tooling: Playwright + `pixelmatch` + `pngjs`; report in
  [docs/testing/visual-parity-report.md](../testing/visual-parity-report.md); register in
  [docs/testing/clickable-control-register.md](../testing/clickable-control-register.md).

## 7. Interactive-control parity

A clickable-control guard (14 checks in the e2e suite) verifies that interactive controls behave
as in the original. See [original-vs-current-testing.md](../testing/original-vs-current-testing.md).
