# Clinical imagery content-filter policy — 2026-10-05

- **Impact:** LOW; architecture 8.7.0 → 8.8.0. No new ADR: topology, integrations and identity are
  unchanged; one child resource is added to the existing AI Services account.
- **Trigger:** Live telemetry showed about 98 failed first-stage image analyses (HTTP 400 from Azure,
  reported as unknown 502). Container logs showed Azure error `content_policy_violation` — "Your input
  image may contain content that is not allowed by our content safety system." — for real wound
  images (limitation LIM-014).
- **Change:**
  - Create custom policy `phoenix-clinical-imagery` (base `Microsoft.Default`, mode Blocking) with
    Violence and Self-harm at High on prompts and completions, Hate and Sexual at Medium, Jailbreak on.
  - Attach it to the `gpt-4o` deployment (model 2024-11-20, GlobalStandard, capacity 10 and
    `NoAutoUpgrade` unchanged). Applied live through Cloud Shell and verified via ARM
    (`provisioningState` Succeeded, `raiPolicyName` = `phoenix-clinical-imagery`).
  - Declare the same policy and attachment in `infra/modules/foundry-connection.bicep` so an
    infrastructure deployment does not revert it.
  - Application: classify `content_policy_violation` as `AI_CONTENT_FILTER` (422); log a redacted
    Azure error code/type/param for diagnosis (RAI-PRIV-003 text updated).
- **Azure footprint:** one added resource (`Microsoft.CognitiveServices/accounts/raiPolicies`). No
  RBAC, secret, network, SKU, region or app-setting change.
- **Limit:** this narrows, not removes, filtering. Effectiveness on real clinical images is not yet
  confirmed; Azure may still block some images. Fully disabling filters requires Microsoft approval
  and was not attempted.
- **Validation:** `az bicep build` compiles; unit (161) and RAI (36) suites pass; live deployment
  verified via ARM. Real-image acceptance to be confirmed by users.
