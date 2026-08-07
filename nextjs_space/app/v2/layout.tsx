import { notFound } from 'next/navigation';
import { isV2Enabled } from '@/lib/v2/feature-flags';

/**
 * v2 route-group guard. When FEATURE_V2_ENABLED is turned off, the entire /v2
 * surface returns 404 and the Original experience is the only one served — the
 * instant, data-safe rollback path described in ADR-0004.
 */
export default function V2Layout({ children }: { children: React.ReactNode }) {
  if (!isV2Enabled()) {
    notFound();
  }
  return <>{children}</>;
}
