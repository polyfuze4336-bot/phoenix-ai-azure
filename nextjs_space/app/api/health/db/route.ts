/**
 * Database readiness probe.
 *
 * Runs a lightweight `SELECT 1` (with transient-failure retry) against Azure
 * Database for PostgreSQL Flexible Server and reports whether the datastore is
 * reachable. Returns 200 when ready and 503 when not, so it can drive an App
 * Service / Container Apps readiness probe or a deployment gate.
 *
 * Server-only, Node runtime, never cached.
 */

import { checkDatabaseReady } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const readiness = await checkDatabaseReady();
  const body = JSON.stringify({
    status: readiness.ok ? 'ready' : 'unavailable',
    database: readiness,
    time: new Date().toISOString(),
  });
  return new Response(body, {
    status: readiness.ok ? 200 : 503,
    headers: { 'content-type': 'application/json' },
  });
}
