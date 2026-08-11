import type { Metadata } from 'next';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { EducationClient } from './_components/education-client';

export const metadata: Metadata = { title: 'Health Education · Phoenix AI v2.0' };

export default function V2EducationPage() {
  return (
    <PhoenixV2Shell variant="community" title="Health Education" subtitle="Prevention &amp; home care articles">
      <EducationClient />
    </PhoenixV2Shell>
  );
}
