import type { Metadata } from 'next';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { GuidelinesClient } from './_components/guidelines-client';
import { GUIDELINE_TOPICS } from '@/lib/v2/guidelines';
import { isFeatureEnabled } from '@/lib/v2/feature-flags';

export const metadata: Metadata = { title: 'Guidelines · Phoenix AI v2.0' };

export default function V2GuidelinesPage() {
  return (
    <PhoenixV2Shell variant="hcp" title="Clinical Guidelines" subtitle="Quick-reference burn &amp; wound care">
      <GuidelinesClient topics={GUIDELINE_TOPICS} guidelineAi={isFeatureEnabled('guidelineAi')} />
    </PhoenixV2Shell>
  );
}
