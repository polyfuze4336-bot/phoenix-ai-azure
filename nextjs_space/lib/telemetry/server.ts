/**
 * Server-side Azure Application Insights telemetry — privacy-first.
 *
 * A thin wrapper around the classic `applicationinsights` Node SDK. We construct
 * a manual `TelemetryClient` directly from APPLICATIONINSIGHTS_CONNECTION_STRING
 * and DO NOT call `appInsights.setup().start()`, so no auto-instrumentation
 * monkey-patching (require-in-the-middle) is wired into the Next.js server bundle.
 * Only the explicit `trackEvent` / `trackMetric` / `trackException` /
 * `trackDependency` calls in this codebase produce telemetry.
 *
 * PRIVACY CONTRACT — this module NEVER forwards clinical content. Every custom
 * property passes through `sanitizeProperties`, which drops disallowed keys
 * (image/base64/message/content/prompt/transcript/token/password/secret/…) and
 * truncates long strings. Callers are still expected to pass counts + metadata
 * only, never raw prompts, AI responses, image bytes or credentials.
 *
 * No-op by design when the connection string is absent (local dev / demo), so
 * nothing is required to run the app without App Insights provisioned.
 *
 * SERVER-ONLY, Node runtime. Never import from a client component.
 */

import type { TelemetryClient as TelemetryClientType } from 'applicationinsights';

const CONNECTION_STRING = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING?.trim();
const CLOUD_ROLE = 'phoenix-ai-web';

/** Scalar property values we are willing to forward. */
type PropValue = string | number | boolean | null | undefined;
export type TelemetryProperties = Record<string, PropValue>;

/**
 * Property keys that must NEVER reach the telemetry backend — a defence-in-depth
 * guard so a mistaken caller cannot leak clinical text, image bytes or secrets.
 * Matched case-insensitively as a substring of the key.
 */
const BLOCKED_KEY_PATTERNS = [
  'image',
  'base64',
  'photo',
  'message',
  'content',
  'prompt',
  'transcript',
  'description',
  'clinicalresponse',
  'patient',
  'identifier',
  'token',
  'password',
  'secret',
  'apikey',
  'api_key',
  'connectionstring',
  'connection_string',
  'authorization',
  'credential',
  'sas',
];

/** Explicitly permitted operational metadata; values never contain image data. */
const SAFE_IMAGE_METADATA_KEYS = new Set(['imageSizeBucket', 'imageMimeType']);

/** Any string property longer than this is truncated (belt-and-braces vs. leaks). */
const MAX_PROP_LENGTH = 256;

function isBlockedKey(key: string): boolean {
  if (SAFE_IMAGE_METADATA_KEYS.has(key)) return false;
  const k = key.toLowerCase();
  return BLOCKED_KEY_PATTERNS.some((pattern) => k.includes(pattern));
}

/**
 * Whitelist-shape the properties: drop blocked keys, coerce scalars to strings,
 * skip nullish values, and truncate long strings. Objects/arrays are dropped
 * (they could smuggle content). Returns a flat string map for App Insights.
 */
export function sanitizeProperties(props?: TelemetryProperties): Record<string, string> {
  const clean: Record<string, string> = {};
  if (!props) return clean;
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    if (isBlockedKey(key)) continue;
    if (typeof value === 'object') continue; // never forward nested structures
    let str = typeof value === 'string' ? value : String(value);
    if (str.length > MAX_PROP_LENGTH) str = `${str.slice(0, MAX_PROP_LENGTH)}…`;
    clean[key] = str;
  }
  return clean;
}

let client: TelemetryClientType | null | undefined;

/** Lazily build (once) the manual TelemetryClient, or null when unconfigured. */
function getClient(): TelemetryClientType | null {
  if (client !== undefined) return client;
  if (!CONNECTION_STRING) {
    client = null;
    return client;
  }
  try {
    // Deferred require so the SDK is never loaded in the Edge runtime or when
    // App Insights is not configured.
    const appInsights = require('applicationinsights') as typeof import('applicationinsights');
    const tc = new appInsights.TelemetryClient(CONNECTION_STRING);
    tc.context.tags[tc.context.keys.cloudRole] = CLOUD_ROLE;
    client = tc;
  } catch {
    // If the SDK fails to initialise, degrade to a no-op rather than crash.
    client = null;
  }
  return client;
}

/** True when server telemetry is configured and active. */
export function isServerTelemetryEnabled(): boolean {
  return getClient() !== null;
}

/** Initialise the client eagerly (called once at server startup). Safe to no-op. */
export function initServerTelemetry(): void {
  getClient();
}

/** Track a custom event with sanitized properties + optional numeric measurements. */
export function trackEvent(
  name: string,
  properties?: TelemetryProperties,
  measurements?: Record<string, number>,
): void {
  const tc = getClient();
  if (!tc) return;
  try {
    tc.trackEvent({
      name,
      properties: sanitizeProperties(properties),
      measurements,
    });
  } catch {
    /* telemetry must never throw into request handling */
  }
}

/** Track a single numeric metric value with sanitized dimension properties. */
export function trackMetric(
  name: string,
  value: number,
  properties?: TelemetryProperties,
): void {
  const tc = getClient();
  if (!tc || !Number.isFinite(value)) return;
  try {
    tc.trackMetric({ name, value, properties: sanitizeProperties(properties) });
  } catch {
    /* ignore */
  }
}

/**
 * Track an exception. Only the error type/message/stack (from the Error itself)
 * plus sanitized metadata are sent — callers must not attach clinical content.
 */
export function trackException(error: unknown, properties?: TelemetryProperties): void {
  const tc = getClient();
  if (!tc) return;
  try {
    const exception = error instanceof Error ? error : new Error(String(error ?? 'unknown error'));
    tc.trackException({ exception, properties: sanitizeProperties(properties) });
  } catch {
    /* ignore */
  }
}

/** Track an outbound dependency call (DB, Blob, AI provider) — no payloads. */
export function trackDependency(opts: {
  dependencyTypeName: string;
  name: string;
  data?: string;
  duration: number;
  success: boolean;
  resultCode?: string | number;
  correlationId?: string;
  properties?: TelemetryProperties;
}): void {
  const tc = getClient();
  if (!tc) return;
  try {
    tc.trackDependency({
      dependencyTypeName: opts.dependencyTypeName,
      name: opts.name,
      data: opts.data ?? opts.name,
      duration: opts.duration,
      success: opts.success,
      resultCode: opts.resultCode ?? (opts.success ? 0 : 1),
      properties: sanitizeProperties({
        ...opts.properties,
        ...(opts.correlationId ? { correlationId: opts.correlationId } : {}),
      }),
    } as Parameters<TelemetryClientType['trackDependency']>[0]);
  } catch {
    /* ignore */
  }
}

/** Flush buffered telemetry (best-effort; e.g. before a short-lived task ends). */
export function flushTelemetry(): void {
  const tc = getClient();
  if (!tc) return;
  try {
    tc.flush();
  } catch {
    /* ignore */
  }
}
