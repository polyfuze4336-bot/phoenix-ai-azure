import type { Metadata } from 'next';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { FirstAidClient } from './_components/first-aid-client';

export const metadata: Metadata = { title: 'First Aid · Phoenix AI v2.0' };

export default function V2FirstAidPage() {
  return (
    <PhoenixV2Shell variant="community" title="First Aid" subtitle="Step-by-step guides for burns &amp; wounds">
      <FirstAidClient />
    </PhoenixV2Shell>
  );
}
