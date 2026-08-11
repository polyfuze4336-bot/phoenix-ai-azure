/**
 * Next.js instrumentation hook — runs ONCE when the server process starts.
 *
 * Validates the environment for an Azure App Service boot and logs a concise,
 * secret-free report. It deliberately NEVER throws: a misconfigured demo should
 * still start and surface the problem through logs + the /api/health/ready probe,
 * rather than crash-loop the container.
 *
 * Requires `experimental.instrumentationHook` in next.config.js.
 */

export async function register(): Promise<void> {
  // Only run in the Node.js server runtime (skip the Edge runtime).
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Initialise Application Insights first so early telemetry is captured. No-op
  // when APPLICATIONINSIGHTS_CONNECTION_STRING is absent (local dev / demo).
  const { initServerTelemetry, trackEvent } = await import('@/lib/telemetry/server');
  initServerTelemetry();

  const { validateEnvironment } = await import('@/lib/config/environment');
  const result = validateEnvironment();

  const prefix = '[Phoenix AI][startup]';
  if (result.errors.length > 0) {
    console.error(`${prefix} environment validation found ${result.errors.length} error(s):`);
    for (const error of result.errors) console.error(`${prefix}  - ${error}`);
  }
  if (result.warnings.length > 0) {
    console.warn(`${prefix} environment advisories:`);
    for (const warning of result.warnings) console.warn(`${prefix}  - ${warning}`);
  }
  if (result.ok) {
    console.log(`${prefix} environment validated; core AI configuration present.`);
  } else {
    console.error(
      `${prefix} core AI configuration is incomplete — the app will start but AI features will fail until it is fixed.`,
    );
  }

  // Privacy-safe startup marker (counts only) for boot visibility in App Insights.
  trackEvent('app_startup_complete', {
    ok: result.ok,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
  });
}
