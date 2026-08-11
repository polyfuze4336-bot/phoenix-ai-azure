import type { Metadata } from 'next';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { CommunityChatClient } from './_components/community-chat-client';

export const metadata: Metadata = { title: 'Ask Phoenix · Phoenix AI v2.0' };

export default function V2CommunityChatPage() {
  return (
    <PhoenixV2Shell variant="community" title="Ask Phoenix" subtitle="First aid &amp; wound care questions">
      <CommunityChatClient />
    </PhoenixV2Shell>
  );
}
