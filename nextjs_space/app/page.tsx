import { LandingClient } from './_components/landing-client';
import { ExperienceSelectorClient } from './_components/experience-selector-client';
import { isV2Enabled } from '@/lib/v2/feature-flags';

export default function LandingPage() {
  // When v2 is enabled, the root becomes an experience selector that preserves the
  // original portals (unchanged) alongside the new v2.0 experience. When v2 is
  // disabled, it degrades to the original landing exactly as before.
  if (!isV2Enabled()) {
    return <LandingClient />;
  }
  return <ExperienceSelectorClient />;
}
