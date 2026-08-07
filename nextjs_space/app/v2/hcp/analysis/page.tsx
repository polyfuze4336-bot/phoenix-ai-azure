import type { Metadata } from 'next';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { V2AssessmentClient } from './_components/v2-assessment-client';

export const metadata: Metadata = { title: 'New Assessment · Phoenix AI v2.0' };

export default function V2AnalysisPage() {
  return (
    <PhoenixV2Shell variant="hcp" title="New Assessment" subtitle="Guided AI wound &amp; burn assessment">
      <V2AssessmentClient />
    </PhoenixV2Shell>
  );
}
