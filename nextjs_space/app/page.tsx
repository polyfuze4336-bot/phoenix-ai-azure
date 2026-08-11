import type { Metadata } from 'next';
import { LandingClient } from './_components/landing-client';

export const metadata: Metadata = {
  title: 'Phoenix AI — Enhanced Experience',
  description: 'The Phoenix AI clinical workspace. A demonstration environment built on the original Phoenix AI.',
};

export default function LandingPage() {
  return <LandingClient />;
}
