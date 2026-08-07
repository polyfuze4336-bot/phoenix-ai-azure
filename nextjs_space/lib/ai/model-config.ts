/**
 * AI model deployment selection — purpose-specific, configurable.
 *
 * The app previously used a single `AZURE_AI_MODEL_DEPLOYMENT` for chat AND
 * image analysis. This helper lets the two workloads be pointed at different
 * Azure deployments so the analysis pipeline can use a higher-accuracy
 * multimodal model without changing the (latency-sensitive, cheaper) chat model.
 *
 * All variables are OPTIONAL and fall back to the existing single deployment,
 * so behaviour is unchanged until an operator opts in.
 *
 *   AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT  -> wound image analysis pipeline
 *   AZURE_AI_CHAT_MODEL_DEPLOYMENT      -> HCP + community chat
 *   AZURE_AI_MODEL_DEPLOYMENT (legacy)  -> default for both
 *
 * Server-only.
 */

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

/**
 * Deployment for the wound image-analysis pipeline. Prefer a dedicated
 * analysis deployment; otherwise fall back to the shared default. `undefined`
 * means "let the provider use its configured default".
 */
export function getAnalysisModelDeployment(): string | undefined {
  return firstEnv('AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT', 'AZURE_AI_MODEL_DEPLOYMENT', 'AZURE_OPENAI_DEPLOYMENT');
}

/** Deployment for HCP + community chat. Falls back to the shared default. */
export function getChatModelDeployment(): string | undefined {
  return firstEnv('AZURE_AI_CHAT_MODEL_DEPLOYMENT', 'AZURE_AI_MODEL_DEPLOYMENT', 'AZURE_OPENAI_DEPLOYMENT');
}

export type AnalysisPipelineMode = 'staged' | 'single';

/**
 * Which analysis pipeline to run. `staged` (default) = the multi-stage,
 * evidence-gated pipeline; `single` = the original single-pass call. Set
 * `AI_ANALYSIS_PIPELINE=single` to revert instantly with no schema break.
 */
export function getAnalysisPipelineMode(): AnalysisPipelineMode {
  const raw = process.env.AI_ANALYSIS_PIPELINE?.trim().toLowerCase();
  return raw === 'single' ? 'single' : 'staged';
}

/**
 * Optional consensus mode: run the reader stages twice and reconcile. Default
 * OFF (evidence-gated) — enabling roughly doubles analysis cost/latency.
 */
export function isConsensusModeEnabled(): boolean {
  const raw = process.env.AI_ANALYSIS_CONSENSUS_MODE?.trim().toLowerCase();
  return raw === 'on' || raw === 'true' || raw === '1';
}
