# Azure support evidence: persistent clinical-image input filtering

## Support request

Identify which Azure AI safety control rejects a legitimate severe hand-burn clinical photograph
after the configured Violence and Self-harm Prompt filters were both changed to enabled,
non-blocking annotation. Confirm whether the rejection comes from Hate, Sexual, Jailbreak/Prompt
Shield, another classifier, or a non-configurable multimodal provider restriction.

Do not request or attach the clinical image until the approved support channel and organisational
privacy process have been confirmed.

## Impact

- Phoenix AI cannot analyse the affected clinical photograph.
- The application fails safely and instructs the healthcare professional to use clinical judgement
  and manual assessment.
- No fabricated clinical result is returned.
- Other tested clinical/demo images can complete; this attachment fails consistently.

## Azure resource configuration

| Property | Value |
| --- | --- |
| Subscription | `BFG Solutions-JDNAINexus` |
| Subscription ID | `376a2984-f8d4-46e3-a1cb-90f58274d2dc` |
| Resource group | `rg-phoenixai-bfgs-demo` |
| Region | `eastus2` |
| AI account | `aif-phoenixai-oaprp7dte7bw2` |
| Account kind / SKU | `AIServices` / `S0` |
| Deployment | `gpt-4o` |
| Model version | `2024-11-20` |
| Deployment SKU / capacity | `GlobalStandard` / `10` |
| API version | `2024-10-21` |
| Authentication | User-assigned managed identity |
| Local authentication | Disabled |
| RAI policy | `phoenix-clinical-imagery` |
| Base policy / mode | `Microsoft.Default` / `Blocking` |

## Current policy boundary

| Category | Source | Threshold | Blocking | Enabled |
| --- | --- | --- | --- | --- |
| Hate | Prompt | Medium | Yes | Yes |
| Hate | Completion | Medium | Yes | Yes |
| Sexual | Prompt | Medium | Yes | Yes |
| Sexual | Completion | Medium | Yes | Yes |
| Violence | Prompt | High | No | Yes |
| Violence | Completion | High | Yes | Yes |
| SelfHarm | Prompt | High | No | Yes |
| SelfHarm | Completion | High | Yes | Yes |
| Jailbreak | Prompt | n/a | Yes | Yes |

## Reproduction

1. Sign in to the Phoenix AI HCP experience.
2. Select Acute Burn assessment.
3. Upload the unchanged severe hand-burn JPEG attachment.
4. Submit analysis.
5. Observe HTTP 422 `AI_CONTENT_FILTER`, source `input`.

The same attachment also failed through the independent General Wound path, excluding an
Acute-Burn-only output schema or prompt as the cause.

## Safe incident evidence

All attempts occurred on 2026-10-07 UTC. Azure omitted filter category and severity throughout.

| Policy state | Path | Duration | Application correlation ID | Result |
| --- | --- | ---: | --- | --- |
| Violence/Self-harm input blocking High | Acute Burn | 1.4–2.2 s | `e497f3aa-843a-4197-8229-2589fce9e836` | HTTP 422, input filter |
| Violence/Self-harm input blocking High | Acute Burn | 1.4–2.2 s | `361e6431-dd44-4afb-9545-2ac9e71d4da6` | HTTP 422, input filter |
| Violence/Self-harm input blocking High | Acute Burn | 1.4–2.2 s | `d7e4a9a7-506a-4b2a-96c6-03cd2ef12422` | HTTP 422, input filter |
| Violence/Self-harm input blocking High | Acute Burn | 1.4–2.2 s | `0e8beee6-5a89-4981-9c09-89be8a159606` | HTTP 422, input filter |
| Violence/Self-harm input blocking High | General Wound | 2.0 s | `aaa467da-99d5-4ee9-bf02-1dbd00fe5a3b` | HTTP 422, input filter |
| Violence input non-blocking | Acute Burn | 6.9 s | `4636115b-86ad-4aeb-9664-dcb487637d17` | HTTP 422, input filter |
| Violence input non-blocking | Acute Burn | 2.0 s | `52538490-5be8-494c-b92b-b1841059953f` | HTTP 422, input filter |
| Violence/Self-harm input non-blocking | Acute Burn | 36.3 s | `5fb7cb76-ac2e-4f7b-a5f3-61f88d3bbf49` | HTTP 422, input filter |
| Violence/Self-harm input non-blocking | Acute Burn | 1.8 s | `80fa91aa-fec7-43dc-9bab-e628b192f096` | HTTP 422, input filter |

Application correlation IDs are not Azure provider request IDs. Application Insights can use them
to locate the corresponding privacy-safe lifecycle events and any allowlisted provider request ID,
error code, type, or parameter that Azure supplied.

## Deployment evidence

| Change | Commit | Infrastructure run | Deployment result | Exact-image result |
| --- | --- | --- | --- | --- |
| Violence Prompt non-blocking | `5d14b17` | `37572683813` | Success; what-if showed `blocking: true => false` and attached `phoenix-clinical-imagery` | Still rejected |
| SelfHarm Prompt non-blocking | `be26403` | `37574897465` | Success; what-if showed the intended `blocking: true => false` transition | Still rejected |

Automatic application deployments `37572675144` and `37574886021` also succeeded.

## Exclusions established

- Not an application image-validation failure: the provider returns `AI_CONTENT_FILTER`.
- Not limited to the Acute Burn prompt/schema: General Wound fails with the unchanged image.
- Not a transient failure: repeated attempts fail consistently.
- Not a timeout root cause: most failures occur in approximately two seconds.
- Not solely the configurable Violence input filter: failure persisted after it became
  non-blocking.
- Not solely the configurable Self-harm input filter: failure persisted after it also became
  non-blocking.
- No evidence currently supports weakening Hate or Sexual input filtering.
- Jailbreak/Prompt Shield remains blocking and has not been weakened without classifier evidence.

## Requested Microsoft investigation

1. Resolve the Azure provider request(s) corresponding to the listed UTC attempts and application
   correlation IDs.
2. Identify the exact blocking classifier, category, severity, and policy layer.
3. Explain why category/severity are omitted from the `content_policy_violation` response.
4. Confirm whether image Prompt Shield/Jailbreak or another multimodal safety layer is applied
   outside the configured `raiPolicies` content filters.
5. Confirm whether `blocking: false` is honored for image input on this account, model version, API
   version, region, and deployment SKU.
6. Recommend a supported clinical-imagery configuration that preserves output filtering,
   Jailbreak protection, managed identity, and the existing safe-failure behavior.

## Privacy boundary

The application and this evidence package do not include image bytes, Base64, filename, prompt
text, patient context, model output, access tokens, secrets, or raw provider bodies. If Microsoft
requires the image, use only an approved private support upload after confirming authorisation and
retention handling.
