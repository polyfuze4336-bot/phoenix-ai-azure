# Model governance

Phoenix AI treats the AI model as **configuration under governance**, not a hard-coded dependency.

## Selection
- The analysis and chat model deployments are resolved from environment configuration in
  [`lib/ai/model-config.ts`](../../nextjs_space/lib/ai/model-config.ts):
  - `AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT` — wound image analysis pipeline.
  - `AZURE_AI_CHAT_MODEL_DEPLOYMENT` — HCP + community chat.
  - `AZURE_AI_MODEL_DEPLOYMENT` (legacy) — default for both.
- Because the deployment is configuration, it can be swapped, A/B-tested and version-tracked without a
  code change. **This documentation deliberately does not hard-code a model name** — the current
  deployment is shown live on the AI Assurance → Governance panel (deployment name only; not a
  secret).

## Access
- All calls authenticate with a **managed identity** via `DefaultAzureCredential`
  ([`lib/ai/azure-credential.ts`](../../nextjs_space/lib/ai/azure-credential.ts)). No model keys are
  stored in the app (**RAI-PRIV-001**).
- Images are sent to the model only from **server-side** API routes (**RAI-PRIV-002**).

## Pipeline mode
- `AI_ANALYSIS_PIPELINE=staged` (default) runs the four-stage evidence-gated pipeline;
  `AI_ANALYSIS_PIPELINE=single` reverts to the single-pass fallback for rollback.

## Versioning & traceability
- Every analysis records the model deployment name, pipeline mode/version, prompt versions and schema
  version in the metadata envelope ([`lib/ai/analysis/metadata.ts`](../../nextjs_space/lib/ai/analysis/metadata.ts))
  — see **RAI-TRANS-004** and [prompt-governance.md](./prompt-governance.md).

## Change control
- Model or pipeline changes follow the architecture-first change policy
  ([`AGENTS.md`](../../AGENTS.md)) and the Responsible AI change policy
  ([`.github/copilot-instructions.md`](../../.github/copilot-instructions.md)).
