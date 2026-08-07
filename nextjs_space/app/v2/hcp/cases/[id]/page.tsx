import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { CaseDetailClient } from './_components/case-detail-client';
import { getDemoCaseById, getDemoCases } from '@/lib/v2/demo-data';
import { isFeatureEnabled } from '@/lib/v2/feature-flags';

export function generateStaticParams() {
  return getDemoCases().map((c) => ({ id: c.id }));
}

export const metadata: Metadata = { title: 'Case detail · Phoenix AI v2.0' };

export default function V2CaseDetailPage({ params }: { params: { id: string } }) {
  if (!isFeatureEnabled('cases')) notFound();
  const c = getDemoCaseById(params.id);
  if (!c) notFound();
  return (
    <PhoenixV2Shell variant="hcp" title={c.alias} subtitle="Case detail">
      <CaseDetailClient c={c} />
    </PhoenixV2Shell>
  );
}
