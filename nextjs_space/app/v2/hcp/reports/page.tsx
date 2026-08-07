import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { V2ReportsClient } from './_components/v2-reports-client';
import { getDemoCases } from '@/lib/v2/demo-data';
import { isFeatureEnabled } from '@/lib/v2/feature-flags';

export const metadata: Metadata = { title: 'Reports · Phoenix AI v2.0' };

export default function V2ReportsPage() {
  if (!isFeatureEnabled('reports')) notFound();
  return (
    <PhoenixV2Shell variant="hcp" title="Clinical Reports" subtitle="Structured, printable case reports">
      <V2ReportsClient cases={getDemoCases()} />
    </PhoenixV2Shell>
  );
}
