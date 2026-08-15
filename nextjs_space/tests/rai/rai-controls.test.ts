/**
 * Responsible AI — control register integrity.
 *
 * Guards the single source of truth (`lib/rai/controls.ts`) so the AI Assurance page
 * and documentation cannot drift into inconsistency: unique IDs, valid enums, and
 * evidence for every control.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RAI_CONTROLS,
  ASSURANCE_STAGES,
  controlStatusCounts,
  RAI_PRINCIPLE_LABELS,
  ASSURANCE_LAYER_LABELS,
  CONTROL_STATUS_LABELS,
} from '../../lib/rai/controls';

test('control IDs are unique', () => {
  const ids = RAI_CONTROLS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every control has a known principle, layer, status and evidence', () => {
  for (const c of RAI_CONTROLS) {
    assert.ok(RAI_PRINCIPLE_LABELS[c.principle], `${c.id} principle`);
    assert.ok(ASSURANCE_LAYER_LABELS[c.layer], `${c.id} layer`);
    assert.ok(CONTROL_STATUS_LABELS[c.status], `${c.id} status`);
    assert.ok(c.evidence.length > 0, `${c.id} must cite evidence`);
    assert.ok(c.title.trim().length > 0, `${c.id} title`);
    assert.ok(c.description.trim().length > 0, `${c.id} description`);
  }
});

test('evidence paths look like repo-relative source files', () => {
  for (const c of RAI_CONTROLS) {
    for (const e of c.evidence) {
      assert.match(e, /\.(ts|tsx|prisma|mjs|md)$/, `${c.id} evidence ${e}`);
      assert.ok(!e.startsWith('/'), `${c.id} evidence should be repo-relative: ${e}`);
    }
  }
});

test('status counts sum to the number of controls', () => {
  const counts = controlStatusCounts();
  assert.equal(counts.active + counts.partial + counts.planned, RAI_CONTROLS.length);
  // The register must reflect a real, implemented posture — most controls active.
  assert.ok(counts.active >= counts.partial + counts.planned);
});

test('v2 presentation-dependent controls are partial and not user-visible', () => {
  for (const id of ['RAI-TRANS-003', 'RAI-ACCT-001']) {
    const control = RAI_CONTROLS.find((candidate) => candidate.id === id);
    assert.equal(control?.status, 'partial', id);
    assert.equal(control?.userVisible, false, id);
  }
});

test('the five assurance stages are present and ordered', () => {
  assert.deepEqual(
    ASSURANCE_STAGES.map((s) => s.layer),
    ['input', 'analysis', 'output', 'oversight', 'operations'],
  );
});
