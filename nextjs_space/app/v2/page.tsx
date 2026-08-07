import type { Metadata } from 'next';
import { V2LandingClient } from './_components/v2-landing-client';

export const metadata: Metadata = {
  title: 'Phoenix AI v2.0 — Enhanced Experience',
  description: 'The enhanced Phoenix AI clinical workspace. A demonstration environment built on the original Phoenix AI.',
};

export default function V2LandingPage() {
  return <V2LandingClient />;
}
