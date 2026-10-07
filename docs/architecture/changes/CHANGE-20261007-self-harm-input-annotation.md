# CHANGE-20261007 — Clinical-imagery Self-harm input annotation

## Summary

Change only the Self-harm Prompt entry in `phoenix-clinical-imagery` from blocking at High to
enabled, non-blocking annotation after Violence input annotation did not resolve the exact severe
hand-burn image.

## Evidence

- Azure what-if showed Violence Prompt `blocking: true => false`.
- The infrastructure deployment completed successfully and attached
  `phoenix-clinical-imagery` to `gpt-4o`.
- The unchanged attachment then failed twice more as HTTP 422 `AI_CONTENT_FILTER`, source `input`,
  in 6.9 and 2.0 seconds.
- Azure omitted category and severity on both attempts.
- Microsoft defines accidental body injury as Safe Self-harm, but a false-positive classifier
  remains medically plausible when Violence input no longer blocks.

No image bytes, Base64, filename, patient context, prompt, or clinical output were recorded.

## Impact

- **Level:** MEDIUM
- **Architecture version:** `8.12.0`
- **Components:** `API-HCP-ANALYSIS`, `AI-PROVIDER`, `INFRA-FOUNDRY-CONN`, `AZ-FOUNDRY`
- **Integrations:** `INT-APP-FOUNDRY`
- **Azure resources:** Existing `Microsoft.CognitiveServices/accounts/raiPolicies` child updated
- **Data / identity / storage / UX:** No change
- **Responsible AI controls:** Active `RAI-SAFE-014` updated
- **ADR:** amended ADR-0017

## Retained boundaries

- Violence and Self-harm Completion: blocking High
- Hate and Sexual Prompt/Completion: blocking Medium
- Jailbreak Prompt: blocking enabled
- Application image validation, schema validation, deterministic clinical rules, safe failure, and
  clinician oversight: unchanged

## Validation

- Compile Bicep and run Azure what-if/deployment
- RAI test asserts the exact Bicep filter entries
- Unit, RAI, typecheck, build, architecture, and Mermaid checks
- Retest the exact read-only attachment and record only safe operational metadata
