'use client';

import { cn } from '@/lib/utils';
import type { Distribution } from '@/lib/demo-data';

const BAR_COLORS = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-blue-500', 'bg-orange-500'];

/** Lightweight, dependency-free horizontal bar chart for insights. */
export function MiniBarChart({ data, className }: { data: Distribution[]; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className={cn('space-y-3', className)}>
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{d.label}</span>
            <span className="font-mono text-muted-foreground">{d.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full v2-motion-safe transition-all duration-500', BAR_COLORS[i % BAR_COLORS.length])}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical column chart (e.g. weekly volume). */
export function ColumnChart({ data, className }: { data: Distribution[]; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn('flex h-40 items-end gap-2', className)}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary v2-motion-safe transition-all duration-500"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '4px' : '0' }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
