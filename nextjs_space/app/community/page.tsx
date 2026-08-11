import type { Metadata } from 'next';
import Link from 'next/link';
import { MessagesSquare, BookOpenText, HeartPulse, ArrowRight, ShieldAlert } from 'lucide-react';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';

export const metadata: Metadata = { title: 'Community · Phoenix AI v2.0' };

const cards = [
  { href: '/v2/community/assessment', icon: HeartPulse, title: 'Self Assessment', desc: 'Answer a few questions to understand what to do next.', accent: 'from-[#0F9B8E] to-[#0e8a7e]' },
  { href: '/v2/community/chat', icon: MessagesSquare, title: 'Ask Phoenix', desc: 'Chat about first aid and wound care in English or Bahasa Melayu.', accent: 'from-[#E67E22] to-[#F59B0C]' },
  { href: '/v2/community/first-aid', icon: ShieldAlert, title: 'First Aid', desc: 'Step-by-step first aid for common burns and wounds.', accent: 'from-[#8B0000] to-[#E67E22]' },
  { href: '/v2/community/education', icon: BookOpenText, title: 'Health Education', desc: 'Learn to prevent burns and care for wounds at home.', accent: 'from-[#0F9B8E] to-[#0F9B8E]' },
];

export default function V2CommunityHome() {
  return (
    <PhoenixV2Shell variant="community" title="Community Portal" subtitle="First aid &amp; health education">
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 v2-hero-gradient">
          <h2 className="font-display text-2xl font-bold tracking-tight">Care for burns &amp; wounds with confidence</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Friendly, plain-language help — not a diagnosis. In an emergency, call your local emergency number immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.href} href={c.href} className="group rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent}`}>
                <c.icon className="h-6 w-6 text-white" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold tracking-tight">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
                Open <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </PhoenixV2Shell>
  );
}
