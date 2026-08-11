import type { Metadata } from 'next';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { V2ImageCheckClient } from './_components/v2-image-check-client';

export const metadata: Metadata = { title: 'Image Check · Phoenix AI v2.0' };

export default function V2ImageCheckPage() {
  return (
    <PhoenixV2Shell variant="community" title="Image Check" subtitle="Quick guidance on a wound or burn photo">
      <V2ImageCheckClient />
    </PhoenixV2Shell>
  );
}
