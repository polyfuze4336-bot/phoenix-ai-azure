/**
 * Prisma client for Azure Database for PostgreSQL Flexible Server.
 *
 * - TLS: Azure requires an encrypted connection, so `sslmode=require` is applied
 *   automatically if the connection string omits it.
 * - Connection pool: modest defaults suited to App Service / Container Apps sharing
 *   a Flexible Server (Burstable tiers have a low max_connections). Override via the
 *   DATABASE_URL query string if needed.
 * - Transient failures: `withDbRetry` retries connection blips with backoff.
 * - Readiness: `checkDatabaseReady` powers the /api/health/db probe.
 *
 * DATABASE_URL is server-only and must never be exposed to the browser.
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { trackDependency, trackMetric } from '@/lib/telemetry/server'

/** Applied only when the DATABASE_URL does not already specify them. */
const POOL_DEFAULTS: Record<string, string> = {
  connection_limit: '5',
  pool_timeout: '15',
  connect_timeout: '15',
}

/** Ensure SSL and sane pool defaults without clobbering explicit settings. */
function buildDatasourceUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw
  try {
    const url = new URL(raw)
    if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require')
    for (const [key, value] of Object.entries(POOL_DEFAULTS)) {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value)
    }
    return url.toString()
  } catch {
    // Not a parseable URL (e.g. a placeholder) - hand it back untouched.
    return raw
  }
}

const datasourceUrl = buildDatasourceUrl(process.env.DATABASE_URL)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/** Postgres/Prisma error codes that indicate a transient connectivity problem. */
const TRANSIENT_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017'])
const TRANSIENT_MESSAGE =
  /ECONNRESET|ETIMEDOUT|ECONNREFUSED|Connection terminated|server closed|Timed out/i

function isTransientError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true
  const code = (err as { code?: unknown } | null)?.code
  if (typeof code === 'string' && TRANSIENT_CODES.has(code)) return true
  const message = err instanceof Error ? err.message : String(err ?? '')
  return TRANSIENT_MESSAGE.test(message)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Retry a database operation on transient failures with exponential backoff + jitter.
 * Non-transient errors (e.g. constraint violations) are rethrown immediately.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, baseDelayMs = 200 }: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= retries || !isTransientError(err)) throw err
      const delay = baseDelayMs * 2 ** attempt + Math.random() * baseDelayMs
      await sleep(delay)
      attempt += 1
    }
  }
}

export interface DbReadiness {
  ok: boolean
  latencyMs: number
  error?: string
}

/** Lightweight readiness check: `SELECT 1` with transient retry. */
export async function checkDatabaseReady(correlationId?: string): Promise<DbReadiness> {
  if (!process.env.DATABASE_URL) {
    return { ok: false, latencyMs: 0, error: 'DATABASE_URL is not configured' }
  }
  const started = Date.now()
  try {
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`, { retries: 2, baseDelayMs: 150 })
    const latencyMs = Date.now() - started
    // Privacy-safe: record only the latency + success of the probe, never data.
    trackDependency({
      dependencyTypeName: 'PostgreSQL',
      name: 'postgres:SELECT 1',
      duration: latencyMs,
      success: true,
      correlationId,
    })
    trackMetric('postgres_latency_ms', latencyMs, { correlationId, ok: true })
    return { ok: true, latencyMs }
  } catch (err) {
    const latencyMs = Date.now() - started
    trackDependency({
      dependencyTypeName: 'PostgreSQL',
      name: 'postgres:SELECT 1',
      duration: latencyMs,
      success: false,
      correlationId,
    })
    trackMetric('postgres_latency_ms', latencyMs, { correlationId, ok: false })
    return {
      ok: false,
      latencyMs,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
