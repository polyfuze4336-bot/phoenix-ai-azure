# ADR-0008: Make v2.0 the default public entry

- **Status:** Accepted
- **Date:** 2026-08-14
- **Deciders:** Phoenix AI product and migration team
- **Related components:** UI-LANDING, UI-V2-HCP, UI-V2-COMMUNITY, LIB-V2
- **Related integrations:** INT-BROWSER-APP
- **Supersedes:** ADR-0004 only for the root experience-selector decision

## Context

ADR-0004 introduced v2 as an additive experience and changed `/` into a selector advertising both the
original and v2 experiences. The product requirement now removes version 1.0 from the landing while
retaining version 2.0. Existing original routes are still needed for compatibility and rollback.

## Current architecture

`UI-LANDING` is feature-flag aware. v2 routes are isolated under `/v2/*`; original HCP and Community
routes remain implemented. Both experiences already reuse the same API and Azure integrations.

## Decision

When `v2Enabled` is true, `/` renders the existing v2 landing component directly. It does not advertise
or link to the original experience. When the flag is explicitly false, `/` retains the original
landing as a rollback path. Original routes are not deleted or redirected.

All other ADR-0004 decisions remain in force: v2 stays isolated, feature-flag gated and backed by the
existing APIs, identity, data and Azure resources.

## Consequences

- The default public journey enters v2 without a version-choice screen.
- Original deep links continue to work, minimizing compatibility and rollback risk.
- No API contract, integration, Azure resource or deployment-topology change is required.
- Public landing tests must assert v2 links and the absence of original/v1 entries.

## Alternatives considered

- **Delete original routes:** rejected because it is destructive and removes rollback compatibility.
- **Redirect `/` to `/v2`:** rejected because rendering the existing v2 landing at `/` avoids an
  extra navigation and preserves feature-flag rollback behavior.
- **Keep the selector but hide its original card:** rejected because selector copy and navigation
  would remain misleading.
