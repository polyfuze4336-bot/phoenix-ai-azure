'use client';

import { useLanguage } from '@/components/language-provider';
import type { ResolvedFirstAidVideo } from '@/lib/config/first-aid-video';
import { localizedContent } from '@/lib/i18n/index';
import { AlertCircle, ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

export function FirstAidVideoClient({ videos }: { videos: ResolvedFirstAidVideo[] }) {
  const { lang } = useLanguage();
  const content = localizedContent(lang).community.firstAidVideo;
  const preventionContent = localizedContent(lang).community.burnPrevention;
  const initialVideo = videos.find((video) => video.featured) ?? videos[0];
  const [activeVideoId, setActiveVideoId] = useState(initialVideo?.id);
  const [failedVideoId, setFailedVideoId] = useState<string>();
  const playerRef = useRef<HTMLDivElement>(null);
  const activeVideo = videos.find((video) => video.id === activeVideoId) ?? initialVideo;

  function selectVideo(videoId: string) {
    setActiveVideoId(videoId);
    setFailedVideoId(undefined);
    requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      playerRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="space-y-6 min-w-0">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {content.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{content.introduction}</p>
      </header>

      <section ref={playerRef} tabIndex={-1} className="scroll-mt-4 outline-none">
        {videos.length > 1 && (
          <h2 className="mb-3 font-display text-lg font-bold text-gray-900">
            {content.featuredHeading}
          </h2>
        )}

        {activeVideo && failedVideoId !== activeVideo.id ? (
          <div className="w-full overflow-hidden rounded-xl bg-black shadow-sm aspect-video">
            <iframe
              key={activeVideo.videoId}
              className="h-full w-full border-0"
              src={activeVideo.embedUrl}
              title={`${content.iframeTitle}: ${activeVideo.title[lang]}`}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              onError={() => setFailedVideoId(activeVideo.id)}
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

        {activeVideo && (
          <div className="mt-3">
            <p className="font-semibold text-gray-900">{activeVideo.title[lang]}</p>
            {activeVideo.description && (
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {activeVideo.description[lang]}
              </p>
            )}
          </div>
        )}
      </section>

      {videos.length > 1 && (
        <section aria-labelledby="more-first-aid-videos">
          <h2 id="more-first-aid-videos" className="font-display text-lg font-bold text-gray-900">
            {content.moreVideosHeading}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos
              .filter((video) => video.id !== activeVideo?.id)
              .map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => selectVideo(video.id)}
                  className="group min-w-0 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-[#8B0000]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B0000]"
                  aria-label={`${content.watchVideo}: ${video.title[lang]}`}
                >
                  <div className="flex items-start gap-3">
                    <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#8B0000]" />
                    <div className="min-w-0">
                      {video.category && (
                        <p className="text-xs font-medium text-[#0F9B8E]">{video.category[lang]}</p>
                      )}
                      <p className="font-semibold text-gray-900">{video.title[lang]}</p>
                      {video.description && (
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">
                          {video.description[lang]}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-semibold text-[#8B0000]">
                        {content.watchVideo}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
        </div>
        </section>
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

      <section className="rounded-xl bg-[#8B0000] p-5 text-white shadow-sm">
        <h2 className="font-display text-lg font-bold">{preventionContent.callout.heading}</h2>
        <p className="mt-1 text-sm text-white/90">{preventionContent.callout.text}</p>
        <Link
          href="/community/first-aid"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#8B0000] transition-colors hover:bg-red-50"
        >
          {preventionContent.callout.button}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <aside role="note" className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-600">
        {preventionContent.disclaimer}
      </aside>

      <aside role="note" className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-600">
        {content.disclaimer}
      </aside>
    </div>
  );
}
