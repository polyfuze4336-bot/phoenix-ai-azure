# ADR-0011: One Phoenix AI experience with global language enforcement

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** Phoenix AI prototype maintainers
- **Related components:** UI-LANDING, UI-HCP, UI-COMMUNITY, UI-PWA, UI-I18N,
  UI-V2-HCP, UI-V2-COMMUNITY, UI-V2-SHELL, LIB-V2, AI-LANGUAGE-VALIDATION,
  API-HCP-CHAT, API-HCP-ANALYSIS, API-COMMUNITY-CHAT, API-COMMUNITY-ANALYSIS
- **Related integrations:** INT-BROWSER-APP, INT-APP-FOUNDRY

## Context

ADR-0010 restored one public experience but retained the alternate route, component and library
trees behind a 404 middleware guard. The retained application also has a fragmented language model:
the root provider is not persistent, uses `en | bm`, many visible strings are embedded in
components, and only Community AI requests carry a language preference. Short prompt hints do not
prevent mixed-language responses.

## Current Architecture

- One public landing, HCP portal and Community portal are active.
- Alternate experience source is present but unreachable.
- `LanguageProvider` is root-scoped but resets to English on reload.
- UI copy mixes dictionary entries, inline bilingual data and hard-coded English.
- Community AI calls pass `lang`; HCP calls do not.
- There is no output-language detector or correction attempt.

## Decision

1. Delete the alternate route, component and library trees, their feature flags, assets and tests.
2. Retain shared AI, RAI, safety, persistence and Azure layers, and relocate any shared content before
   deleting a legacy library.
3. Standardize one root-owned `AppLanguage = "en" | "ms"`, persisted in localStorage and reflected
   in the document language immediately.
4. Centralize retained user-facing copy in structured English and Bahasa Melayu resources.
5. Require every AI request to carry `language`; reject invalid values.
6. Apply strict language instructions to every system prompt and staged prompt.
7. Buffer each completion for lightweight language detection and retry once, never indefinitely.
8. Log only `requestedLanguage`, `detectedLanguage`, route and correlation ID; never clinical text.
9. Keep technical enums canonical and translate their labels in the UI.

## Alternatives Considered

- Keep alternate source behind 404: rejected because it preserves confusing dead concepts and flags.
- Maintain `bm` as the API code: rejected because the requested application contract is `en | ms`;
  compatibility parsing may accept `bm` only during transition, but clients emit `ms`.
- Trust prompt instructions without validation: rejected because mixed-language output is an observed
  reliability risk.
- Retry until compliant: rejected because it creates unbounded latency and cost.

## Rationale

A single state and translation source prevents route-local drift. One shared AI enforcement helper
keeps behavior consistent across chat and image analysis while a one-retry ceiling bounds latency,
cost and failure modes. Canonical enums preserve stable data contracts.

## Architecture Impact

Architecture version becomes `4.0.0` (MAJOR). The alternate UI/library implementation is removed;
historical component IDs remain LEGACY for traceability. `UI-I18N` and
`AI-LANGUAGE-VALIDATION` are added. Browser and Foundry integrations retain their protocols but
standardize the language contract and bounded completion handling.

## Security Impact

No credential, identity or authorization change. localStorage contains only the non-sensitive
language code. Output validation logs language metadata only and never prompts, images, chat text or
clinical completions.

## Operational Impact

Validated completions may add one model call only when the first response is predominantly in the
wrong language. Existing correlation IDs and timeout controls remain in effect.

## Cost Impact

No fixed Azure cost change. A bounded retry can increase tokens for language-violating completions;
telemetry makes that rate observable without storing clinical content.

## Risks

- Lightweight language detection may classify short or clinically technical text as unknown;
  unknown output is accepted to avoid unnecessary retries.
- Removing legacy source can reveal hidden imports; typecheck/build and forbidden-reference scans
  are required.
- Comprehensive translation may miss visually rare states; retained-route E2E tests scan both
  languages and mixed-language markers.

## Rollback

Revert the implementation commit. Deleted alternate source remains recoverable from Git history.
No database or Azure rollback is required.

## Validation

Typecheck, lint, production build, unit/RAI/API tests, architecture and Mermaid validation, v2
forbidden-reference scan, and English/Bahasa Melayu retained-route E2E journeys.