import type { Metadata } from 'next';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { V2CalculatorsClient } from './_components/v2-calculators-client';

export const metadata: Metadata = { title: 'Calculators · Phoenix AI v2.0' };

export default function V2CalculatorsPage() {
  return (
    <PhoenixV2Shell variant="hcp" title="Clinical Calculators" subtitle="TBSA (Rule of Nines) &amp; Parkland fluid resuscitation">
      <V2CalculatorsClient />
    </PhoenixV2Shell>
  );
}
