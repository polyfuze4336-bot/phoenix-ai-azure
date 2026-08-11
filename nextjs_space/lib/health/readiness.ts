/**
 * Readiness aggregation for the /api/health/ready probe.
 *
 * Verifies ONLY the essential dependencies the app needs to serve traffic:
 *   1. Application runtime  — always reported (the handler is executing).
 *   2. Azure AI endpoint    — CONFIGURATION only. It never calls the model, so a
 *                             readiness probe cannot burn tokens or add latency/cost.
 *   3. PostgreSQL           — only when enabled (DATABASE_URL set); a lightweight
 *                             `SELECT 1` confirms reachability.
 *   4. Blob Storage         — only when enabled; configuration is verified without a
 *                             network round-trip (no workflow depends on it at runtime).
 *
 * A check is `ok` (healthy), `skipped` (subsystem disabled) or `degraded` (enabled but
 * not usable). The probe is ready when no essential check is degraded.
 *
 * SERVER-ONLY, Node runtime.
 */

import { checkDatabaseReady } from '@/lib/db';
import { getAiConfig, getDatabaseConfig, getStorageConfig } from '@/lib/config/environment';

export type CheckStatus = 'ok' | 'degraded' | 'skipped';

export interface ReadinessCheck {
  name: string;
  status: CheckStatus;
  detail?: string;
  latencyMs?: number;
}

export interface Readiness {
  ok: boolean;
  status: 'ready' | 'not_ready';
  checks: ReadinessCheck[];
  time: string;
}

export async function getReadiness(): Promise<Readiness> {
  const checks: ReadinessCheck[] = [];

  // 1. Application runtime — if this code runs, the Node server is serving requests.
  checks.push({ name: 'runtime', status: 'ok' });

  // 2. Azure AI endpoint configuration — presence only, never a model call.
  const ai = getAiConfig();
  checks.push({
    name: 'azure-ai',
    status: ai.configured ? 'ok' : 'degraded',
    detail: ai.configured
      ? `auth=${ai.authMode}`
      : 'Azure AI endpoint/deployment/credential not configured',
  });

  // 3. PostgreSQL — only when enabled; a real (but lightweight) reachability check.
  const db = getDatabaseConfig();
  if (db.enabled) {
    const readiness = await checkDatabaseReady();
    checks.push({
      name: 'postgresql',
      status: readiness.ok ? 'ok' : 'degraded',
      detail: readiness.error,
      latencyMs: readiness.latencyMs,
    });
  } else {
    checks.push({ name: 'postgresql', status: 'skipped', detail: 'DATABASE_URL not set' });
  }

  // 4. Blob Storage — only when enabled; configuration check without a network call.
  const storage = getStorageConfig();
  checks.push(
    storage.enabled
      ? { name: 'blob-storage', status: 'ok', detail: `container=${storage.container}` }
      : { name: 'blob-storage', status: 'skipped', detail: 'storage not configured' },
  );

  const ok = !checks.some((check) => check.status === 'degraded');
  return { ok, status: ok ? 'ready' : 'not_ready', checks, time: new Date().toISOString() };
}
