import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhoenixShell } from '@/components/phoenix-v2-shell';
import { ReportsClient } from './_components/reports-client';
import { getDemoCases } from '@/lib/demo-data';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const metadata: Metadata = { title: 'Reports · Phoenix AI v2.0' };

export default function V2ReportsPage() {
  if (!isFeatureEnabled('reports')) notFound();
  return (
    <PhoenixShell variant="hcp" title="Clinical Reports" subtitle="Structured, printable case reports">
      <ReportsClient cases={getDemoCases()} />
    </PhoenixShell>
  );
}
