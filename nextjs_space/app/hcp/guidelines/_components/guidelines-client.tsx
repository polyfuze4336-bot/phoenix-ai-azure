'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, MessageSquarePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { GuidelineTopic } from '@/lib/v2/guidelines';
import { GUIDELINE_CATEGORIES } from '@/lib/v2/guidelines';

export function GuidelinesClient({ topics, guidelineAi }: { topics: GuidelineTopic[]; guidelineAi: boolean }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter((t) => {
      if (category !== 'All' && t.category !== category) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.points.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [topics, query, category]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search guidelines…" className="pl-9" aria-label="Search guidelines" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', ...GUIDELINE_CATEGORIES].map((c) => (
            <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} className="text-xs" onClick={() => setCategory(c)}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      {guidelineAi ? (
        <div className="flex items-center justify-between rounded-xl border bg-primary/5 p-4">
          <div>
            <p className="font-display text-sm font-bold tracking-tight">Need something specific?</p>
            <p className="text-xs text-muted-foreground">Ask the AI assistant a guideline question.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/v2/hcp/chat"><MessageSquarePlus className="mr-1.5 h-4 w-4" /> Ask AI</Link>
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">No guidelines match your search.</div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {filtered.map((t) => (
            <AccordionItem key={t.id} value={t.id} className="rounded-xl border bg-card px-4">
              <AccordionTrigger className="text-left hover:no-underline">
                <div>
                  <span className={cn('mb-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground')}>{t.category}</span>
                  <p className="font-display text-sm font-bold tracking-tight">{t.title}</p>
                  <p className="text-xs font-normal text-muted-foreground">{t.summary}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pb-2">
                  {t.points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <p className="text-xs text-muted-foreground">
        General educational guidance for demonstration. Always follow local protocols and clinical judgement.
      </p>
    </div>
  );
}
