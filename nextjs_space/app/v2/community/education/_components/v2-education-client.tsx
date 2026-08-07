'use client';

import { useMemo, useState } from 'react';
import { Search, ShieldCheck, Stethoscope, Apple, ActivitySquare, BookOpen, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';
import { DEMO_ARTICLES } from '@/scripts/seed-data';

type Article = (typeof DEMO_ARTICLES)[number];

const CATEGORY_META: Record<string, { label: string; icon: typeof ShieldCheck }> = {
  prevention: { label: 'Prevention', icon: ShieldCheck },
  wound_care: { label: 'Wound Care', icon: Stethoscope },
  nutrition: { label: 'Nutrition', icon: Apple },
  infection: { label: 'Infection', icon: ActivitySquare },
};

export function V2EducationClient() {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [active, setActive] = useState<Article | null>(null);

  const categories = useMemo(() => Array.from(new Set(DEMO_ARTICLES.map((a) => a.category))), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEMO_ARTICLES.filter((a) => {
      if (category !== 'all' && a.category !== category) return false;
      if (!q) return true;
      const hay = `${a.titleEn} ${a.titleBm} ${a.summaryEn} ${a.summaryBm}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All" active={category === 'all'} onClick={() => setCategory('all')} />
          {categories.map((c) => (
            <FilterChip key={c} label={CATEGORY_META[c]?.label ?? c} active={category === c} onClick={() => setCategory(c)} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => {
          const meta = CATEGORY_META[a.category] ?? { label: a.category, icon: BookOpen };
          return (
            <button key={a.id} onClick={() => setActive(a)} className="group flex flex-col rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <meta.icon className="h-5 w-5" />
              </span>
              <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{meta.label}</span>
              <h3 className="mt-1 font-display text-base font-bold tracking-tight">{en ? a.titleEn : a.titleBm}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{en ? a.summaryEn : a.summaryBm}</p>
              <span className="mt-3 text-sm font-semibold text-primary group-hover:underline">Read more</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No articles match your search.</p> : null}

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setActive(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORY_META[active.category]?.label ?? active.category}</span>
                <h2 className="mt-1 font-display text-xl font-bold tracking-tight">{en ? active.titleEn : active.titleBm}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActive(null)}><X className="h-5 w-5" /></Button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{en ? active.contentEn : active.contentBm}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}
