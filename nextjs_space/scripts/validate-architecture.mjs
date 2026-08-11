#!/usr/bin/env node
// Phoenix AI — lightweight architecture drift check.
//
// Confirms that the implementation and the architecture documentation agree on a few
// load-bearing facts. This is intentionally simple: it does NOT parse code, it checks
// that when a capability EXISTS in the codebase, the docs mention it (and vice-versa for
// the Azure resource map vs Bicep modules).
//
// Run from anywhere:  node nextjs_space/scripts/validate-architecture.mjs
// Exits non-zero on drift so CI can fail the pull request.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// scripts/ -> nextjs_space/ -> repo root
const repoRoot = resolve(__dirname, '..', '..');
const nextRoot = join(repoRoot, 'nextjs_space');
const archDir = join(repoRoot, 'docs', 'architecture');

const problems = [];
const notes = [];

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

function requireFile(path, label) {
  if (!existsSync(path)) {
    problems.push(`Missing required architecture file: ${label} (${path})`);
    return null;
  }
  return read(path);
}

// --- 1. Required governance artifacts exist -------------------------------------------------
const currentArch = requireFile(join(archDir, 'current-architecture.md'), 'current-architecture.md');
const componentInv = requireFile(join(archDir, 'component-inventory.md'), 'component-inventory.md');
const integrationInv = requireFile(join(archDir, 'integration-inventory.md'), 'integration-inventory.md');
const resourceMap = requireFile(join(archDir, 'azure-resource-map.md'), 'azure-resource-map.md');
requireFile(join(archDir, 'ARCHITECTURE_VERSION'), 'ARCHITECTURE_VERSION');
requireFile(join(archDir, 'ARCHITECTURE_CHANGELOG.md'), 'ARCHITECTURE_CHANGELOG.md');

const requiredDiagrams = [
  'current-architecture.mmd',
  'current-data-flow.mmd',
  'current-deployment.mmd',
  'current-ai-architecture.mmd',
];
for (const d of requiredDiagrams) {
  requireFile(join(archDir, 'diagrams', d), `diagrams/${d}`);
}

const docsBlob = [currentArch, componentInv, integrationInv, resourceMap]
  .filter(Boolean)
  .join('\n')
  .toLowerCase();

// --- 2. Capability presence <-> documentation ----------------------------------------------
function existsAny(candidates) {
  return candidates.some((c) => existsSync(join(nextRoot, c)));
}

const capabilityRules = [
  {
    label: 'Azure Blob storage provider',
    present: existsAny(['lib/storage/azure-blob-provider.ts', 'lib/storage/azure-blob-provider.tsx']),
    docKeywords: ['azure blob', 'blob storage'],
  },
  {
    label: 'Azure AI / Foundry provider',
    present: existsAny(['lib/ai/azure-foundry-provider.ts']),
    docKeywords: ['foundry', 'azure openai'],
  },
  {
    label: 'Prisma data access',
    present: existsAny(['prisma/schema.prisma']) && existsAny(['lib/db.ts']),
    docKeywords: ['prisma'],
  },
  {
    label: 'Demo authentication',
    present: existsAny(['lib/auth/demo-provider.ts']),
    docKeywords: ['demo'],
  },
  {
    label: 'Entra ID authentication',
    present: existsAny(['lib/auth/entra-provider.ts', 'lib/auth/entra-flow.ts']),
    docKeywords: ['entra'],
  },
];

for (const rule of capabilityRules) {
  if (!rule.present) {
    notes.push(`Capability not present in code (skipped): ${rule.label}`);
    continue;
  }
  const mentioned = rule.docKeywords.some((k) => docsBlob.includes(k));
  if (!mentioned) {
    problems.push(
      `Code contains "${rule.label}" but architecture docs do not mention it ` +
        `(expected one of: ${rule.docKeywords.join(', ')}).`,
    );
  }
}

// --- 3. Bicep modules <-> azure-resource-map ------------------------------------------------
const infraModulesDir = join(repoRoot, 'infra', 'modules');
if (existsSync(infraModulesDir) && resourceMap) {
  const resourceMapLower = resourceMap.toLowerCase();
  const modules = readdirSync(infraModulesDir).filter((f) => f.endsWith('.bicep'));
  for (const m of modules) {
    const base = m.replace(/\.bicep$/, '');
    if (!resourceMapLower.includes(base)) {
      problems.push(
        `Bicep module "infra/modules/${m}" is not referenced in azure-resource-map.md.`,
      );
    }
  }
} else if (!existsSync(infraModulesDir)) {
  notes.push('No infra/modules directory found (skipped Bicep <-> resource-map check).');
}

// --- Report ---------------------------------------------------------------------------------
for (const n of notes) console.log(`note: ${n}`);

if (problems.length > 0) {
  console.error('\nArchitecture drift detected:');
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    '\nUpdate docs/architecture/** to match the implementation (see the architecture-first ' +
      'change policy in .github/copilot-instructions.md).',
  );
  process.exit(1);
}

console.log('\nArchitecture drift check passed: code and documentation agree.');
