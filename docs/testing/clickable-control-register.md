# Phoenix AI — Clickable Control Register

**Step 21 — Audit every clickable control.** This register is the audit trail for every
visibly clickable control in the migrated Phoenix AI app. It records what each control is
expected to do, what it actually does in the migrated code, its status, the automated test
that exercises it, and any defect + resolution.

**Audit result (summary):** Every visibly clickable control performs a real, meaningful
action. No `href="#"`, empty handlers, placeholder `alert()`s, dead links, unexplained
disabled buttons, animate-only buttons, or silently-failing controls were found in the
rendered UI. No fake actions were added to satisfy tests. Two pieces of unused starter
scaffolding (`ThemeProvider`, `ThemeToggle`) are **never rendered** and are therefore not
visible controls — see the "Unused scaffolding" note at the end.

- **Scan date:** Step 21 of the Azure parity migration.
- **Scope:** all 14 rendered routes + shared shell (sidebar, mobile nav, PWA, language).
- **Legend for Status:** ✅ Functional · ⚠️ Functional with note · ➖ Not a visible control.
- **Automated test files:** paths are relative to `nextjs_space/`.

---

## Shared shell — HCP portal (`app/hcp/_components/hcp-layout-client.tsx`)

Rendered on every `/hcp/*` route.

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /hcp/* | Sidebar nav link | Dashboard | Navigate to `/hcp` | `next/link` → `/hcp`, active-state highlight | ✅ | tests/e2e/hcp-journey.spec.ts; tests/e2e/clickable-controls.spec.ts | None | No change required |
| /hcp/* | Sidebar nav link | Wound Analysis | Navigate to `/hcp/analysis` | `next/link` → `/hcp/analysis` | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/* | Sidebar nav link | TBSA Calculator | Navigate to `/hcp/tbsa` | `next/link` → `/hcp/tbsa` | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/* | Sidebar nav link | Parkland Formula | Navigate to `/hcp/parkland` | `next/link` → `/hcp/parkland` | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/* | Sidebar nav link | Guidelines | Navigate to `/hcp/guidelines` | `next/link` → `/hcp/guidelines` | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/* | Sidebar nav link | Clinical Assistant | Navigate to `/hcp/chat` | `next/link` → `/hcp/chat` | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/* | Back link | Back to Home | Navigate to `/` | `next/link` → `/` | ✅ | tests/e2e/clickable-controls.spec.ts | None | No change required |
| /hcp/* | Icon button | Open menu (mobile) | Open the mobile sidebar drawer | `setMobileOpen(true)` → drawer slides in | ✅ | tests/e2e/hcp-journey.spec.ts (responsive) | None | No change required |
| /hcp/* | Icon button | Close menu (mobile) | Close the mobile sidebar drawer | `setMobileOpen(false)` | ✅ | tests/e2e/hcp-journey.spec.ts (responsive) | None | No change required |
| /hcp/* | Backdrop | (overlay) | Dismiss mobile drawer | `onClick` → `setMobileOpen(false)` | ✅ | manual | None | No change required |
| /hcp/* | User-menu toggle | (avatar/name) | Toggle the user dropdown | `setUserMenuOpen(v => !v)` | ✅ | manual | None | No change required |
| /hcp/* | Dropdown item | Log out | Clear session and return to login | `handleLogout`: clears `sessionStorage.hcp_auth`; if server session → `window.location = '/api/auth/logout'`, else `router.replace('/hcp-login')` | ✅ | tests/e2e/hcp-journey.spec.ts (logout step) | None | No change required |
| /hcp/* | Bottom nav item (mobile) | Dashboard/Analysis/TBSA/Chat | Navigate to the route | `next/link` per item | ✅ | tests/e2e/hcp-journey.spec.ts (responsive) | None | No change required |
| /hcp/* | Language toggle | Toggle language | Switch EN ⇄ BM | `LanguageToggleDark` → `setLang` (context) | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |

## Shared shell — Community portal (`app/community/_components/community-layout-client.tsx`)

Rendered on every `/community/*` route.

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /community/* | Sidebar nav link | Home | Navigate to `/community` | `next/link` → `/community` | ✅ | tests/e2e/community-journey.spec.ts; tests/e2e/clickable-controls.spec.ts | None | No change required |
| /community/* | Sidebar nav link | First Aid | Navigate to `/community/first-aid` | `next/link` | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community/* | Sidebar nav link | Self Assessment | Navigate to `/community/assessment` | `next/link` | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community/* | Sidebar nav link | Image Check | Navigate to `/community/image-check` | `next/link` | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community/* | Sidebar nav link | Articles | Navigate to `/community/articles` | `next/link` | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community/* | Sidebar nav link | Ask Phoenix | Navigate to `/community/chat` | `next/link` | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community/* | Back link | Back to Home | Navigate to `/` | `next/link` → `/` | ✅ | tests/e2e/clickable-controls.spec.ts | None | No change required |
| /community/* | Icon button | Open/close menu (mobile) | Toggle mobile drawer | `setMobileOpen` toggle + backdrop | ✅ | tests/e2e/community-journey.spec.ts (responsive) | None | No change required |
| /community/* | Language toggle | Toggle language | Switch EN ⇄ BM | `LanguageToggleDark` → `setLang` | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |

---

## Route: `/` — Landing (`app/_components/landing-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| / | Portal card link | Healthcare Professional Portal | Navigate to `/hcp-login` | `next/link` → `/hcp-login` | ✅ | tests/e2e/public-landing.spec.ts | None | No change required |
| / | Portal card link | Community Portal | Navigate to `/community` | `next/link` → `/community` | ✅ | tests/e2e/public-landing.spec.ts | None | No change required |
| / | Language toggle | Toggle language | Switch EN ⇄ BM | `LanguageToggle` → `setLang` | ✅ | tests/e2e/public-landing.spec.ts | None | No change required |

## Route: `/hcp-login` — HCP login (`app/hcp-login/_components/login-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /hcp-login | Form submit | Sign In | Authenticate and enter `/hcp` | `onSubmit` → POST `/api/auth/login`, on success writes session + `router.push('/hcp')`, on failure shows error | ✅ | tests/e2e/hcp-journey.spec.ts; tests/api/routes.spec.ts | None | No change required |
| /hcp-login | Quick-login button | (demo doctor/nurse) | Prefill + sign in as demo user | Sets credentials and submits demo login | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp-login | Icon button | Show/hide password | Toggle password visibility | `setShowPassword(v => !v)` → input type toggles | ✅ | manual | None | No change required |
| /hcp-login | Back link | Back to Home | Navigate to `/` | `next/link` → `/` | ✅ | tests/e2e/clickable-controls.spec.ts | None | No change required |
| /hcp-login | Anchor | Sign in with Microsoft Entra ID | Start Entra OAuth | `<a href="/api/auth/entra/login">` → server route | ✅ | manual (external IdP) | None | No change required |

## Route: `/hcp` — Dashboard (`app/hcp/_components/dashboard-client.tsx`, `dashboard-charts.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /hcp | (none) | — | — | Dashboard is display-only: stat cards, animated counters, and Recharts charts. No control has a click handler; nothing is presented as clickable. | ➖ | tests/e2e/hcp-journey.spec.ts (renders) | None | No control to wire (parity — original dashboard is informational) |

## Route: `/hcp/analysis` — Wound analysis (`app/hcp/analysis/_components/analysis-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /hcp/analysis | Upload area | Upload / drop image | Select an image to analyse | `onChange`/drop → reads file, sets preview | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/analysis | Button | Use Camera / Capture / Stop | Start camera, capture frame, stop stream | `startCamera` (getUserMedia), `capturePhoto` (canvas → dataURL), `stopCamera` | ✅ | manual (camera hardware) | None | No change required |
| /hcp/analysis | Button | Analyze Wound | Run AI analysis and stream result | POST `/api/analyze-wound` (SSE stream), renders result or explicit error | ✅ | tests/e2e/hcp-journey.spec.ts (`expectAiTerminalState`) | None | No change required |
| /hcp/analysis | Button | Clear / Remove image | Reset the form | Clears preview + result state | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/analysis | Link | Calculate Parkland Formula | Go to Parkland calculator | `next/link` → `/hcp/parkland` | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/analysis | Disabled state | Analyze Wound (disabled) | Prevent submit with no image / while loading | `disabled={!image \|\| loading}` — explained by empty/loading state | ✅ | manual | None | Intentional guard, not a dead control |

## Route: `/hcp/tbsa` — TBSA calculator (`app/hcp/tbsa/_components/tbsa-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /hcp/tbsa | Select | Age band | Recompute region percentages | `<select onChange>` → `setAge`, drives Lund & Browder weights | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/tbsa | Toggle buttons | Partial / Full thickness | Choose paint depth | `setDepth('ptl'\|'ftl')` | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/tbsa | Toggle buttons | Shade / Erase | Choose paint tool | `setTool('shade'\|'erase')` | ✅ | manual (canvas) | None | No change required |
| /hcp/tbsa | Range | Brush size | Change brush radius | `onChange` → `setBrushSize` | ✅ | manual (canvas) | None | No change required |
| /hcp/tbsa | Button | Reset | Clear the body diagram | `reset()` → bumps `resetSignal`, clears counts | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/tbsa | Canvas (BodyPainter ×2) | Body diagram | Paint burned regions | Pointer drag paints; `onCounts` recomputes live TBSA total + breakdown | ✅ | manual (canvas painting) | None | No change required |
| /hcp/tbsa | Link (conditional) | Calculate Parkland Formula | Carry TBSA into Parkland | Shown only when `total > 0`; `next/link` → `/hcp/parkland?tbsa={total}` | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |

## Route: `/hcp/parkland` — Parkland formula (`app/hcp/parkland/_components/parkland-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /hcp/parkland | Inputs | Weight, TBSA, time since burn | Recompute fluid volumes | Controlled inputs → live calculation (accepts `?tbsa=` prefill) | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/parkland | Toggle | Formula variant | Switch formula constant | `setFormula` → recomputes | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |

## Route: `/hcp/guidelines` — Guidelines (`app/hcp/guidelines/_components/guidelines-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /hcp/guidelines | Search input | Search guidelines | Filter list live | `onChange` → `setQuery` filters entries | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/guidelines | Category buttons | (category filters) | Filter by category | `setCategory` → filters entries | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/guidelines | Accordion header | (guideline title) | Expand/collapse detail | Toggles open index | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |

## Route: `/hcp/chat` — Clinical assistant (`app/hcp/chat/_components/hcp-chat-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /hcp/chat | Button | Escalate to specialist | Flag consult for human review | `setEscalated(true)` → shows escalation banner (client demo state, matches original) | ⚠️ | tests/e2e/hcp-journey.spec.ts | None | Parity behaviour — original has no server queue; updates visible state |
| /hcp/chat | Quick-prompt button | (suggested prompt) | Populate + send prompt | Sets input and sends message | ✅ | tests/e2e/hcp-journey.spec.ts | None | No change required |
| /hcp/chat | Upload | Attach image | Attach an image to the message | Reads file → preview | ✅ | manual | None | No change required |
| /hcp/chat | Icon button | Remove image | Detach attached image | Clears image state | ✅ | manual | None | No change required |
| /hcp/chat | Button | Send | Send chat message | POST `/api/hcp-chat`, renders reply or explicit error | ✅ | tests/e2e/hcp-journey.spec.ts (`expectAiTerminalState`) | None | No change required |

## Route: `/community` — Community home (`app/community/_components/community-home-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /community | Quick-action card link | First Aid / Assessment / Image Check / Articles / Chat | Navigate to the section | `next/link` per action | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community | Emergency link | Call 999 | Dial emergency services | `<a href="tel:999">` | ✅ | tests/e2e/clickable-controls.spec.ts (anchor check) | None | No change required |

## Route: `/community/first-aid` — First aid (`app/community/first-aid/_components/first-aid-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /community/first-aid | Accordion header | (step title) | Expand/collapse step | Toggles open index | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |

## Route: `/community/assessment` — Self assessment (`app/community/assessment/_components/assessment-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /community/assessment | Answer button | (wizard option) | Advance the wizard | Records answer → next question / result | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community/assessment | Button | Start over / Reset | Restart the wizard | Resets step + answers | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community/assessment | Emergency link | Call 999 | Dial emergency services | `<a href="tel:999">` (shown on severe result) | ✅ | manual | None | No change required |

## Retired route: `/community/image-check`

The former Community image controls and links are removed. Direct navigation redirects to
`/community`; `tests/e2e/community-journey.spec.ts` guards the redirect and absence of desktop/mobile
entry points.

## Route: `/community/articles` — Articles (`app/community/articles/_components/articles-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /community/articles | Category filter button | (category) | Filter article list | `setCategory` → filters | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community/articles | Accordion header | (article title) | Expand/collapse article | Toggles open index | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |

## Route: `/community/chat` — Ask Phoenix (`app/community/chat/_components/community-chat-client.tsx`)

| Route | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|-------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| /community/chat | Quick-prompt button | (suggested prompt) | Populate + send prompt | Sets input and sends message | ✅ | tests/e2e/community-journey.spec.ts | None | No change required |
| /community/chat | Button | Send | Send chat message | POST `/api/community-chat`, renders reply or explicit error | ✅ | tests/e2e/community-journey.spec.ts (`expectAiTerminalState`) | None | No change required |
| /community/chat | Emergency link | Call 999 | Dial emergency services | `<a href="tel:999">` in safety banner | ✅ | tests/e2e/clickable-controls.spec.ts (anchor check) | None | No change required |

---

## Global controls — PWA & language

| Location | Control | Label | Expected action | Actual action | Status | Automated test | Defect | Resolution |
|----------|---------|-------|-----------------|---------------|--------|----------------|--------|------------|
| App root (`components/pwa-install-prompt.tsx`) | Button | Install app | Trigger PWA install | Calls the captured `beforeinstallprompt` event's `prompt()`; banner only renders when the event fired (no dead button when unsupported) | ✅ | manual (browser install UX) | None | No change required |
| App root | Icon button | Dismiss install prompt | Hide the install banner | Sets dismissed flag (persisted) | ✅ | manual | None | No change required |
| App root | Button/detail | iOS install guide | Show manual iOS steps | Toggles the iOS instructions panel | ✅ | manual | None | No change required |
| All shells (`components/language-toggle.tsx`) | Button | Toggle language | Switch EN ⇄ BM | `LanguageToggle` / `LanguageToggleDark` → `setLang` via `LanguageProvider` | ✅ | tests/e2e/public-landing.spec.ts | None | No change required |

---

## Categories audited with NO controls present (by design / parity)

These control categories from the audit brief were checked and are **intentionally absent**
from the original Phoenix AI UI. None were fabricated (per the "do not add fake actions"
constraint), because adding them would be a redesign, not a faithful migration.

| Category | Finding | Resolution |
|----------|---------|------------|
| Report / export controls | No print/export/download-report control exists on any clinical page (analysis, TBSA, Parkland). | Not present in the original; none added (parity). |
| Theme controls | No visible dark/light theme switch is rendered anywhere. The app is light-mode only. | Not present in the original; none added (parity). See scaffolding note below. |
| Tabs (ARIA tablist) | Sectioned content uses accordions and filter buttons, not a tab widget. | Behaviour preserved as-is. |
| Dialog / modal controls | No modal dialogs in the flows; the mobile nav uses a slide-in drawer (covered above). | Behaviour preserved as-is. |

---

## Unused scaffolding (not visible controls)

| Component | File | Rendered? | Note | Resolution |
|-----------|------|-----------|------|------------|
| `ThemeProvider` | `components/theme-provider.tsx` | No — not mounted in `app/layout.tsx` or any layout | Leftover shadcn/ui + `next-themes` starter scaffolding. | Left in place, unrendered. Not a visible control; wiring a theme toggle would be a redesign (parity: light-mode only). |
| `ThemeToggle` | `components/theme-toggle.tsx` | No — no import renders it (only referenced in STYLE_GUIDE.md/build cache) | Dead code from the same starter. | Left in place, unrendered. Deliberately **not** wired into the UI to avoid fabricating a control. |
| `components/layouts/*` (app-shell, auth-layout, container, page-header, section) | `components/layouts/` | No — not imported by any rendered page | Generic layout scaffolding superseded by the route-specific `_components/*-layout-client.tsx` shells. | Left in place, unused; no visible controls. |

> `useTheme` in `components/ui/sonner.tsx` is a hook call inside the Toaster (defaults to the
> system/light theme); it renders no clickable control and is unaffected.

---

## Automated coverage summary

- **Structural guard:** `tests/e2e/clickable-controls.spec.ts` asserts, on every rendered
  route, that no anchor uses a placeholder href (`#`, empty, `javascript:`) and that every
  in-app link resolves (non-404). This fails deterministically if a dead link is reintroduced.
- **Journey coverage:** `tests/e2e/public-landing.spec.ts`, `tests/e2e/hcp-journey.spec.ts`,
  and `tests/e2e/community-journey.spec.ts` click through navigation, uploads, submits,
  toggles, accordions, filters, and the AI-backed flows (asserting a deterministic terminal
  state, never skipping).
- **API coverage:** `tests/api/routes.spec.ts` verifies the endpoints behind the submit/send
  controls (`/api/auth/login`, `/api/analyze-wound`, `/api/hcp-chat`, `/api/community-chat`) and
  verifies that retired `/api/community-analyze` is unavailable.
- **Manual-only controls:** camera capture, canvas painting, image attach/remove, PWA install,
  and the external Entra IdP redirect are marked "manual" above because they depend on
  hardware, pointer gestures, or third-party UX that is out of scope for headless automation.
