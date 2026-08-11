# Part 7 — Retained Functionality

> What was deliberately preserved unchanged from the original Abacus.AI source, satisfying the
> migration's prime directive: **preserve the original visible user experience and behaviour.**
> Evidence: byte-identical assets, unchanged UI dependency set, and the visual-parity result.

Change types: **Retained unchanged**, **Retained w/ config change**.

## 1. Branding & visual identity — Retained unchanged

| Item | Evidence |
| --- | --- |
| Phoenix AI logo (`public/logo.png`) | Git blob `370601eccff66267cac08573e90f1015680a7c31`, 346,691 bytes — identical at baseline, HEAD, and working tree |
| Phoenix AI name & wordmark | present throughout; no substitution |
| Primary colour `#8B0000` | unchanged in Tailwind config and components |
| Typography, spacing, radii, shadows, cards, buttons, forms, icons | unchanged |
| Charts, animations, responsive behaviour | unchanged (Recharts/Framer Motion retained) |

## 2. Application structure & journeys — Retained unchanged

| Item | Notes |
| --- | --- |
| Page & navigation structure | Landing, Community portal, HCP portal, TBSA, Parkland, analysis |
| Clinical terminology | Fitzpatrick, TBSA (Rule of Nines / Lund & Browder / palm), Parkland, wound-bed tissue terms |
| User journeys | Public landing → community; HCP login → analysis/TBSA/Parkland |
| EN / Bahasa Melayu toggle | `components/language-provider.tsx`, `lib/i18n.ts` content preserved |
| PWA install behaviour | `components/pwa-install-prompt.tsx` preserved |
| Mock/seeded demo content | dashboards/articles still render original in-app demo content |

## 3. AI assessment contract — Retained w/ config change

| Item | Notes |
| --- | --- |
| Wound/burn assessment JSON schema | same structured fields (Fitzpatrick, wound category, burn degree, severity, TBSA, tissue composition, exudate, edges, recommendations) |
| Streaming responses | preserved |
| Multimodal image analysis | preserved (vision-capable `gpt-4o`) |
| Config change | backend endpoint + auth swapped (Abacus key → Azure managed identity); request/response shape unchanged |

## 4. Clinical calculators — Retained unchanged (refactored internals)

| Item | Notes |
| --- | --- |
| TBSA calculator | identical output; logic extracted to `lib/clinical/tbsa.ts` and unit-tested |
| Parkland formula | identical output; logic extracted to `lib/clinical/parkland.ts` and unit-tested |

## 5. UI dependency set — Retained unchanged

The entire original front-end dependency set is retained at the same versions, including
`next@14.2.28`, `react@18.2.0`, all `@radix-ui/*`, `recharts@2.15.3`, `framer-motion@10.18.0`,
`lucide-react@0.446.0`, `tailwindcss@3.3.3`, `chart.js`, `plotly.js`, `maplibre-gl`, and more.
See [dependency-changes.md](dependency-changes.md) for the full retained list.

## 6. Visual-parity evidence

- **141 / 143** baseline screenshots are pixel-identical between the original and migrated UI.
- The 2 exceptions are accepted Recharts SVG animation-jitter differences (chart animation
  frame timing), not layout or branding changes. Detail in
  [docs/testing/visual-parity-report.md](../testing/visual-parity-report.md).

## 7. Persistence parity — Retained unchanged

No original user-facing workflow persisted files or database records; the migrated UI preserves
this. The database and Blob layers are provisioned but the visible content remains the original
demo/mock behaviour (with the exception of the new, opt-in HCP history feature, which is additive).
See [persistence-gap-assessment.md](persistence-gap-assessment.md).
