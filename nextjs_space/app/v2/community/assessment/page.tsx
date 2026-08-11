import type { Metadata } from 'next';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { V2AssessmentClient } from './_components/v2-assessment-client';

export const metadata: Metadata = { title: 'Self Assessment · Phoenix AI v2.0' };

export default function V2CommunityAssessmentPage() {
  return (
    <PhoenixV2Shell variant="community" title="Self Assessment" subtitle="Answer a few questions to know what to do next">
      <V2AssessmentClient />
    </PhoenixV2Shell>
  );
}
