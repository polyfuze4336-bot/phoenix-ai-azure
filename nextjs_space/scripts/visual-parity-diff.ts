/**
 * Step 22 — Strict visual parity diff.
 *
 * Compares the freshly re-captured screenshots of the migrated app
 * (`tests/visual/current/`) against the committed source baseline
 * (`tests/visual/baseline/`) captured earlier in the migration.
 *
 * For every baseline image it:
 *   1. loads the baseline + the matching current PNG,
 *   2. runs a pixel diff (pixelmatch, anti-alias aware),
 *   3. writes a difference image to `tests/visual/diff/<same path>`,
 *   4. records the difference percentage and a pass/fail verdict.
 *
 * A JSON summary is written to `tests/visual/parity-results.json` for the
 * report generator. This script NEVER mutates the app or the baseline.
 *
 * Usage:  tsx scripts/visual-parity-diff.ts
 */
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const BASELINE_DIR = path.join(ROOT, 'tests/visual/baseline');
const CURRENT_DIR = path.join(ROOT, 'tests/visual/current');
const DIFF_DIR = path.join(ROOT, 'tests/visual/diff');
const RESULT_JSON = path.join(ROOT, 'tests/visual/parity-results.json');

/** Pass threshold: a state passes when the changed-pixel ratio is at or below this %. */
const PASS_THRESHOLD_PCT = 0.5;
/** Per-pixel colour distance tolerance (0..1). 0.1 ignores sub-perceptual AA noise. */
const PIXELMATCH_THRESHOLD = 0.1;

const VIEWPORTS = ['desktop-1440', 'desktop-1280', 'tablet-768', 'mobile-390'];

interface Row {
  folder: string;
  file: string;
  route: string;
  viewport: string;
  lang: string;
  state: string;
  baselineW: number;
  baselineH: number;
  currentW: number;
  currentH: number;
  diffPct: number;
  diffPixels: number;
  totalPixels: number;
  dimensionMismatch: boolean;
  missingCurrent: boolean;
  pass: boolean;
}

function walkPng(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkPng(p));
    else if (entry.name.endsWith('.png')) out.push(p);
  }
  return out;
}

/** folder name (route slug) → user-facing route path. */
function folderToRoute(folder: string): string {
  if (folder === 'landing') return '/';
  return '/' + folder.replace(/-/g, '/').replace(/^(hcp|community)\/(.*)$/, '$1/$2');
}

/** Parse `<viewport>-<lang>-<state>.png` where viewport itself has one hyphen. */
function parseName(file: string): { viewport: string; lang: string; state: string } {
  const base = file.replace(/\.png$/, '');
  const vp = VIEWPORTS.find((v) => base.startsWith(v + '-')) ?? 'unknown';
  const rest = base.slice(vp.length + 1); // e.g. "en-initial" or "bm-completed-result"
  const dash = rest.indexOf('-');
  const lang = dash === -1 ? rest : rest.slice(0, dash);
  const state = dash === -1 ? '' : rest.slice(dash + 1);
  return { viewport: vp, lang, state };
}

function ensureDir(p: string): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function main(): void {
  const baselineFiles = walkPng(BASELINE_DIR).sort();
  if (baselineFiles.length === 0) {
    console.error(`No baseline PNGs found under ${BASELINE_DIR}`);
    process.exit(1);
  }
  fs.rmSync(DIFF_DIR, { recursive: true, force: true });

  const rows: Row[] = [];

  for (const baselinePath of baselineFiles) {
    const rel = path.relative(BASELINE_DIR, baselinePath).replace(/\\/g, '/');
    const folder = rel.split('/')[0];
    const file = path.basename(rel);
    const currentPath = path.join(CURRENT_DIR, rel);
    const diffPath = path.join(DIFF_DIR, rel);
    const { viewport, lang, state } = parseName(file);
    const route = folderToRoute(folder);

    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));

    if (!fs.existsSync(currentPath)) {
      rows.push({
        folder, file, route, viewport, lang, state,
        baselineW: baseline.width, baselineH: baseline.height,
        currentW: 0, currentH: 0,
        diffPct: 100, diffPixels: baseline.width * baseline.height,
        totalPixels: baseline.width * baseline.height,
        dimensionMismatch: false, missingCurrent: true, pass: false,
      });
      continue;
    }

    const current = PNG.sync.read(fs.readFileSync(currentPath));
    const dimensionMismatch = baseline.width !== current.width || baseline.height !== current.height;

    // Compare over the overlapping region; count non-overlapping area as changed.
    const w = Math.min(baseline.width, current.width);
    const h = Math.min(baseline.height, current.height);
    const maxW = Math.max(baseline.width, current.width);
    const maxH = Math.max(baseline.height, current.height);
    const totalPixels = maxW * maxH;

    const diff = new PNG({ width: w, height: h });
    // Crop both to the shared region so pixelmatch gets equal dimensions.
    const baseCrop = cropRGBA(baseline, w, h);
    const curCrop = cropRGBA(current, w, h);
    const changedInOverlap = pixelmatch(baseCrop, curCrop, diff.data, w, h, {
      threshold: PIXELMATCH_THRESHOLD,
      includeAA: false,
      diffMask: true,
    });
    const nonOverlap = totalPixels - w * h;
    const diffPixels = changedInOverlap + nonOverlap;
    const diffPct = (diffPixels / totalPixels) * 100;

    ensureDir(diffPath);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    rows.push({
      folder, file, route, viewport, lang, state,
      baselineW: baseline.width, baselineH: baseline.height,
      currentW: current.width, currentH: current.height,
      diffPct: Number(diffPct.toFixed(4)),
      diffPixels, totalPixels,
      dimensionMismatch,
      missingCurrent: false,
      pass: diffPct <= PASS_THRESHOLD_PCT,
    });
  }

  const passed = rows.filter((r) => r.pass).length;
  const summary = {
    generatedAt: new Date().toISOString(),
    passThresholdPct: PASS_THRESHOLD_PCT,
    pixelmatchThreshold: PIXELMATCH_THRESHOLD,
    total: rows.length,
    passed,
    failed: rows.length - passed,
    maxDiffPct: rows.reduce((m, r) => Math.max(m, r.diffPct), 0),
    rows,
  };
  ensureDir(RESULT_JSON);
  fs.writeFileSync(RESULT_JSON, JSON.stringify(summary, null, 2));

  console.log(`Visual parity: ${passed}/${rows.length} passed (threshold ${PASS_THRESHOLD_PCT}%).`);
  console.log(`Max difference: ${summary.maxDiffPct.toFixed(4)}%`);
  for (const r of rows.filter((x) => !x.pass)) {
    console.log(`  FAIL ${r.folder}/${r.file} — ${r.diffPct}%${r.missingCurrent ? ' (missing current)' : ''}${r.dimensionMismatch ? ' (dimension mismatch)' : ''}`);
  }
  console.log(`Results: ${path.relative(ROOT, RESULT_JSON)}`);
}

/** Return an RGBA buffer cropped to the top-left w×h region of a PNG. */
function cropRGBA(png: PNG, w: number, h: number): Buffer {
  if (png.width === w && png.height === h) return png.data;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const srcStart = y * png.width * 4;
    png.data.copy(out, y * w * 4, srcStart, srcStart + w * 4);
  }
  return out;
}

main();
