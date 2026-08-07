import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { CasesClient } from './_components/cases-client';
import { getDemoCases } from '@/lib/v2/demo-data';
import { isFeatureEnabled } from '@/lib/v2/feature-flags';

export const metadata: Metadata = { title: 'Cases · Phoenix AI v2.0' };

export default function V2CasesPage() {
  if (!isFeatureEnabled('cases')) notFound();
  const cases = getDemoCases();
  return (
    <PhoenixV2Shell variant="hcp" title="Cases" subtitle={`${cases.length} synthetic records`}>
      <CasesClient cases={cases} />
    </PhoenixV2Shell>
  );
}
