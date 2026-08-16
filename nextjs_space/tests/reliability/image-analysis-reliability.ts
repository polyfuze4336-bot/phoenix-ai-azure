import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { summarizeReliability, type ReliabilityOutcome } from './summary';

const baseUrl = process.env.RELIABILITY_BASE_URL?.trim();
const sequentialRuns = positiveInt(process.env.RELIABILITY_SEQUENTIAL_RUNS, 10, 100);
const concurrentRuns = positiveInt(process.env.RELIABILITY_CONCURRENT_REQUESTS, 0, 20, true);
const timeoutMs = positiveInt(process.env.RELIABILITY_TIMEOUT_MS, 180_000, 300_000);
const targetPct = positiveInt(process.env.RELIABILITY_TARGET_PCT, 95, 100);

if (!baseUrl) {
  console.error('RELIABILITY_BASE_URL is required, for example https://<app-host>.');
  process.exit(2);
}

function positiveInt(raw: string | undefined, fallback: number, maximum: number, allowZero = false): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  const minimum = allowZero ? 0 : 1;
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

async function demoImages(): Promise<Buffer[]> {
  const fixture = process.env.RELIABILITY_DEMO_IMAGE?.trim();
  if (fixture) return [await readFile(fixture)];
  return [0, 1, 2].map((variant) => {
    const png = new PNG({ width: 256, height: 256 });
    for (let y = 0; y < png.height; y += 1) {
      for (let x = 0; x < png.width; x += 1) {
        const offset = (y * png.width + x) * 4;
        const ring = Math.abs(Math.hypot(x - 128, y - 128) - (42 + variant * 16)) < 12;
        png.data[offset] = ring ? 176 : 232;
        png.data[offset + 1] = ring ? 82 + variant * 20 : 224;
        png.data[offset + 2] = ring ? 72 : 210;
        png.data[offset + 3] = 255;
      }
    }
    return PNG.sync.write(png);
  });
}

function hasCompletedResult(body: string): boolean {
  for (const line of body.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const value = line.slice(6).trim();
    if (!value || value === '[DONE]') continue;
    try {
      const parsed = JSON.parse(value);
      if (parsed?.status === 'completed' && parsed?.result) return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function executeRun(index: number, images: Buffer[]): Promise<ReliabilityOutcome> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const image = images[index % images.length];
    const response = await fetch(new URL('/api/analyze-wound', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: image.toString('base64'), mimeType: 'image/png', language: 'en' }),
      signal: controller.signal,
    });
    const body = await response.text();
    const latencyMs = Date.now() - started;
    if (!response.ok) {
      let category = `HTTP_${response.status}`;
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed?.code === 'string') category = parsed.code;
      } catch { /* retain HTTP category */ }
      return { kind: 'failure', latencyMs, category, httpStatus: response.status };
    }
    if (!hasCompletedResult(body)) {
      return { kind: 'parsing_failure', latencyMs, category: 'PARSING_FAILURE', httpStatus: response.status };
    }
    return { kind: 'success', latencyMs, httpStatus: response.status };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return {
      kind: timedOut ? 'timeout' : 'failure',
      latencyMs: Date.now() - started,
      category: timedOut ? 'AI_TIMEOUT' : 'NETWORK_ERROR',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const images = await demoImages();
  const outcomes: ReliabilityOutcome[] = [];
  for (let index = 0; index < sequentialRuns; index += 1) {
    const outcome = await executeRun(index, images);
    outcomes.push(outcome);
    console.log(`Sequential ${index + 1}/${sequentialRuns}: ${outcome.kind} (${outcome.latencyMs} ms)`);
  }
  if (concurrentRuns > 0) {
    const concurrent = await Promise.all(
      Array.from({ length: concurrentRuns }, (_, index) => executeRun(sequentialRuns + index, images)),
    );
    outcomes.push(...concurrent);
    concurrent.forEach((outcome, index) => {
      console.log(`Concurrent ${index + 1}/${concurrentRuns}: ${outcome.kind} (${outcome.latencyMs} ms)`);
    });
  }

  const summary = summarizeReliability(outcomes, targetPct);
  console.log(JSON.stringify({
    scope: 'API reliability only; not clinical accuracy or an SLA',
    conditions: { sequentialRuns, concurrentRuns, timeoutMs, imageSource: process.env.RELIABILITY_DEMO_IMAGE ? 'operator fixture' : 'generated synthetic non-patient PNGs' },
    ...summary,
  }, null, 2));
  if (!summary.targetMet) process.exitCode = 1;
}

void main();