import type { Metadata } from 'next';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { V2ChatClient } from './_components/v2-chat-client';

export const metadata: Metadata = { title: 'AI Assistant · Phoenix AI v2.0' };

export default function V2ChatPage() {
  return (
    <PhoenixV2Shell variant="hcp" title="AI Assistant" subtitle="Clinical questions on burn &amp; wound care">
      <V2ChatClient />
    </PhoenixV2Shell>
  );
}
