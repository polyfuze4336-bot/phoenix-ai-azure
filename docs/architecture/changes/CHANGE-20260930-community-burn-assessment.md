# CHANGE-20260930 — Community burn assessment

## Impact
- **Level:** MEDIUM
- **Architecture version:** `8.3.0` → `8.4.0`
- **ADR:** Not required; the existing Community UI and Azure vision provider are reused without
  changing identity, data retention or resource topology.

## Changes
- Community questionnaire and existing burn score run before optional image upload. Unmapped
  mechanisms cannot be assigned new numeric scores; an indeterminate result is shown when no
  deterministic escalation applies. Existing minor/moderate/emergency tiers map to Minor/Major/Major.
- Explicit prototype red flags take precedence over image observations. Dispositions are primary
  care, hospital or hospital plus 999. Age and time are context only and displayed locally in the
  result; uncertain symptom answers are called out even when they do not change disposition.
- Every result includes professional-care guidance and First Aid Tips; bilingual First Aid guides
  are reorganized without removing the existing wound or sunburn guidance.
- The image API validates input and returns only plain-language supporting observations. Images
  and questionnaires are not logged or retained.

## Limitations
- Prototype escalation rules and image interpretation require clinical review; this is not a
  diagnostic or clinically validated tool. No image alone can classify a burn safely.

## Validation
- PASS: production build (offline Next.js test-only font responses), typecheck, lint,
  134 unit, 35 RAI, 14 integration, 24 API, 13 focused Community browser tests,
  and architecture drift validation. Community mobile widths 320–430px, tablet and
  desktop are covered by browser tests.
- Full E2E also exercises HCP flows; unrelated pre-existing HCP assertions require
  maintenance. Live Azure image interpretation and clinical accuracy were not tested.
