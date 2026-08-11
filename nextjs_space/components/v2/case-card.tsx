'use client';

import Link from 'next/link';
import { ArrowUpRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemoCase } from '@/lib/v2/demo-data';
import { caseTypeLabel, formatRelative, statusStyles, priorityStyles, confidenceLabel } from '@/lib/v2/format';

/** Compact clickable case summary card linking to the case detail page. */
export function CaseCard({ c }: { c: DemoCase }) {
  const status = statusStyles(c.status);
  const priority = priorityStyles(c.priority);
  return (
    <Link
      href={`/v2/hcp/cases/${c.id}`}
      className="group block rounded-xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', status.bg, status.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', priority.bg, priority.text)}>{priority.label}</span>
          </div>
          <h3 className="mt-2 truncate font-display text-sm font-bold tracking-tight text-foreground">{c.alias}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {caseTypeLabel(c.caseType)} · {c.bodyRegion}
            {c.tbsaPercent ? ` · ${c.tbsaPercent}% TBSA` : ''}
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Activity className="h-3 w-3" aria-hidden />
          {confidenceLabel(c.confidence)} confidence
        </span>
        <span>{formatRelative(c.updatedAt)}</span>
      </div>
    </Link>
  );
}
