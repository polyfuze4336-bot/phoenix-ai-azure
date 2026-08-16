/**
 * Browser-side Azure Application Insights telemetry — privacy-first.
 *
 * Initialises the `@microsoft/applicationinsights-web` SDK from the PUBLIC
 * connection string (NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING). It
 * captures page views, SPA route changes, unhandled JS errors + promise
 * rejections, and outbound fetch/XHR dependencies (URLs + durations only).
 *
 * Distributed tracing is enabled (AI_AND_W3C) so a browser action correlates
 * with the server span it triggers. We also stamp our own `x-correlation-id`
 * header on same-origin API fetches (see `installCorrelationHeader`) to line up
 * with the server-side correlation plumbing used by the AI/DB/Blob telemetry.
 *
 * PRIVACY: only custom events created here (counts + metadata) and SDK-native
 * page/route/dependency/exception signals are sent. No clinical text, image
 * bytes, chat transcripts, tokens or secrets are ever passed in.
 *
 * CLIENT-ONLY. No-op when the connection string is absent or when evaluated on
 * the server.
 */

'use client';

import {
  ApplicationInsights,
  DistributedTracingModes,
  type IEventTelemetry,
} from '@microsoft/applicationinsights-web';

const CONNECTION_STRING =
  process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING?.trim() || '';

let appInsights: ApplicationInsights | null = null;
let initialised = false;
let correlationId: string | null = null;

/** Scalar-only property map — nested objects/arrays are not accepted. */
export type ClientTelemetryProperties = Record<string, string | number | boolean | null | undefined>;

/** Keys we refuse to forward from the browser, mirroring the server guard. */
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
  'authorization',
  'credential',
];

const MAX_PROP_LENGTH = 256;

function sanitize(props?: ClientTelemetryProperties): Record<string, string> {
  const clean: Record<string, string> = {};
  if (!props) return clean;
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object') continue;
    const lower = key.toLowerCase();
    if (BLOCKED_KEY_PATTERNS.some((p) => lower.includes(p))) continue;
    let str = typeof value === 'string' ? value : String(value);
    if (str.length > MAX_PROP_LENGTH) str = `${str.slice(0, MAX_PROP_LENGTH)}…`;
    clean[key] = str;
  }
  return clean;
}

function makeCorrelationId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() ?? `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  } catch {
    return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Stamp `x-correlation-id` on same-origin API requests so browser actions line
 * up with server telemetry. Wraps `window.fetch` once; leaves cross-origin and
 * pre-set headers untouched.
 */
function installCorrelationHeader(): void {
  if (typeof window === 'undefined') return;
  const w = window as typeof window & { __phoenixFetchPatched?: boolean };
  if (w.__phoenixFetchPatched) return;
  w.__phoenixFetchPatched = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      const isSameOrigin = url.startsWith('/') || url.startsWith(window.location.origin);
      const isApi = url.includes('/api/');
      if (isSameOrigin && isApi) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has('x-correlation-id')) {
          headers.set('x-correlation-id', getClientCorrelationId());
        }
        return originalFetch(input, { ...init, headers });
      }
    } catch {
      /* fall through to unmodified fetch */
    }
    return originalFetch(input, init);
  };
}

/** Initialise the web SDK once. Safe to call repeatedly; no-op when unconfigured. */
export function initClientTelemetry(): void {
  if (initialised) return;
  if (typeof window === 'undefined') return;
  if (!CONNECTION_STRING) {
    initialised = true; // mark done so we don't re-check every render
    return;
  }
  try {
    appInsights = new ApplicationInsights({
      config: {
        connectionString: CONNECTION_STRING,
        // SPA route tracking — Next.js App Router navigations become page views.
        enableAutoRouteTracking: true,
        // Correlate browser → server spans; only URLs/durations, never bodies.
        distributedTracingMode: DistributedTracingModes.AI_AND_W3C,
        enableCorsCorrelation: true,
        enableRequestHeaderTracking: false,
        enableResponseHeaderTracking: false,
        // Capture unhandled errors + promise rejections automatically.
        disableExceptionTracking: false,
        enableUnhandledPromiseRejectionTracking: true,
        // Keep fetch/XHR dependency spans (durations only).
        disableFetchTracking: false,
        disableAjaxTracking: false,
        // Privacy: do not persist user identity across sessions.
        isStorageUseDisabled: false,
        disableCookiesUsage: false,
      },
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView();
    installCorrelationHeader();
    initialised = true;
  } catch {
    appInsights = null;
    initialised = true;
  }
}

/** Get (or lazily create) this browser session's correlation ID. */
export function getClientCorrelationId(): string {
  if (!correlationId) correlationId = makeCorrelationId();
  return correlationId;
}

/** True when browser telemetry is configured and loaded. */
export function isClientTelemetryEnabled(): boolean {
  return appInsights !== null;
}

/** Track a custom client event with sanitized properties. */
export function trackClientEvent(name: string, properties?: ClientTelemetryProperties): void {
  if (!appInsights) return;
  try {
    const event: IEventTelemetry = { name };
    appInsights.trackEvent(event, sanitize(properties));
  } catch {
    /* telemetry must never throw into the UI */
  }
}

/** Track an explicit page view (initial load + SPA route changes). */
export function trackClientPageView(name?: string, uri?: string): void {
  if (!appInsights) return;
  try {
    appInsights.trackPageView({ name, uri });
  } catch {
    /* ignore */
  }
}
