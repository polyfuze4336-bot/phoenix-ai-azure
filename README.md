# Phoenix AI — Burn & Wound Care Assessment Tool (Azure)

> **This project is a parity migration of the Phoenix AI application from Abacus.AI to Microsoft Azure.**
>
> It is a **faithful migration, not a redesign**. The Azure version preserves the original
> Phoenix AI name, branding, logo, page/navigation structure, colour palette, typography,
> spacing, components, charts, animations, responsive behaviour, clinical terminology and
> user journeys as closely as technically possible. Changes are made only where an
> incompatibility prevents faithful migration, and such changes are documented in the
> migration audit trail.

- **Source application (Abacus.AI):** https://phoenixai-burnandwound.abacusai.app/hcp
- **Application name:** Phoenix AI — Burn & Wound Care Assessment Tool
- **Migration audit trail:** [docs/migration/MIGRATION.md](docs/migration/MIGRATION.md)
- **Current architecture (AS-IS):** [docs/architecture/current-architecture.md](docs/architecture/current-architecture.md)
- **Target architecture:** [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)
- **Test strategy:** [docs/testing/TEST-STRATEGY.md](docs/testing/TEST-STRATEGY.md)

---

## What this app is

Phoenix AI is an AI-powered clinical decision support tool for **burn and wound care** in
Malaysia, with two portals:

- **`/hcp`** — Healthcare Professional portal (dashboard, wound-image analysis, clinical
  chat, TBSA estimator, Parkland fluid calculator, guidelines).
- **`/community`** — Public/community portal (first-aid guides, self-assessment, image check,
  articles, chat).

It supports English and Bahasa Melayu, and ships as an installable PWA.

### Application entry

The root `/` is the single Phoenix AI landing page. It links directly to the HCP and Community
portals above. English and Bahasa Malaysia are controlled by one persisted application-wide
language selection.

## Tech stack (imported from source)

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix), framer-motion |
| Charts | recharts, chart.js, plotly.js |
| AI | OpenAI-compatible chat completions (vision + streaming) |
| Runtime | Node.js 22 (see [.nvmrc](.nvmrc)) |

The application source lives under [`nextjs_space/`](nextjs_space/) exactly as imported.

## Runtime dependency on Azure

AI routes use an Azure AI/OpenAI-compatible vision deployment through managed identity. Azure
PostgreSQL supports authorized HCP analysis history; private Blob Storage is provisioned but remains
unwired to the current UI. See the current architecture for exact runtime boundaries.

The deployed application does **not** depend on a developer laptop, local database, local file
share or `localhost` service.

## Local development

> Prerequisites: Node.js 22 (`nvm use`), npm.

```powershell
cd nextjs_space
npm install --legacy-peer-deps   # pre-existing eslint peer conflict; runtime unaffected
copy ..\.env.example .env         # then fill in local values (never commit .env)
npm run dev                       # http://localhost:3000
```

Production build:

```powershell
cd nextjs_space
npm run build
npm run start
```

## Configuration

Copy [`.env.example`](.env.example) to `nextjs_space/.env` for local development. **No secrets
are committed to this repository.** On Azure, configuration is supplied via App Service /
Container Apps app settings, with secrets sourced from Azure Key Vault.

## Architecture

> Architecture version: **6.0.0** (see [docs/architecture/ARCHITECTURE_VERSION](docs/architecture/ARCHITECTURE_VERSION)).

Phoenix AI runs as a Next.js standalone server on Azure Container Apps, calling the environment-owned
Azure AI Services `gpt-4o` deployment through managed identity, with PostgreSQL, Blob Storage, Key
Vault, Application Insights and Log Analytics in `rg-phoenixai-bfgs-demo`.

```mermaid
flowchart LR
    Users["Users (Clinicians & Public)"] --> App["Phoenix AI (Next.js on Azure Container Apps)"]
    App -->|"managed identity"| Foundry["Microsoft Foundry / Azure OpenAI (gpt-4o)"]
    App -->|"sslmode=require"| PostgreSQL["Azure PostgreSQL Flexible Server"]
    App -.->|"optional, not wired to UI"| Blob["Azure Blob Storage"]
    App --> KV["Azure Key Vault"]
    App --> Insights["Application Insights"] --> Logs["Log Analytics"]
    GitHub["GitHub Actions (OIDC)"] --> App
```

This is explicitly a **PROTOTYPE / DEMO DEVELOPMENT MODE** repository. Keep architecture and RAI
documentation reasonably current in the same task; there is no pre-change approval or PR gate.

- **Current architecture (AS-IS):** [docs/architecture/current-architecture.md](docs/architecture/current-architecture.md)
- **Component inventory:** [docs/architecture/component-inventory.md](docs/architecture/component-inventory.md)
- **Integration inventory:** [docs/architecture/integration-inventory.md](docs/architecture/integration-inventory.md)
- **Azure resource map:** [docs/architecture/azure-resource-map.md](docs/architecture/azure-resource-map.md)
- **Decisions (ADRs):** [docs/architecture/decisions/](docs/architecture/decisions/)
- **Change records:** [docs/architecture/changes/](docs/architecture/changes/)
- **Diagrams:** [docs/architecture/diagrams/](docs/architecture/diagrams/)

## Responsible AI & AI Assurance

AI output in Phoenix AI is **clinical decision-support under human supervision**, not an autonomous
diagnosis. Responsible AI controls are surfaced as a first-class layer with a **code-based control
register** as the single source of truth ([`nextjs_space/lib/rai/controls.ts`](nextjs_space/lib/rai/controls.ts)),
mapped to Microsoft's six Responsible AI principles and traced to code and tests.

- Clinically sensitive values (Parkland fluid resuscitation, Lund & Browder TBSA) are computed
  **deterministically**, never guessed by the model.
- Deterministic safety rules run after every analysis: no fabricated measurements, Fitzpatrick /
  ethnicity **non-inference**, schema validation, automated consistency review, special-site
  escalation, confidence capping and safe failure.
- Every result is **AI-labelled**, carries confidence + explicit limitations, and is presented for
  **clinician review** (reviewed / modified / escalated).
- Controls are graded honestly **Active / Partial / Planned**. Phoenix AI makes **no** claim of being
  "certified", "approved", "bias free" or "100% safe".

The governed documentation and test evidence are the current assurance review surface; the retained
clinical interface does not yet display the complete metadata envelope. Tests: `npm run test:rai`.
Full documentation: [docs/rai/](docs/rai/README.md) (start with the
[executive summary](docs/rai/executive-summary.md)).

## Repository layout

```
.
├─ nextjs_space/            # Imported Phoenix AI application (Next.js) — source of truth
├─ Uploads/                 # Sample clinical images from the source (reference only)
├─ docs/
│  ├─ migration/            # Migration audit trail & step log
│  ├─ architecture/         # Current (AS-IS) + target architecture, ADRs, diagrams, changes
│  ├─ rai/                  # Responsible AI framework, controls, evidence & limitations
│  └─ testing/              # Test & UI-parity strategy
├─ .github/
│  ├─ workflows/            # One automatic deploy + manual infrastructure
│  └─ copilot-instructions.md
├─ AGENTS.md                # Prototype contributor guidance
├─ .editorconfig
├─ .nvmrc
├─ .env.example             # Config template (no secrets)
└─ README.md
```

## Contributing & repository workflow

Open a Codespace, edit with Copilot, test locally, commit, and push directly to `main`. The single
deployment workflow validates the app and updates Azure automatically. Pull requests and manual
approvals are optional, not required. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License / status

Internal migration project. Original Phoenix AI branding and assets are used as supplied by
the source application; do not replace the Phoenix AI logo.
