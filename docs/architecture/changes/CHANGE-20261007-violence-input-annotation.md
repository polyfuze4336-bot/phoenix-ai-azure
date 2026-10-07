# CHANGE-20261007 — Clinical-imagery Violence input annotation

## Summary

Change only the Violence Prompt entry in `phoenix-clinical-imagery` from blocking at High to
enabled, non-blocking annotation so severe burn/wound photographs can enter the clinical pipeline.

## Evidence

- Exact supplied attachment: four Acute Burn and one General Wound attempt.
- Result: HTTP 422 `AI_CONTENT_FILTER`, source `input`, every time.
- Latency: 1.4–2.2 seconds, before analysis completion.
- Azure omitted category/severity.
- Microsoft image severity guidance distinguishes ordinary wounds/surgical treatment (Safe
  Violence) from explicit graphic injuries (High Violence).

No image bytes, Base64, patient context, prompt, or clinical output were recorded during triage.

## Impact

- **Level:** MEDIUM
- **Components:** `API-HCP-ANALYSIS`, `AI-PROVIDER`, `INFRA-FOUNDRY-CONN`, `AZ-FOUNDRY`
- **Integrations:** `INT-APP-FOUNDRY`
- **Azure resources:** Existing `Microsoft.CognitiveServices/accounts/raiPolicies` child updated
- **Data / identity / storage:** No change
- **Responsible AI controls:** new Active `RAI-SAFE-014`; `RAI-SAFE-010` remains Active
- **ADR:** ADR-0017

## Retained boundaries

- Violence Completion: blocking High
- Self-harm Prompt and Completion: blocking High
- Hate Prompt and Completion: blocking Medium
- Sexual Prompt and Completion: blocking Medium
- Jailbreak Prompt: blocking enabled
- Application image validation, schema validation, deterministic clinical rules, safe failure, and
  clinician oversight: unchanged

## Validation

- Compile Bicep and run Azure what-if/deployment
- RAI test asserts the exact Bicep filter entries
- Unit, RAI, typecheck, build, architecture, and Mermaid checks
- Inspect live ARM policy and retest the exact supplied image
