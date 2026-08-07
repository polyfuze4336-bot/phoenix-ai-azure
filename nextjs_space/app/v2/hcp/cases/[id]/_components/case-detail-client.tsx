'use client';

import Link from 'next/link';
import {
  ArrowLeft, MapPin, User, Ruler, Flame, Stethoscope, CalendarDays,
  FileText, MessageSquarePlus, ClipboardCheck, ListChecks, History,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DemoBadge, SyntheticDataNote } from '@/components/v2/demo-badge';
import type { DemoCase } from '@/lib/v2/demo-data';
import {
  caseTypeLabel, formatDate, statusStyles, priorityStyles, severityStyles, confidenceLabel,
} from '@/lib/v2/format';

function Fact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function CaseDetailClient({ c }: { c: DemoCase }) {
  const status = statusStyles(c.status);
  const priority = priorityStyles(c.priority);
  const severity = severityStyles(c.severity);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/v2/hcp/cases">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to cases
          </Link>
        </Button>
        <DemoBadge />
      </div>

      {/* Header card */}
      <div className="rounded-xl border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', status.bg, status.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} /> {status.label}
          </span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', priority.bg, priority.text)}>{priority.label} priority</span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', severity.bg, severity.text)}>{severity.label}</span>
        </div>
        <h2 className="mt-3 font-display text-xl font-bold tracking-tight md:text-2xl">{c.alias}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{c.summary}</p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact icon={Stethoscope} label="Case type" value={caseTypeLabel(c.caseType)} />
          <Fact icon={MapPin} label="Body region" value={c.bodyRegion} />
          <Fact icon={User} label="Patient" value={`${c.sex} · ${c.ageGroup} yrs (alias)`} />
          <Fact icon={Flame} label="Mechanism" value={c.mechanism} />
          {c.tbsaPercent ? <Fact icon={Ruler} label="Est. TBSA" value={`${c.tbsaPercent}%`} /> : null}
          <Fact icon={ClipboardCheck} label="AI confidence" value={`${confidenceLabel(c.confidence)} (${Math.round(c.confidence * 100)}%)`} />
          <Fact icon={CalendarDays} label="Opened" value={formatDate(c.createdAt)} />
          <Fact icon={History} label="Last updated" value={formatDate(c.updatedAt)} />
          <Fact icon={User} label="Clinician" value={c.clinician} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-display text-sm font-bold tracking-tight">Clinical summary</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/v2/hcp/analysis"><FileText className="mr-1.5 h-4 w-4" /> New assessment</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/v2/hcp/chat"><MessageSquarePlus className="mr-1.5 h-4 w-4" /> Ask AI assistant</Link>
                </Button>
                {c.tbsaPercent ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/v2/hcp/calculators">Fluid calculator</Link>
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-display text-sm font-bold tracking-tight">Key recommendations</h3>
              <ul className="mt-3 space-y-2">
                {c.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <ol className="relative space-y-5 border-l pl-6">
              {c.timeline.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-bold tracking-tight">{ev.title}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(ev.at)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{ev.detail}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">— {ev.author}</p>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-display text-sm font-bold tracking-tight">Management plan</h3>
            <ul className="mt-3 space-y-2.5">
              {c.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-lg border p-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Guidance is educational and demonstration-only; it does not replace clinical judgement.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <SyntheticDataNote />
    </div>
  );
}
