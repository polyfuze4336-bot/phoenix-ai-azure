'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CaseCard } from '@/components/v2/case-card';
import { SyntheticDataNote } from '@/components/v2/demo-badge';
import type { DemoCase, CaseStatus, CaseType } from '@/lib/v2/demo-data';
import { caseTypeLabel } from '@/lib/v2/format';

const STATUS_FILTERS: Array<{ key: CaseStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'MONITORING', label: 'Monitoring' },
  { key: 'REFERRED', label: 'Referred' },
  { key: 'HEALED', label: 'Healed' },
];

const TYPE_FILTERS: Array<CaseType | 'ALL'> = ['ALL', 'BURN', 'DIABETIC_ULCER', 'PRESSURE_ULCER', 'TRAUMATIC_WOUND', 'SURGICAL_WOUND'];

export function CasesClient({ cases }: { cases: DemoCase[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<CaseStatus | 'ALL'>('ALL');
  const [type, setType] = useState<CaseType | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (status !== 'ALL' && c.status !== status) return false;
      if (type !== 'ALL' && c.caseType !== type) return false;
      if (!q) return true;
      return (
        c.alias.toLowerCase().includes(q) ||
        c.bodyRegion.toLowerCase().includes(q) ||
        c.mechanism.toLowerCase().includes(q) ||
        caseTypeLabel(c.caseType).toLowerCase().includes(q)
      );
    });
  }, [cases, query, status, type]);

  const hasFilter = query || status !== 'ALL' || type !== 'ALL';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases…"
            className="pl-9"
            aria-label="Search cases"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={status === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {TYPE_FILTERS.map((t) => (
          <Button
            key={t}
            variant={type === t ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs"
            onClick={() => setType(t)}
          >
            {t === 'ALL' ? 'All types' : caseTypeLabel(t)}
          </Button>
        ))}
        {hasFilter ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              setQuery('');
              setStatus('ALL');
              setType('ALL');
            }}
          >
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {cases.length} cases
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No cases match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>
      )}

      <SyntheticDataNote />
    </div>
  );
}
