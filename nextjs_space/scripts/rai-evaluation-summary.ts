/**
 * rai-evaluation-summary — assembles a factual, non-sensitive Responsible AI
 * summary from the in-code control register, the governance snapshot and the
 * latest evaluation run (if present).
 *
 * Intended to be published as a CI artifact. Outputs rai-evaluation-summary.json
 * and rai-evaluation-summary.md next to this script. Those outputs are transient
 * and git-ignored — do NOT commit them.
 *
 * Run: npm run rai:summary
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RAI_CONTROLS,
  CONTROL_STATUS_LABELS,
  RAI_PRINCIPLE_LABELS,
  controlStatusCounts,
  type RaiPrinciple,
} from '../lib/rai/controls';
import { getGovernanceSnapshot } from '../lib/rai/governance';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

function readArchitectureVersion(): string {
  const p = join(ROOT, '..', 'docs', 'architecture', 'ARCHITECTURE_VERSION');
  try {
    return readFileSync(p, 'utf8').trim();
  } catch {
    return 'unknown';
  }
}

function readLastEvalRun(): unknown | null {
  const p = join(ROOT, 'tests', 'evaluation', 'burn-wound', 'last-run.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

const statusCounts = controlStatusCounts();
const governance = getGovernanceSnapshot(readArchitectureVersion());
const lastEval = readLastEvalRun();

const byPrinciple = (Object.keys(RAI_PRINCIPLE_LABELS) as RaiPrinciple[]).map((principle) => {
  const controls = RAI_CONTROLS.filter((c) => c.principle === principle);
  return {
    principle,
    label: RAI_PRINCIPLE_LABELS[principle],
    total: controls.length,
    active: controls.filter((c) => c.status === 'active').length,
    partial: controls.filter((c) => c.status === 'partial').length,
    planned: controls.filter((c) => c.status === 'planned').length,
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  architectureVersion: governance.architectureVersion,
  appVersion: governance.appVersion,
  totalControls: RAI_CONTROLS.length,
  statusCounts,
  byPrinciple,
  governance,
  evaluation: lastEval
    ? { present: true, run: lastEval }
    : {
        present: false,
        note: 'No evaluation run found. Run `npm run eval:analysis` to produce last-run.json.',
      },
  disclaimer:
    'Controls are graded Active / Partial / Planned from code + tests. This summary makes no claim ' +
    'of certification, regulatory approval or diagnostic accuracy. AI output is decision-support only.',
};

writeFileSync(join(HERE, 'rai-evaluation-summary.json'), JSON.stringify(summary, null, 2));

const md = [
  '# Responsible AI evaluation summary',
  '',
  `_Generated ${summary.generatedAt}_`,
  '',
  `- Architecture version: **${summary.architectureVersion}**`,
  `- App version: **${summary.appVersion}**`,
  `- Total controls: **${summary.totalControls}** ` +
    `(Active ${statusCounts.active} · Partial ${statusCounts.partial} · Planned ${statusCounts.planned})`,
  '',
  '## Controls by principle',
  '',
  '| Principle | Total | Active | Partial | Planned |',
  '| --- | --- | --- | --- | --- |',
  ...byPrinciple.map(
    (p) => `| ${p.label} | ${p.total} | ${p.active} | ${p.partial} | ${p.planned} |`,
  ),
  '',
  '## Governance',
  '',
  `- Analysis model deployment: \`${governance.analysisModelDeployment}\``,
  `- Chat model deployment: \`${governance.chatModelDeployment}\``,
  `- API version: \`${governance.apiVersion}\``,
  `- Pipeline: \`${governance.pipelineMode}\` (v${governance.pipelineVersion}), schema v${governance.schemaVersion}`,
  `- Identity: ${governance.identityModel}`,
  `- Evaluation posture: ${governance.evaluationPosture}`,
  '',
  '## Evaluation run',
  '',
  summary.evaluation.present
    ? '```json\n' + JSON.stringify(summary.evaluation.run, null, 2) + '\n```'
    : `_${(summary.evaluation as { note: string }).note}_`,
  '',
  `> ${summary.disclaimer}`,
  '',
].join('\n');

writeFileSync(join(HERE, 'rai-evaluation-summary.md'), md);

console.log(
  `RAI summary written: ${RAI_CONTROLS.length} controls ` +
    `(Active ${statusCounts.active}, Partial ${statusCounts.partial}, Planned ${statusCounts.planned}). ` +
    `Evaluation run ${summary.evaluation.present ? 'included' : 'not found'}.`,
);
