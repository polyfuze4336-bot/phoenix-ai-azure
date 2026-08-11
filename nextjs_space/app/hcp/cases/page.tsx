import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhoenixShell } from '@/components/phoenix-v2-shell';
import { CasesClient } from './_components/cases-client';
import { getDemoCases } from '@/lib/demo-data';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const metadata: Metadata = { title: 'Cases · Phoenix AI v2.0' };

export default function V2CasesPage() {
  if (!isFeatureEnabled('cases')) notFound();
  const cases = getDemoCases();
  return (
    <PhoenixShell variant="hcp" title="Cases" subtitle={`${cases.length} synthetic records`}>
      <CasesClient cases={cases} />
    </PhoenixShell>
  );
}
