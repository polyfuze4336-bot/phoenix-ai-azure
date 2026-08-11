'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, ListChecks, PhoneCall } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/components/language-provider';
import { FIRST_AID_GUIDES } from '@/lib/v2/first-aid';

export function FirstAidClient() {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const [open, setOpen] = useState<string>('burn');

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:bg-red-950/40 dark:text-red-300">
        <PhoneCall className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">In a life-threatening emergency, call 999 (Malaysia) immediately.</p>
      </div>

      <Accordion type="single" collapsible value={open} onValueChange={(v) => setOpen(v)} className="space-y-3">
        {FIRST_AID_GUIDES.map((g) => (
          <AccordionItem key={g.id} value={g.id} className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <g.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-sm font-bold tracking-tight">{en ? g.titleEn : g.titleBm}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pb-2">
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ListChecks className="h-3.5 w-3.5" /> Steps
                  </h4>
                  <ol className="space-y-1.5">
                    {(en ? g.stepsEn : g.stepsBm).map((s, i) => (
                      <li key={i} className="text-sm text-foreground">{s}</li>
                    ))}
                  </ol>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:bg-emerald-950/30">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Do
                    </h4>
                    <ul className="space-y-1.5">
                      {(en ? g.dosEn : g.dosBm).map((d, i) => (
                        <li key={i} className="text-sm text-emerald-800 dark:text-emerald-200">• {d}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-950/30">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-red-700 dark:text-red-300">
                      <XCircle className="h-3.5 w-3.5" /> Don&apos;t
                    </h4>
                    <ul className="space-y-1.5">
                      {(en ? g.dontsEn : g.dontsBm).map((d, i) => (
                        <li key={i} className="text-sm text-red-800 dark:text-red-200">• {d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
