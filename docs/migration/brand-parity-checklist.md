# Brand & Visual Parity Checklist — Phoenix AI

This document records the branding and design-system assets that must be preserved
byte-for-byte and pixel-for-pixel during the Azure migration, per
`.github/copilot-instructions.md` (Prime directive: preserve the original visible UX).

It is the reference used to verify that no migration step alters Phoenix AI's identity.

---

## 1. Brand assets (do not alter)

| Asset | Path | Used for | Notes |
|-------|------|----------|-------|
| Phoenix AI logo | `nextjs_space/public/logo.png` | All in-app logo marks, PWA precache, PWA install prompt | Canonical SHA-256 `dfb40a3e…917d8241`. Transparent PNG. **Never** replace with an emoji, flame/Lucide/Microsoft icon, wordmark, or AI-generated approximation. |
| KKM–HKL endorsement logo | `nextjs_space/public/kkm-hkl-logo.jpeg` | Landing page endorsement banner | Rendered `priority`. Ministry of Health Malaysia / Hospital Kuala Lumpur. |
| Favicon | `nextjs_space/public/favicon.svg` | Browser tab icon, PWA precache | Referenced in `app/layout.tsx` metadata (`icon`, `shortcut`). |
| Apple touch icon | `nextjs_space/public/icons/apple-touch-icon.png` | iOS home-screen icon | `app/layout.tsx` `apple` + `<link rel="apple-touch-icon">`. |
| Open Graph image | `nextjs_space/public/og-image.png` | Social share preview | `app/layout.tsx` `openGraph.images`. |
| PWA icons | `nextjs_space/public/icons/icon-{72,96,128,144,152,192,384,512}.png` | Installable app icons | Declared in `public/manifest.json`. |
| TBSA body images | `nextjs_space/public/tbsa-anterior.png`, `tbsa-posterior.png` | HCP TBSA (Lund–Browder) diagram | Only consumed by `app/hcp/tbsa/_components/tbsa-client.tsx`. |
| TBSA mask images | `nextjs_space/public/tbsa-anterior-mask.png`, `tbsa-posterior-mask.png` | TBSA region hit-testing masks | Pixel-accurate region maps — must not be resized/recompressed. |

---

## 2. Confirmed Phoenix logo placements

Every location below renders `/logo.png` via `next/image` with `fill` +
`object-contain` inside a positioned, sized wrapper. All are confirmed present:

| # | Location | File | Displayed size | Alt text |
|---|----------|------|----------------|----------|
| 1 | Landing page — header mark | `app/_components/landing-client.tsx` | `w-8 h-8 md:w-10 md:h-10` | `Phoenix AI Logo` |
| 2 | Landing page — hero (rotating, 3D) | `app/_components/landing-client.tsx` | `w-28 h-28 md:w-44 md:h-44` + `drop-shadow-lg` | `Phoenix AI` |
| 3 | HCP login — header mark | `app/hcp-login/page.tsx` | `w-8 h-8 md:w-10 md:h-10` | `Phoenix AI Logo` |
| 4 | HCP portal — loading splash | `app/hcp/_components/hcp-layout-client.tsx` | `w-12 h-12` | `Phoenix AI` |
| 5 | HCP desktop navigation (sidebar) | `app/hcp/_components/hcp-layout-client.tsx` | `w-9 h-9` | `Phoenix AI` |
| 6 | HCP mobile navigation (drawer) | `app/hcp/_components/hcp-layout-client.tsx` | `w-8 h-8` | `Phoenix AI` |
| 7 | HCP mobile top bar | `app/hcp/_components/hcp-layout-client.tsx` | `w-7 h-7` | `Phoenix AI` |
| 8 | Community desktop navigation (sidebar) | `app/community/_components/community-layout-client.tsx` | `w-9 h-9` | `Phoenix AI` |
| 9 | Community mobile navigation (drawer) | `app/community/_components/community-layout-client.tsx` | `w-8 h-8` | `Phoenix AI` |
| 10 | Community mobile top bar | `app/community/_components/community-layout-client.tsx` | `w-7 h-7` | `Phoenix AI` |
| 11 | PWA install prompt | `components/pwa-install-prompt.tsx` | `w-12 h-12` | `Phoenix AI` |
| 12 | Browser metadata (favicon / apple / shortcut) | `app/layout.tsx` | n/a | n/a |
| 13 | Open Graph metadata | `app/layout.tsx` | n/a | n/a |
| 14 | Service-worker precache | `public/sw.js` | n/a | n/a |

Required-coverage cross-check (from the task): Landing ✅, HCP login ✅, HCP desktop nav ✅,
HCP mobile nav ✅, Community desktop nav ✅, Community mobile nav ✅, PWA install prompt ✅,
Browser metadata ✅, Open Graph metadata ✅.

---

## 3. `PhoenixLogo` component

A reusable component was introduced at `nextjs_space/components/phoenix-logo.tsx`
**only after confirming it reproduces every call site with zero visual change.**

**Contract:**
- References `/logo.png` (never anything else).
- Renders `next/image` with `fill` + `object-contain` inside a `relative` wrapper —
  identical to the prior inline markup, so intrinsic aspect ratio and transparency
  are preserved.
- Sizing/spacing come entirely from the caller's `className` (e.g. `w-8 h-8`,
  `w-28 h-28 md:w-44 md:h-44`), so every existing displayed size is reproduced exactly.
- `alt` prop defaults to `"Phoenix AI"`; call sites that used `"Phoenix AI Logo"`
  pass it explicitly, preserving the original accessible text at each location.
- `imageClassName` prop appends to `object-contain` so the landing hero keeps its
  `drop-shadow-lg`; `style` prop preserves the hero's 3D `perspective` wrapper.
- **No CSS `filter`, no recolouring, no `mix-blend`, no opacity change** is applied.

**Parity:** the refactor is a pure extraction — the rendered DOM (wrapper classes,
image attributes, alt text, drop-shadow, animation classes) is unchanged at all 11
render sites. Verified with `npm run build` (17/17 routes), `npm run typecheck`
(0 errors), and `npm run lint` (0/0) after the change.

Locations *not* converted (intentionally): `layout.tsx` metadata, `manifest.json`,
`sw.js` (these reference assets by URL, not React), the KKM–HKL banner image, and
non-logo `next/image` uses (wound preview / chat attachments in the HCP analysis and
chat clients) which display user content, not branding.

---

## 4. Preserved design system (`STYLE_GUIDE.md`)

No token below may change during migration.

### Typography
| Role | Font | Class |
|------|------|-------|
| Body | DM Sans | `font-sans` |
| Display | Plus Jakarta Sans | `font-display` |
| Mono (numeric / code / IDs) | JetBrains Mono | `font-mono` |

Large headings keep `tracking-tight`.

### Colour tokens (`app/globals.css`, HSL)
| Token | Value | Meaning |
|-------|-------|---------|
| `--primary` | `0 100% 27%` | Phoenix red `#8B0000` |
| `--primary-foreground` | `0 0% 100%` | White on primary |
| `--secondary` | `37 92% 50%` | Amber accent |
| `--accent` | `172 84% 33%` | Teal (community `#0F9B8E` family) |
| `--radius` | `0.625rem` | Default radius |

All colours are consumed via CSS variables — never hardcoded (except pre-existing
literal brand hexes `#8B0000` / `#0F9B8E` already in the source).

### Phoenix gradients (`app/globals.css`)
- `.phoenix-gradient` — brand header/background gradient.
- `.phoenix-gradient-text` — gradient wordmark treatment.
- `.hero-gradient` — landing hero backdrop.

### Radius scale
`--radius` `0.625rem` · `--radius-sm` `calc(-4px)` · `--radius-lg` `calc(+4px)` ·
`--radius-full` `9999px`.

### Spacing scale (8px grid)
`xs 4` · `sm 8` · `md 16` · `lg 24` · `xl 32` · `2xl 48` · `3xl 64` (px).

### Shadow scale
`--shadow-sm` (subtle lift) · `--shadow-md` (cards/popovers) · `--shadow-lg`
(modals/elevated). CSS-variable only.

### Animation timing
`--duration-fast` `150ms` · `--duration-normal` `250ms` · `--duration-slow` `350ms`.

### Card styles
shadcn/ui card surfaces via `card` / `card-foreground` tokens with the radius/shadow
scales above — unchanged.

---

## 5. Verification performed this step

- `npm run typecheck` → 0 errors.
- `npm run lint` → 0 warnings / 0 errors.
- `npm run build` → success, 17/17 routes generated.
- Rendered markup at all logo sites confirmed identical (pure component extraction).
- No asset files were modified.
