import type { Metadata } from 'next';
import { PhoenixShell } from '@/components/phoenix-v2-shell';
import { CalculatorsClient } from './_components/calculators-client';

export const metadata: Metadata = { title: 'Calculators · Phoenix AI v2.0' };

export default function V2CalculatorsPage() {
  return (
    <PhoenixShell variant="hcp" title="Clinical Calculators" subtitle="TBSA (Rule of Nines) &amp; Parkland fluid resuscitation">
      <CalculatorsClient />
    </PhoenixShell>
  );
}
