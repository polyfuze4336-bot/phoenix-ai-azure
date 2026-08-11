# CHANGE-20260807: Introduce Phoenix AI v2.0 enhanced experience while preserving the Original

- **Date:** 2026-08-07
- **Author:** Phoenix AI team
- **Related ADR:** [ADR-0004](../decisions/ADR-0004-dual-experience-v2.md) — "Dual-experience (Original + v2.0) additive architecture"
- **Architecture version:** 1.1.0 -> 1.2.0 (MINOR — new additive routes/components under `/v2/*`; existing topology and Azure footprint unchanged; existing URLs preserved)
- **Impact level:** MEDIUM (large surface of NEW UI, but additive: reuses all backend services, adds no Azure resources, does not modify the Original experience)
- **Status:** IMPLEMENTED — 2026-08-07. `/v2/*` live behind `FEATURE_V2_ENABLED` (default on); Original experience unchanged.

> Mandatory architecture pre-check for the "Phoenix AI v2.0 — Create an Enhanced Experience While
> Preserving the Original Application" task. Proposed diagram:
> [diagrams/CHANGE-20260807-phoenix-v2-proposed.mmd](./diagrams/CHANGE-20260807-phoenix-v2-proposed.mmd).

---

## 1. Existing original application architecture (AS-IS)

Authoritative reference: [../current-architecture.md](../current-architecture.md).

- **Runtime:** Next.js 14 App Router, React 18, TypeScript 5, standalone Node server.
- **Portals:** Landing (`app/page.tsx` → `app/_components/landing-client.tsx`), HCP portal
  (`app/hcp/*`), Community portal (`app/community/*`), PWA + EN/BM.
- **AI:** `lib/ai` provider → Azure OpenAI/Foundry `gpt-4o` (managed identity); staged
  wound-analysis pipeline (`lib/ai/analysis/pipeline.ts`, added in v1.1.0).
- **Clinical calc:** `lib/clinical/{parkland,tbsa}.ts` (deterministic, unit-tested).
- **Data:** Prisma → Azure PostgreSQL (only `AnalysisRecord` wired to UI; other models seeded demo).
- **Auth:** demo default (`AUTH_MODE=demo`), Entra opt-in; `middleware.ts` protects `/hcp*` in Entra mode.
- **Observability:** Application Insights + Log Analytics + health probes.

### Existing routes (must keep working, unchanged)

| Route | Purpose |
| --- | --- |
| `/` | Landing (two portal cards: HCP, Community) |
| `/hcp-login` | Demo HCP login |
| `/hcp`, `/hcp/analysis`, `/hcp/chat`, `/hcp/guidelines`, `/hcp/parkland`, `/hcp/tbsa`, `/hcp/history` | HCP portal |
| `/community`, `/community/articles`, `/community/assessment`, `/community/chat`, `/community/first-aid`, `/community/image-check` | Community portal |
| `/api/**` (15 routes) | AI, auth, health, HCP analyses |

### Current landing-page behaviour

`/` renders `LandingClient`: Phoenix gradient header, KKM/HKL endorsement banner, animated
Phoenix logo, tagline, and two cards linking to `/hcp-login` and `/community`.

---

## 2. Proposed dual-experience architecture

Two coexisting experiences behind one selector:

```
/ (redesigned selector) ── Original Experience (/hcp, /community, unchanged)
                        └─ Phoenix AI v2.0 (/v2/*, new, additive)
```

- **`/` redesign** — becomes an experience selector with two premium cards (Original / v2.0), a
  "What's new in v2.0?" section, and an optional capability comparison. Preserves the original
  logo, Phoenix gradient, brand colours, and KKM/HKL branding.
- **Original preserved** — `/hcp*` and `/community*` are byte-for-byte unchanged. A small
  "Switch experience" affordance is the only optional addition (non-destructive).

### New v2 routes

| Route | Purpose |
| --- | --- |
| `/v2` | v2 landing / entry |
| `/v2/hcp` | Clinical command-centre dashboard |
| `/v2/hcp/cases`, `/v2/hcp/cases/[id]` | Case-centric workflow + case detail (tabs) |
| `/v2/hcp/analysis` | Guided assessment workflow (context → upload → quality → AI → review → refine) |
| `/v2/hcp/chat` | Clinical AI assistant workspace |
| `/v2/hcp/guidelines` | Searchable guidelines |
| `/v2/hcp/calculators` | TBSA + Parkland consolidated |
| `/v2/hcp/reports` | Structured clinical reports |
| `/v2/hcp/insights` | Operational/demo analytics |
| `/v2/community`, `/v2/community/{assessment,chat,first-aid,image-check,education}` | Enhanced community portal |

### Shared components (reused across Original + v2)

- `components/phoenix-logo.tsx` (original logo — unchanged).
- `lib/ai/*` (provider, staged analysis pipeline, prompts, schemas, streaming).
- `lib/clinical/{parkland,tbsa}.ts` (deterministic calculators).
- `lib/i18n.ts`, `components/language-provider.tsx` (EN/BM).
- `components/ui/*` (shadcn/ui), `lib/telemetry/*`, auth/session, `lib/db`.
- `app/api/analyze-wound` and `app/api/hcp-chat` (v2 calls the same endpoints).

### Components that must remain ISOLATED (v2-only, never imported by Original)

- `components/v2/phoenix-v2-shell.tsx` (new shell — does NOT touch `app/hcp/_components/hcp-layout-client.tsx`).
- `app/v2/**` route tree.
- `lib/v2/*` (feature flags, synthetic demo data, case model, insights aggregation).

### AI service reuse

v2 reuses the same `lib/ai` provider, Foundry endpoint, staged pipeline, and `/api/analyze-wound`
+ `/api/hcp-chat` routes. **No new AI resource.** Model selection continues via
`AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` / `AZURE_AI_CHAT_MODEL_DEPLOYMENT`.

### Database reuse

v2 case/insights UI uses **synthetic, clearly-labelled** in-memory demo data (`lib/v2/demo-data.ts`)
by default — no schema change, no migration. Where PostgreSQL is available, existing
`AnalysisRecord` persistence is reused unchanged. **No new tables in this change.**

### Storage reuse

No new storage workflow. v2 image handling uses the existing client-side base64 → `/api/analyze-wound`
path (same as Original). Blob remains optional/unused.

### Monitoring impact

Reuses Application Insights via existing `lib/telemetry`. v2 pages emit page/telemetry events
through the same provider. No new monitoring resource.

### Deployment impact

Same App Service, same standalone Next.js build, same GitHub Actions + Bicep. New routes ship in
the same bundle. No infra change; `azure-resource-map.md` unchanged except documentation notes.

### Rollback approach

`FEATURE_V2_ENABLED=false` hides all v2 navigation and the selector routes v1-only (the `/` selector
degrades to the original two-portal landing). Because v2 is additive and isolated, reverting the
commit fully restores v1 with zero data/infra cleanup.

### Cost impact

Negligible/none at rest — no new Azure resources. Incremental AI token cost only when a user
actively runs a v2 assessment or chat (same per-call cost as Original; staged pipeline already
accounted for in v1.1.0). Larger JS bundle (new routes) served by the existing App Service.

### Testing impact

- New `tests/original/*` regression guard (existing routes/behaviour unchanged).
- New `tests/v2/*` unit tests (feature flags, demo-data invariants, case model, insights aggregation).
- New Playwright v2 journey (selector → v2 → assessment → case → report).
- Existing unit/e2e suites must continue to pass unchanged.

---

## 3. Impact assessment

| Dimension | Impact | Notes |
| --- | --- | --- |
| Components | ADD (isolated) | `app/v2/*`, `components/v2/*`, `lib/v2/*`; Original untouched |
| Integrations | REUSE | Same Foundry/AI, PostgreSQL, App Insights; no new integration |
| Azure footprint | NONE | No new resources |
| Data/identity/storage | NONE | No schema/migration; synthetic labelled demo data |
| Existing URLs | PRESERVED | `/hcp*`, `/community*` unchanged |
| Version | 1.1.0 → 1.2.0 | MINOR (additive, backward-compatible) |
| ADR required | YES | ADR-0004 |

---

## 4. Safety, honesty & branding guardrails

- Original `public/logo.png` reused verbatim; never redrawn/replaced.
- Phoenix palette (primary `0 100% 27%` = `#8B0000`, gradient `#8B0000→#F59B0C`) reused as the
  v2 token foundation; v2 is brighter/cleaner but recognisably Phoenix.
- No unsupported claims (no "diagnostic accuracy", "clinical-grade", "FDA/MOH approved").
- All fictional data labelled "Synthetic demonstration data"; a discreet "Demo Environment" marker.
- No fake runtime analytics — insights derive deterministically from the labelled demo dataset.
- No placeholder links or dead buttons; disabled features hide their nav entries.

## 5. Validation (post-implementation)

- Typecheck, unit tests (original + v2), production build, Mermaid render, architecture drift check.
- Manual route check of all acceptance-criteria routes.
