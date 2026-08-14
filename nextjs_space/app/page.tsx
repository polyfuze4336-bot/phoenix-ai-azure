import { LandingClient } from './_components/landing-client';
import { V2LandingClient } from './v2/_components/v2-landing-client';
import { isV2Enabled } from '@/lib/v2/feature-flags';

export default function LandingPage() {
  if (!isV2Enabled()) {
    return <LandingClient />;
  }
  return <V2LandingClient />;
}
