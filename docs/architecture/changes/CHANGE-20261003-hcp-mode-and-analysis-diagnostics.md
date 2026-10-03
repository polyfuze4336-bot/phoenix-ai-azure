# HCP mode selector and analysis diagnostics — 2026-10-03

- **Impact:** LOW; architecture 8.5.0 → 8.6.0. No new ADR: existing UI-HCP and
  API-HCP-ANALYSIS boundaries and integrations remain unchanged.
- **Change:** Move the existing persisted HCP assessment-mode selector from both
  sidebars to the top header. Keep the same mode-filtered navigation. Record
  sanitized analysis mode/stage/category and provider HTTP status/request ID on
  failures; never log image content, patient context or raw provider responses.
- **Azure footprint:** unchanged. Production remains a Container App with
  Microsoft.Default filtering and a managed-identity Azure AI deployment.
- **Limit:** repository evidence cannot establish the failing deployed revision,
  provider status, or whether both modes fail at the same stage. Operators must
  correlate live revision, sanitized logs and configuration presence before
  attributing or changing a production setting.
- **Validation:** unit/RAI/integration suites, lint, drift check and CodeQL passed.
  Build is blocked by sandbox Google Fonts DNS; typecheck also reports existing
  `lib/analysis/history.ts` errors. Browser/API suites need a successful build.
