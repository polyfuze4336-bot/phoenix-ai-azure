# CHANGE-20260815 — Single experience and global language

## Summary

Remove the unreachable alternate experience source and make English/Bahasa Melayu one persistent,
application-wide contract across the UI and all AI routes.

## Impact assessment

- **Level:** MAJOR.
- **Architecture version:** `3.0.1` to `4.0.0`.
- **ADR:** ADR-0011.
- **Removed implementation components:** UI-V2-HCP, UI-V2-COMMUNITY, UI-V2-SHELL, LIB-V2.
- **Added components:** UI-I18N, AI-LANGUAGE-VALIDATION.
- **Changed integrations:** INT-BROWSER-APP, INT-APP-FOUNDRY.
- **Azure impact:** NONE.

## Intended implementation

1. Relocate shared first-aid content and delete `app/v2`, `components/v2`, `lib/v2`, v2-only tests,
   flags, CSS and assets.
2. Keep `/` as the direct Phoenix AI landing with HCP and Community entry actions and the supplied
   original logo.
3. Replace `en | bm` with persisted `AppLanguage = "en" | "ms"` at the root provider.
4. Move retained UI text to structured `lib/i18n/en.ts` and `lib/i18n/ms.ts` resources.
5. Pass `language` to all four AI routes and reject invalid values.
6. Add strict prompt language instructions, lightweight detection and one bounded rewrite attempt.
7. Translate canonical clinical values at presentation time.
8. Add unit, RAI, API and retained-route E2E coverage for both languages and obvious mixed output.

## Responsible AI impact

- `RAI-INCL-001` expands from Community-focused bilingual support to the complete application and
  all AI output.
- Add a governed language-consistency control with strict prompt instructions, bounded validation,
  metadata-only telemetry and tests.
- No clinical meaning, safety rule, model deployment or diagnostic assurance claim changes.

## Validation

PASS:

- Unit tests: 96 passed.
- Responsible AI tests: 26 passed.
- Integration tests: 14 passed.
- Production HTTP API tests: 20 passed.
- Retained-route and bilingual E2E tests: 22 passed, including English and Bahasa Melayu coverage
  for every retained HCP and Community route and explicit 404 checks for representative `/v2`
  routes.
- TypeScript: passed with no errors.
- ESLint: passed with no warnings or errors.
- Next.js production build: passed; 18 static pages generated and no `/v2` route published.
- Architecture drift validation: passed.
- Mermaid validation: 7 diagrams passed.

Local validation intentionally ran without Azure AI or PostgreSQL credentials. AI-backed journey
steps reached the explicit configuration-error terminal state, and database-backed history degraded
without hanging; configured live-service behavior remains a deployment verification responsibility.