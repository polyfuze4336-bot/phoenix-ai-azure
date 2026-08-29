'use client';

import { useLanguage } from '@/components/language-provider';
import { localizedContent } from '@/lib/i18n/index';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function BurnPreventionClient() {
  const { lang } = useLanguage();
  const content = localizedContent(lang).community.burnPrevention;

  return (
    <div className="space-y-6 min-w-0">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {content.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{content.introduction}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {content.categories.map((category) => (
          <section key={category.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F9B8E]/10">
                <ShieldCheck className="h-5 w-5 text-[#0F9B8E]" />
              </div>
              <h2 className="font-display text-base font-semibold text-gray-900">{category.title}</h2>
            </div>
            {category.sections ? (
              <div className="mt-4 space-y-4">
                {category.sections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-semibold text-gray-800">{section.title}</h3>
                    <PointList points={section.points} />
                  </div>
                ))}
              </div>
            ) : (
              <PointList points={category.points ?? []} />
            )}
          </section>
        ))}
      </div>

      <section className="rounded-xl bg-[#8B0000] p-5 text-white shadow-sm">
        <h2 className="font-display text-lg font-bold">{content.callout.heading}</h2>
        <p className="mt-1 text-sm text-white/90">{content.callout.text}</p>
        <Link
          href="/community/first-aid"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#8B0000] transition-colors hover:bg-red-50"
        >
          {content.callout.button}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <aside role="note" className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-600">
        {content.disclaimer}
      </aside>
    </div>
  );
}

function PointList({ points }: { points: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F9B8E]" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}
