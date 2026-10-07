# ADR-0017: Annotate rather than block Violence input for clinical imagery

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** Phoenix AI prototype owner
- **Related components:** `API-HCP-ANALYSIS`, `AI-PROVIDER`, `INFRA-FOUNDRY-CONN`, `AZ-FOUNDRY`
- **Related integrations:** `INT-APP-FOUNDRY`

## Context

The `phoenix-clinical-imagery` policy already used the least restrictive blocking threshold
(`High`) for Violence and Self-harm. A supplied severe hand-burn photograph was nevertheless
rejected on five consecutive submissions across both Acute Burn and General Wound paths. Every
failure was HTTP 422 `AI_CONTENT_FILTER`, source `input`, within 1.4–2.2 seconds. Azure did not
return category or severity.

Microsoft's image severity definitions list ordinary wounds and surgical treatment as Safe
Violence imagery but explicit graphic injuries as High Violence. The repeatable image-level failure
therefore supports a narrow Violence-input mitigation rather than weakening unrelated filters.

## Current Architecture

An environment-owned Azure AI Services account hosts `gpt-4o`. The Bicep-declared
`phoenix-clinical-imagery` policy is attached to that deployment. The application validates images,
uses schema-constrained staged analysis, applies deterministic safety rules, and treats every
provider refusal as a safe failure.

## Decision

Keep the Violence Prompt classifier enabled but set `blocking: false`, making it annotation-only.
Keep Violence Completion and Self-harm Prompt/Completion blocking at High, Hate and Sexual blocking
at Medium, and Jailbreak Prompt protection enabled.

## Alternatives Considered

- **Keep High blocking and require manual assessment:** rejected because the supplied clinical image
  fails deterministically before analysis despite the existing least restrictive threshold.
- **Disable every input filter:** rejected as unnecessarily broad.
- **Disable Violence output filtering:** rejected because the failure is input-side and output
  protection does not prevent clinical imagery from reaching the model.
- **Alter, blur, crop, or recolor the image to evade classification:** rejected because it could
  remove clinically relevant evidence and intentionally work around a safety classifier.

## Rationale

The decision is category-specific, input-only, and evidence-based. It enables medically necessary
graphic wound input while retaining output filtering, unrelated input categories, prompt shields,
application validation, schema checks, deterministic controls, and clinician review.

## Architecture Impact

Architecture version `8.11.0`, impact MEDIUM. The existing policy child resource is reconfigured;
no component, integration boundary, model, identity, network, data store, or runtime dependency is
added.

## Security Impact

No credential, identity, RBAC, secret, or network change. More graphically violent input can reach
the model, but only through the authenticated HCP analysis route and existing server-side managed
identity path. Output and unrelated-category filters remain blocking.

## Operational Impact

Apply the Bicep change through the manual Infrastructure workflow with deployment enabled. Verify
the live policy through ARM and retest the exact attachment. Continue monitoring privacy-safe
correlation and filter telemetry.

## Cost Impact

No fixed-resource cost change. Images previously rejected before inference may now consume model
tokens.

## Risks

- A genuinely violent image can pass the Violence input filter. Mitigations: HCP-only route,
  retained image validation, clinical prompts, output filtering, schema validation, deterministic
  safety controls, and clinician review.
- Azure can still reject through Self-harm, Hate, Sexual, Jailbreak, or provider-level protections.
- The exact Azure category was omitted, so live acceptance must be verified after deployment.

## Rollback

Set Violence Prompt `blocking` back to `true` in `infra/modules/foundry-connection.bicep`, deploy the
Infrastructure workflow, and confirm the live policy through ARM.

## Validation

- Bicep compile and subscription what-if/deployment
- RAI control test asserting the exact retained filter boundaries
- Full unit, RAI, typecheck, build, architecture, and Mermaid validation
- Live policy inspection and exact-image Acute Burn retest
