'use client';

import { cn } from '@/lib/utils';
import type { Distribution } from '@/lib/v2/demo-data';

const SEGMENT_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#3b82f6', '#f97316'];

/** SVG donut chart with legend — no charting dependency. */
export function DonutChart({ data, className, size = 160 }: { data: Distribution[]; className?: string; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={12} />
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const seg = (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
              strokeWidth={12}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return seg;
        })}
        <text x={size / 2} y={size / 2} className="rotate-90" textAnchor="middle" dominantBaseline="central" style={{ transformOrigin: 'center' }} fontSize="22" fontWeight="700" fill="hsl(var(--foreground))">
          {total}
        </text>
      </svg>
      <ul className="space-y-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-sm" style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
            <span className="text-foreground">{d.label}</span>
            <span className="font-mono text-muted-foreground">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
