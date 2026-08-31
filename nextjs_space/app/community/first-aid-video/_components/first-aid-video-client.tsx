'use client';

import { useLanguage } from '@/components/language-provider';
import { localizedContent } from '@/lib/i18n/index';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function FirstAidVideoClient({ embedUrl }: { embedUrl: string | null }) {
  const { lang } = useLanguage();
  const content = localizedContent(lang).community.firstAidVideo;

  return (
    <div className="space-y-6 min-w-0">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {content.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{content.introduction}</p>
      </header>

      {embedUrl ? (
        <div className="w-full overflow-hidden rounded-xl bg-black shadow-sm aspect-video">
          <iframe
            className="h-full w-full border-0"
            src={embedUrl}
            title={content.iframeTitle}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{content.unavailable}</p>
        </div>
      )}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold text-gray-900">{content.keyPointsHeading}</h2>
        <ul className="mt-4 space-y-3">
          {content.keyPoints.map((point) => (
            <li key={point.strong} className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F9B8E]" />
              <span>
                <strong>{point.strong}</strong>
                {point.text}
                {point.secondaryStrong && <strong>{point.secondaryStrong}</strong>}
                {point.suffix}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">{content.misconceptions}</p>
        <p className="mt-5 border-t border-gray-100 pt-4 text-center text-base text-[#8B0000]">
          <strong><em>{content.reminder}</em></strong>
        </p>
      </section>

      <aside role="note" className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-600">
        {content.disclaimer}
      </aside>
    </div>
  );
}
