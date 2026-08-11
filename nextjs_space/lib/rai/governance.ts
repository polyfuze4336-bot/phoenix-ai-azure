/**
 * Governance snapshot — a factual, non-sensitive summary of the AI configuration
 * currently governing PhoenixIQ assessments.
 *
 * Assembled from environment + version constants. Contains NO secrets (only the
 * model deployment NAME, which is configuration). Rendered read-only on the AI
 * Assurance page's Governance section.
 */

import {
  ANALYSIS_PIPELINE_VERSION,
  ANALYSIS_SCHEMA_VERSION,
  STAGED_PROMPT_VERSIONS,
} from '../ai/prompts/versions';
import { APP_VERSION } from '../v2/version';

export interface GovernanceSnapshot {
  appVersion: string;
  /** Model deployment NAME (configuration, not a secret); 'configured default' when unset. */
  analysisModelDeployment: string;
  chatModelDeployment: string;
  apiVersion: string;
  pipelineMode: 'staged' | 'single';
  pipelineVersion: string;
  schemaVersion: string;
  promptVersions: typeof STAGED_PROMPT_VERSIONS;
  architectureVersion: string;
  /** Auth mechanism for Azure AI / Storage. */
  identityModel: string;
  /** Honest evaluation posture. */
  evaluationPosture: string;
}

function envOr(names: string[], fallback: string): string {
  for (const n of names) {
    const v = process.env[n]?.trim();
    if (v) return v;
  }
  return fallback;
}

/**
 * Build the governance snapshot. Call server-side (reads process.env). The
 * architecture version is passed in by the caller (read from the repo file) so
 * this module stays free of filesystem access for client bundling safety.
 */
export function getGovernanceSnapshot(architectureVersion = 'see docs/architecture'): GovernanceSnapshot {
  const pipelineMode =
    (process.env.AI_ANALYSIS_PIPELINE?.trim().toLowerCase() === 'single' ? 'single' : 'staged') as
      | 'staged'
      | 'single';

  return {
    appVersion: APP_VERSION,
    analysisModelDeployment: envOr(
      ['AZURE_AI_ANALYSIS_MODEL_DEPLOYMENT', 'AZURE_AI_MODEL_DEPLOYMENT', 'AZURE_OPENAI_DEPLOYMENT'],
      'configured default',
    ),
    chatModelDeployment: envOr(
      ['AZURE_AI_CHAT_MODEL_DEPLOYMENT', 'AZURE_AI_MODEL_DEPLOYMENT', 'AZURE_OPENAI_DEPLOYMENT'],
      'configured default',
    ),
    apiVersion: envOr(['AZURE_AI_API_VERSION', 'AZURE_OPENAI_API_VERSION'], '2024-10-21'),
    pipelineMode,
    pipelineVersion: ANALYSIS_PIPELINE_VERSION,
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    promptVersions: STAGED_PROMPT_VERSIONS,
    architectureVersion,
    identityModel: 'Azure Managed Identity (DefaultAzureCredential) — no static keys',
    evaluationPosture:
      'Structural evaluation (completeness / safety / referral appropriateness). Not a diagnostic-accuracy certification.',
  };
}
