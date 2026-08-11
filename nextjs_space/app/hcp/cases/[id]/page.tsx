import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhoenixShell } from '@/components/phoenix-v2-shell';
import { CaseDetailClient } from './_components/case-detail-client';
import { getDemoCaseById, getDemoCases } from '@/lib/demo-data';
import { isFeatureEnabled } from '@/lib/feature-flags';

export function generateStaticParams() {
  return getDemoCases().map((c) => ({ id: c.id }));
}

export const metadata: Metadata = { title: 'Case detail · Phoenix AI v2.0' };

export default function V2CaseDetailPage({ params }: { params: { id: string } }) {
  if (!isFeatureEnabled('cases')) notFound();
  const c = getDemoCaseById(params.id);
  if (!c) notFound();
  return (
    <PhoenixShell variant="hcp" title={c.alias} subtitle="Case detail">
      <CaseDetailClient c={c} />
    </PhoenixShell>
  );
}
