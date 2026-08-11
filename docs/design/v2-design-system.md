# Phoenix AI v2.0 — Design System

> v2.0 is an **enhanced** experience that evolves the Phoenix AI visual language **without
> replacing** it. It derives directly from the Original tokens in
> [`nextjs_space/app/globals.css`](../../nextjs_space/app/globals.css) and
> [`STYLE_GUIDE.md`](../../STYLE_GUIDE.md). The Original experience is unchanged; this document
> describes only the v2 layer. See
> [`docs/design/original-vs-v2.md`](./original-vs-v2.md) for a side-by-side comparison.

## 1. Brand continuity (non-negotiable)

- **Logo:** the exact original `public/logo.png`, rendered via `components/phoenix-logo.tsx`.
  Never recoloured, redrawn, or replaced.
- **Primary red:** `#8B0000` (`--primary: 0 100% 27%`) — retained as the core Phoenix identity.
- **Phoenix gradient:** `#8B0000 → #C0392B → #E67E22 → #F59B0C` (`.phoenix-gradient`).
- **KKM / HKL endorsement** branding preserved where shown.

## 2. What v2 changes (evolution, not redesign)

| Aspect | Original (v1) | v2.0 (enhanced) |
| --- | --- | --- |
| Layout | Portal cards + simple headers | App shell with persistent nav rail + command centre |
| Surface | White cards on light gradient | Layered surfaces, soft elevation, glass top bar |
| Density | Spacious marketing feel | Information-dense clinical workspace |
| Motion | Entrance fades | Purposeful micro-interactions (respecting `prefers-reduced-motion`) |
| Data | Task-first pages | Case-centric model with timeline + insights |

## 3. Tokens (reused from Original `:root`)

v2 does **not** introduce a new colour system — it reuses the existing CSS variables:

- `--primary` `0 100% 27%` (#8B0000), `--secondary` `37 92% 50%` (amber), `--accent` `172 84% 33%` (teal)
- `--background`, `--foreground`, `--muted`, `--border`, `--card`, `--radius: 0.625rem`
- Chart palette `--chart-1..5`
- Shadow / spacing / duration scales already defined as CSS vars

v2-specific utility classes are added in `globals.css` under a clearly-commented
`Phoenix AI v2.0` block:

- `.v2-surface` — base panel (card bg + subtle border + `shadow-sm`)
- `.v2-glass` — translucent blurred bar for the shell top bar
- `.v2-nav-active` — active nav-rail item treatment (primary tint)
- `.v2-stat-gradient` — subtle gradient wash for KPI cards

## 4. Typography

Unchanged from Original: `font-display` (Plus Jakarta Sans) for headings, `font-sans` (DM Sans)
for body, `font-mono` (JetBrains Mono) for figures. `tracking-tight` on `text-2xl`+.

## 5. Components

- **Shell:** `components/v2/phoenix-v2-shell.tsx` — desktop nav rail + glass top bar + mobile sheet
  nav + optional command palette. Isolated from the Original `HcpLayoutClient`.
- **Primitives:** reuse `components/ui/*` (Button, Card, Badge, Tabs, Dialog, Sheet, Input, etc.)
  and `components/ui/animate` (`FadeIn`, `Stagger`, `HoverLift`).
- **v2 building blocks:** `components/v2/{stat-card,case-card,section-heading,demo-badge,mini-bar-chart,donut-chart}.tsx`.

## 6. Accessibility & honesty

- Respect `prefers-reduced-motion` (Framer Motion `useReducedMotion` / CSS guards).
- Lucide icons only — no emoji.
- All synthetic data carries a "Synthetic demonstration data" label and a discreet
  "Demo Environment" marker; no fabricated accuracy/analytics claims.
- No placeholder or dead links — disabled features hide their navigation entries.
