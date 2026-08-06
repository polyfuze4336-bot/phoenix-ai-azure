'use client';

/**
 * Mounts once in the root layout to initialise browser telemetry and record
 * SPA route transitions.
 *
 * - On mount: initialise the Application Insights web SDK (which also emits the
 *   initial page-load view) and install the correlation-header fetch wrapper.
 * - On pathname change: emit a lightweight `route_changed` event so client-side
 *   navigations are visible distinctly from the SDK's automatic page views.
 *
 * Renders nothing. No clinical content is ever passed to telemetry — only the
 * pathname (a non-sensitive route string) is recorded.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { initClientTelemetry, trackClientEvent } from '@/lib/telemetry/client';

export function TelemetryProvider() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    initClientTelemetry();
  }, []);

  useEffect(() => {
    if (previous.current !== null && previous.current !== pathname) {
      trackClientEvent('route_changed', { path: pathname ?? '' });
    }
    previous.current = pathname ?? null;
  }, [pathname]);

  return null;
}
