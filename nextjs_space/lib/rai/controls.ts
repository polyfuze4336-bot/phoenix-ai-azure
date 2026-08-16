/**
 * Responsible AI control register — the single source of truth for Phoenix AI's
 * AI assurance controls.
 *
 * Each entry maps an ACTUALLY-IMPLEMENTED (or honestly Partial/Planned) control to:
 *  - one of Microsoft's six Responsible AI principles,
 *  - the assurance layer it belongs to,
 *  - the source file(s) that implement it (evidence),
 *  - the test(s) that cover it (where any exist),
 *  - whether it is visible to the clinician in the product.
 *
 * This register drives the control matrix and RAI documentation. It is deliberately
 * conservative: a control is only marked
 * `active` where code + evidence exist. Capabilities that are curated-but-uncited
 * (guideline grounding) or aspirational are marked `partial` / `planned` and must
 * never be presented as fully implemented.
 *
 * Do NOT add marketing language, trust scores, certifications or regulatory-approval
 * claims here. Descriptions are factual and traceable.
 */

/** Microsoft Responsible AI principles. */
export type RaiPrinciple =
  | 'fairness'
  | 'reliabilitySafety'
  | 'privacySecurity'
  | 'inclusiveness'
  | 'transparency'
  | 'accountability';

/** Assurance layer in the end-to-end analysis flow. */
export type AssuranceLayer = 'input' | 'analysis' | 'output' | 'oversight' | 'operations';

/** Honest implementation status. */
export type ControlStatus = 'active' | 'partial' | 'planned';

export interface RaiControl {
  /** Stable identifier — never renamed. */
  id: string;
  title: string;
  principle: RaiPrinciple;
  layer: AssuranceLayer;
  status: ControlStatus;
  /** Factual, traceable description of what the control does. */
  description: string;
  /** Source file paths implementing the control (evidence). */
  evidence: string[];
  /** Test file(s) covering the control, where any exist. */
  tests?: string[];
  /** Whether the control is visible to the clinician in the product UI. */
  userVisible: boolean;
}

export const RAI_PRINCIPLE_LABELS: Record<RaiPrinciple, string> = {
  fairness: 'Fairness',
  reliabilitySafety: 'Reliability & Safety',
  privacySecurity: 'Privacy & Security',
  inclusiveness: 'Inclusiveness',
  transparency: 'Transparency',
  accountability: 'Accountability',
};

export const ASSURANCE_LAYER_LABELS: Record<AssuranceLayer, string> = {
  input: 'Input Assurance',
  analysis: 'Analysis Assurance',
  output: 'Output Validation',
  oversight: 'Clinical Oversight',
  operations: 'Audit & Operations',
};

export const CONTROL_STATUS_LABELS: Record<ControlStatus, string> = {
  active: 'Active',
  partial: 'Partial',
  planned: 'Planned',
};

/** The register. Ordered by assurance layer, then principle. */
export const RAI_CONTROLS: RaiControl[] = [
  // ---------------------------------------------------------------- Input
  {
    id: 'RAI-SAFE-001',
    title: 'Image input validation',
    principle: 'reliabilitySafety',
    layer: 'input',
    status: 'active',
    description:
      'Uploaded JPEG, PNG, WebP, and GIF images are normalized and validated for MIME type, base64 syntax, content signature, decoded dimensions and integrity, and size before any model call; malformed, truncated, mismatched, oversized, empty, or unsupported payloads receive a categorized user-visible error.',
    evidence: ['lib/ai/validation/image-input.ts', 'app/api/analyze-wound/route.ts', 'app/api/community-analyze/route.ts'],
    tests: ['tests/unit/image-input.test.ts', 'tests/api/routes.spec.ts', 'tests/rai/rai-safety.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-SAFE-002',
    title: 'Image-quality gating',
    principle: 'reliabilitySafety',
    layer: 'input',
    status: 'active',
    description:
      'The first pipeline stage assesses image adequacy (focus, lighting, framing, scale reference) and records issues; downstream confidence is capped when quality is poor.',
    evidence: [
      'lib/ai/prompts/wound-visual-observation.ts',
      'lib/ai/analysis/pipeline.ts',
    ],
    tests: ['tests/unit/analysis-pipeline.test.ts', 'tests/rai/rai-safety.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-PRIV-006',
    title: 'Request size limits',
    principle: 'privacySecurity',
    layer: 'input',
    status: 'active',
    description:
      'Request bodies are size-checked (configurable via AZURE_AI_MAX_IMAGE_MB) to bound resource use and reject malformed payloads.',
    evidence: ['lib/ai/validation/image-input.ts'],
    tests: ['tests/unit/image-input.test.ts'],
    userVisible: false,
  },

  // ---------------------------------------------------------------- Analysis
  {
    id: 'RAI-SAFE-004',
    title: 'Observation vs interpretation separation',
    principle: 'transparency',
    layer: 'analysis',
    status: 'active',
    description:
      'The schema separates what is visible (observation) from what it may mean (interpretation), with a per-field evidence basis, so clinicians can see the reasoning chain.',
    evidence: [
      'lib/ai/schemas/burn-wound-analysis.ts',
      'app/hcp/analysis/_components/structured-analysis.tsx',
    ],
    tests: ['tests/unit/wound-schema.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-FAIR-001',
    title: 'Skin tone described, not inferred',
    principle: 'fairness',
    layer: 'analysis',
    status: 'active',
    description:
      'The model may describe observed skin tone but must not assign a Fitzpatrick type from a photograph; Fitzpatrick is forced to "unknown" unless a clinician supplies it.',
    evidence: [
      'lib/ai/prompts/wound-clinical-interpretation.ts',
      'lib/ai/analysis/pipeline.ts',
    ],
    tests: ['tests/rai/rai-unsupported-inference.test.ts', 'tests/unit/analysis-pipeline.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-FAIR-002',
    title: 'No demographic inference from image',
    principle: 'fairness',
    layer: 'analysis',
    status: 'active',
    description:
      'Prompts instruct the model not to infer ethnicity, race, age or pain/sensation from an image; the assurance tests assert these are not asserted as findings.',
    evidence: [
      'lib/ai/prompts/wound-visual-observation.ts',
      'lib/ai/prompts/wound-clinical-interpretation.ts',
    ],
    tests: ['tests/rai/rai-unsupported-inference.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-SAFE-006',
    title: 'Deterministic, weight-gated Parkland',
    principle: 'reliabilitySafety',
    layer: 'analysis',
    status: 'active',
    description:
      'Fluid resuscitation volumes are computed deterministically and only when a weight is supplied; the pipeline never invents a body weight.',
    evidence: ['lib/clinical/parkland.ts', 'lib/ai/analysis/pipeline.ts'],
    tests: ['tests/unit/parkland.test.ts', 'tests/rai/rai-safety.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-SAFE-011',
    title: 'Deterministic TBSA (Lund & Browder)',
    principle: 'reliabilitySafety',
    layer: 'analysis',
    status: 'active',
    description:
      'Total body surface area is computed with an age-adjusted Lund & Browder chart rather than free-form model estimation when regional inputs are provided.',
    evidence: ['lib/clinical/tbsa.ts'],
    tests: ['tests/unit/tbsa.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-SAFE-007',
    title: 'No fabricated measurements',
    principle: 'reliabilitySafety',
    layer: 'analysis',
    status: 'active',
    description:
      'Numeric wound dimensions are stripped unless a scale reference is present in the image, preventing false precision from an uncalibrated photo.',
    evidence: ['lib/ai/analysis/pipeline.ts'],
    tests: ['tests/rai/rai-safety.test.ts', 'tests/unit/analysis-pipeline.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-TRANS-005',
    title: 'Guideline basis disclosure',
    principle: 'transparency',
    layer: 'analysis',
    status: 'partial',
    description:
      'Guidance draws on widely-accepted clinical references, but these are curated general knowledge and are NOT yet version-pinned citations. This is disclosed rather than presented as a validated evidence base.',
    evidence: ['app/hcp/guidelines/_components/guidelines-client.tsx', 'lib/ai/prompts/wound-management.ts'],
    userVisible: true,
  },

  // ---------------------------------------------------------------- Output
  {
    id: 'RAI-SAFE-003',
    title: 'Schema-validated structured output',
    principle: 'reliabilitySafety',
    layer: 'output',
    status: 'active',
    description:
      'Model output is extracted and validated against a Zod schema. Fenced or commentary-wrapped JSON is accepted and malformed structured output receives one bounded repair attempt. Core observation or interpretation failure stops the analysis; non-core management or critic failure is marked unavailable without fabricating clinical information.',
    evidence: [
      'lib/ai/validation/wound-analysis-schema.ts',
      'lib/ai/schemas/burn-wound-analysis.ts',
    ],
    tests: ['tests/unit/wound-schema.test.ts', 'tests/unit/ai-parsing.test.ts'],
    userVisible: false,
  },
  {
    id: 'RAI-SAFE-005',
    title: 'Automated consistency review',
    principle: 'reliabilitySafety',
    layer: 'output',
    status: 'active',
    description:
      'A final pipeline stage audits the draft for contradictions, unsupported claims, false precision and management inconsistent with severity, surfacing issues to the clinician.',
    evidence: ['lib/ai/prompts/wound-analysis-critic.ts', 'lib/ai/analysis/pipeline.ts'],
    tests: ['tests/unit/analysis-pipeline.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-SAFE-008',
    title: 'Special-site referral escalation',
    principle: 'reliabilitySafety',
    layer: 'output',
    status: 'active',
    description:
      'Burns to high-risk sites (face, hands, feet, perineum, major joints, circumferential) never leave the pipeline on a routine referral pathway.',
    evidence: ['lib/ai/analysis/pipeline.ts'],
    tests: ['tests/unit/analysis-pipeline.test.ts', 'tests/rai/rai-safety.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-SAFE-009',
    title: 'Confidence capping on poor images',
    principle: 'reliabilitySafety',
    layer: 'output',
    status: 'active',
    description:
      'Reported confidence cannot exceed a ceiling determined by assessed image quality, so a poor photo cannot yield high-confidence conclusions.',
    evidence: ['lib/ai/analysis/pipeline.ts'],
    tests: ['tests/rai/rai-safety.test.ts', 'tests/unit/analysis-pipeline.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-SAFE-010',
    title: 'Explicit safe-failure state',
    principle: 'reliabilitySafety',
    layer: 'output',
    status: 'active',
    description:
      'On model or validation failure the app returns a labelled unavailable state or actionable input error that preserves the medical disclaimer instead of guessing a clinical result.',
    evidence: ['lib/ai/validation/wound-analysis-schema.ts', 'app/hcp/analysis/_components/analysis-client.tsx', 'app/community/image-check/_components/image-check-client.tsx'],
    tests: ['tests/unit/ai-parsing.test.ts', 'tests/api/routes.spec.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-TRANS-001',
    title: 'Field-level confidence reporting',
    principle: 'transparency',
    layer: 'output',
    status: 'active',
    description:
      'Each interpreted field carries a confidence level (high/moderate/low/insufficient); these reflect model self-report plus image gating, not validated diagnostic accuracy.',
    evidence: [
      'lib/ai/schemas/burn-wound-analysis.ts',
      'app/hcp/analysis/_components/structured-analysis.tsx',
    ],
    tests: ['tests/unit/wound-schema.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-TRANS-002',
    title: 'Limitations & missing-information disclosure',
    principle: 'transparency',
    layer: 'output',
    status: 'active',
    description:
      'Every assessment lists what could not be determined, what information is missing, and recommended follow-up questions.',
    evidence: [
      'lib/ai/analysis/pipeline.ts',
      'app/hcp/analysis/_components/structured-analysis.tsx',
    ],
    tests: ['tests/rai/rai-safety.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-TRANS-003',
    title: 'AI-generated labelling + analysis metadata',
    principle: 'transparency',
    layer: 'output',
    status: 'partial',
    description:
      'The API generates an analysis metadata envelope, but the retained clinical interface does not yet present the complete envelope to users.',
    evidence: [
      'lib/ai/analysis/metadata.ts',
      'app/api/analyze-wound/route.ts',
    ],
    tests: ['tests/rai/rai-metadata.test.ts'],
    userVisible: false,
  },
  {
    id: 'RAI-TRANS-004',
    title: 'Prompt / pipeline / schema versioning',
    principle: 'accountability',
    layer: 'output',
    status: 'active',
    description:
      'The staged prompts, pipeline and output schema are version-stamped and recorded with each analysis for traceability.',
    evidence: ['lib/ai/prompts/versions.ts', 'lib/ai/analysis/metadata.ts'],
    tests: ['tests/rai/rai-metadata.test.ts'],
    userVisible: true,
  },

  // ---------------------------------------------------------------- Oversight
  {
    id: 'RAI-ACCT-001',
    title: 'Human-in-the-loop review',
    principle: 'accountability',
    layer: 'oversight',
    status: 'partial',
    description:
      'Assessments start as "Clinical review pending", but the retained clinical interface does not yet provide persisted review actions.',
    evidence: [
      'lib/ai/analysis/metadata.ts',
      'app/hcp/analysis/_components/structured-analysis.tsx',
    ],
    tests: ['tests/rai/rai-metadata.test.ts'],
    userVisible: false,
  },
  {
    id: 'RAI-SAFE-012',
    title: 'Clinician refinement loop',
    principle: 'reliabilitySafety',
    layer: 'oversight',
    status: 'active',
    description:
      'Clinicians can answer the model\'s follow-up questions to refine an assessment without re-uploading, tightening the analysis with human-supplied context.',
    evidence: [
      'app/api/analyze-wound/route.ts',
      'app/hcp/analysis/_components/structured-analysis.tsx',
    ],
    userVisible: true,
  },
  {
    id: 'RAI-ACCT-002',
    title: 'Analysis persistence / audit record',
    principle: 'accountability',
    layer: 'oversight',
    status: 'active',
    description:
      'Assessments can be persisted with their result, image reference and timestamp, providing an auditable record of AI-assisted decisions.',
    evidence: ['lib/analysis/history.ts', 'prisma/schema.prisma'],
    tests: ['tests/unit/db-mappings.test.ts'],
    userVisible: true,
  },

  // ---------------------------------------------------------------- Operations
  {
    id: 'RAI-PRIV-001',
    title: 'Managed-identity access (no static secrets)',
    principle: 'privacySecurity',
    layer: 'operations',
    status: 'active',
    description:
      'The app authenticates to Azure AI and Storage using a managed identity via DefaultAzureCredential; no model or storage keys are stored in the app.',
    evidence: ['lib/ai/azure-credential.ts', 'lib/ai/azure-foundry-provider.ts'],
    userVisible: false,
  },
  {
    id: 'RAI-PRIV-002',
    title: 'Server-side model calls',
    principle: 'privacySecurity',
    layer: 'operations',
    status: 'active',
    description:
      'Images are sent to the model only from server-side API routes; the browser never calls the model provider directly.',
    evidence: ['app/api/analyze-wound/route.ts', 'app/api/community-analyze/route.ts'],
    userVisible: false,
  },
  {
    id: 'RAI-PRIV-003',
    title: 'Privacy-safe telemetry',
    principle: 'privacySecurity',
    layer: 'operations',
    status: 'active',
    description:
      'Telemetry records counts, latencies and metadata only. A blocked-key list prevents image bytes, prompts, transcripts, tokens and secrets from ever being logged.',
    evidence: [
      'lib/telemetry/server.ts',
      'lib/telemetry/client.ts',
      'lib/ai/telemetry.ts',
    ],
    tests: ['tests/rai/rai-telemetry.test.ts'],
    userVisible: false,
  },
  {
    id: 'RAI-PRIV-007',
    title: 'Patient-data legal handling notice',
    principle: 'privacySecurity',
    layer: 'operations',
    status: 'active',
    description:
      'HCP interaction surfaces display compact bilingual confidentiality and Malaysian personal-data reminders, including that this demo must not receive real identifiable patient data unless explicitly authorized. The wording is a handling obligation, not legal advice or a compliance-certification claim.',
    evidence: [
      'components/clinical-ai-notice.tsx',
      'app/hcp/analysis/_components/analysis-client.tsx',
      'app/hcp/chat/_components/hcp-chat-client.tsx',
    ],
    tests: ['tests/rai/rai-controls.test.ts', 'tests/e2e/bilingual-language.spec.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-ACCT-005',
    title: 'Configurable model governance',
    principle: 'accountability',
    layer: 'operations',
    status: 'active',
    description:
      'The analysis model deployment is configuration, not hard-coded, so it can be governed, swapped and version-tracked independently of the code.',
    evidence: ['lib/ai/model-config.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-ACCT-003',
    title: 'Architecture governance (docs-first)',
    principle: 'accountability',
    layer: 'operations',
    status: 'active',
    description:
      'A mandatory architecture-first change policy and local drift validator keep architecture documentation synchronized before direct-main pushes. GitHub does not server-enforce this control in the rapid-prototype workflow.',
    evidence: [
      'docs/architecture/current-architecture.md',
      'nextjs_space/scripts/validate-architecture.mjs',
    ],
    userVisible: false,
  },
  {
    id: 'RAI-ACCT-004',
    title: 'Structural evaluation harness',
    principle: 'reliabilitySafety',
    layer: 'operations',
    status: 'active',
    description:
      'A repeatable harness scores structured behaviour (completeness, safety, referral appropriateness). It is explicitly NOT a diagnostic-accuracy certification, which would require clinician ground truth.',
    evidence: ['tests/evaluation/burn-wound/evaluate.ts', 'tests/evaluation/burn-wound/README.md'],
    userVisible: true,
  },
  {
    id: 'RAI-INCL-001',
    title: 'Bilingual application experience',
    principle: 'inclusiveness',
    layer: 'operations',
    status: 'active',
    description:
      'A root-scoped, immediately reactive language state supports English and Bahasa Malaysia across the retained healthcare-professional and community experiences and persists the user choice locally.',
    evidence: ['lib/i18n.ts', 'components/language-provider.tsx', 'components/language-toggle.tsx'],
    tests: ['tests/unit/language.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-INCL-003',
    title: 'AI output language consistency',
    principle: 'inclusiveness',
    layer: 'output',
    status: 'active',
    description:
      'Every AI route requires the selected language, applies a strict non-mixing instruction, checks completed output, and makes at most one language-only rewrite when a confident mismatch is detected.',
    evidence: [
      'lib/ai/language.ts',
      'lib/ai/analysis/pipeline.ts',
      'app/api/analyze-wound/route.ts',
      'app/api/hcp-chat/route.ts',
      'app/api/community-chat/route.ts',
      'app/api/community-analyze/route.ts',
    ],
    tests: ['tests/unit/ai-language.test.ts', 'tests/rai/rai-controls.test.ts'],
    userVisible: true,
  },
  {
    id: 'RAI-INCL-002',
    title: 'Responsive, installable access',
    principle: 'inclusiveness',
    layer: 'operations',
    status: 'partial',
    description:
      'The app is responsive and installable (PWA). A formal accessibility (WCAG) audit is not yet complete, so this is reported as partial.',
    evidence: ['components/pwa-provider.tsx', 'lib/i18n.ts'],
    userVisible: false,
  },
  {
    id: 'RAI-REL-001',
    title: 'Bounded stage execution',
    principle: 'reliabilitySafety',
    layer: 'operations',
    status: 'active',
    description:
      'Each pipeline stage uses configurable AI_ANALYSIS_TIMEOUT_MS with a bounded default and at most three attempts for explicitly retryable status or network failures, so stalled or transient calls fail safely without unlimited retry.',
    evidence: ['lib/ai/analysis/pipeline.ts'],
    userVisible: false,
  },
];

/** Convenience lookups. */
export function controlsByLayer(layer: AssuranceLayer): RaiControl[] {
  return RAI_CONTROLS.filter((c) => c.layer === layer);
}

export function controlsByPrinciple(principle: RaiPrinciple): RaiControl[] {
  return RAI_CONTROLS.filter((c) => c.principle === principle);
}

export function controlStatusCounts(): Record<ControlStatus, number> {
  return RAI_CONTROLS.reduce(
    (acc, c) => {
      acc[c.status] += 1;
      return acc;
    },
    { active: 0, partial: 0, planned: 0 } as Record<ControlStatus, number>,
  );
}

/** The five assurance stages, in flow order, used by the AI Assurance overview. */
export interface AssuranceStage {
  layer: AssuranceLayer;
  title: string;
  summary: string;
}

export const ASSURANCE_STAGES: AssuranceStage[] = [
  {
    layer: 'input',
    title: 'Input Assurance',
    summary: 'Validate the image and assess its quality before any interpretation.',
  },
  {
    layer: 'analysis',
    title: 'Analysis Assurance',
    summary: 'Separate observation from interpretation with evidence and field-level confidence.',
  },
  {
    layer: 'output',
    title: 'Output Validation',
    summary: 'Schema-validate, run a consistency review, and disclose limitations.',
  },
  {
    layer: 'oversight',
    title: 'Clinical Oversight',
    summary: 'Every assessment is clinician-reviewed; AI is decision-support only.',
  },
  {
    layer: 'operations',
    title: 'Audit & Operations',
    summary: 'Managed identity, privacy-safe telemetry, versioning and evaluation.',
  },
];
