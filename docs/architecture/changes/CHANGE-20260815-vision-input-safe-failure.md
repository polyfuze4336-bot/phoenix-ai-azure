# CHANGE-20260815 — Vision input safe failure

## Summary

Correct the Original HCP and Community image-analysis boundary so unsupported or malformed image
payloads fail locally with an actionable message instead of reaching Azure AI and surfacing as a
generic HTTP 500.

## Evidence

- Active revision `ca-phoenixai-oaprp7dte7bw2--0000006` was healthy and ran image
  `phoenixai:6fceacdabdc0ae344c94978797dede779190edfc`.
- Failed HCP and Community vision requests reached Azure AI, which returned HTTP 400; text chat and
  a controlled valid PNG analysis succeeded, proving endpoint, model, identity, and RBAC health.
- The shared validator admitted HEIC/HEIF although the deployed vision API accepts JPEG, PNG, WebP,
  and GIF. It also stripped data-URL prefixes only for size calculation, then routes sent the
  original unnormalized value upstream.

## Impact assessment

- **Level:** LOW.
- **Affected components:** `AI-VALIDATION`, `API-HCP-ANALYSIS`, `API-COMMUNITY-ANALYSIS`.
- **Affected integrations:** `INT-BROWSER-APP`; `INT-APP-FOUNDRY` contract is clarified, not changed.
- **Architecture version:** `3.0.0` to `3.0.1`.
- **ADR:** none; this corrects the documented Azure AI input contract without a new architectural
  decision.

## Intended implementation

1. Restrict analysis input to model-compatible JPEG, PNG, WebP, and GIF.
2. Normalize full data URLs to bare base64 and validate base64 syntax and image signatures.
3. Send only the normalized value to Azure AI.
4. Preserve the Original UI while displaying API validation errors to the user.
5. Add unit and API regression coverage and keep RAI controls `RAI-SAFE-001` and `RAI-SAFE-010`
   synchronized.

## Azure boundary

No resource, model, prompt, identity, RBAC, network, database, storage, or secret change.

## Validation

- `npm exec tsx -- --test tests/unit/image-input.test.ts` — PASS (11 tests).
- `npm run test:unit` — PASS (107 tests).
- `npm run test:rai` — PASS (23 tests).
- `npm run test:integration` — PASS (14 tests).
- `npm run test:api` — PASS (16 production-build HTTP tests).
- `npm run typecheck` — PASS after removing a stale generated `.next/types/app/v2` cache entry.
- `npm run lint` — PASS.
- `npm run build` — PASS; pre-existing `jose` Edge Runtime warnings only.
- `node scripts/validate-architecture.mjs` — PASS.
- Controlled live PNG request against pre-fix revision — PASS, proving the model and identity path.

Deployment and post-deploy live verification are recorded in the migration log after release.