'use client';

import { useLanguage } from '@/components/language-provider';
import { LanguageToggle } from '@/components/language-toggle';
import { PhoenixLogo } from '@/components/phoenix-logo';
import { APP_VERSION, DEMO_ENVIRONMENT_LABEL } from '@/lib/v2/version';
import { Stethoscope, Users, ArrowRight, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export function ExperienceSelectorClient() {
  const { t, lang } = useLanguage();
  const bm = lang === 'bm';

  const v2Highlights = bm
    ? ['Ruang kerja klinikal dengan papan pemuka', 'Navigasi dipertingkatkan & palet arahan', 'Cerapan visual data sintetik']
    : ['Clinical workspace with dashboard', 'Enhanced navigation & command palette', 'Visual insights on synthetic data'];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      {/* Header — identical treatment to the original */}
      <header className="phoenix-gradient safe-area-top sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-2.5 md:py-3">
          <div className="flex items-center gap-2 md:gap-3">
            <PhoenixLogo className="h-8 w-8 md:h-10 md:w-10" alt="Phoenix AI Logo" />
            <span className="font-display text-lg font-bold tracking-tight text-white md:text-xl">Phoenix AI</span>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Official endorsement banner — unchanged */}
      <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <div className="mx-auto flex max-w-[1200px] justify-center px-4 py-3 md:py-4">
          <div className="relative h-[117px] w-[180px] md:h-[150px] md:w-[230px]">
            <Image src="/kkm-hkl-logo.jpeg" alt="Kementerian Kesihatan Malaysia — Hospital Kuala Lumpur" fill className="object-contain" priority />
          </div>
        </div>
      </div>

      <section className="relative flex flex-1 flex-col">
        <div className="hero-gradient absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center px-4 py-10 text-center md:py-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-5 flex justify-center md:mb-7">
              <PhoenixLogo className="h-24 w-24 animate-spin-slow md:h-36 md:w-36" style={{ perspective: '800px', transformStyle: 'preserve-3d' }} imageClassName="drop-shadow-lg" />
            </div>
            <h1 className="font-display mb-2 text-3xl font-bold tracking-tight md:text-5xl">
              <span className="phoenix-gradient-text">Phoenix AI</span>
            </h1>
            <p className="mx-auto mb-1 max-w-2xl text-base font-medium text-gray-600 md:text-lg">
              {bm ? 'Pilih pengalaman anda' : 'Choose your experience'}
            </p>
            <p className="mx-auto mb-8 max-w-xl px-2 text-xs text-gray-500 md:text-sm md:mb-10">
              {bm
                ? 'Versi asal kekal tidak berubah. Cuba pengalaman dipertingkatkan yang baharu di sebelahnya.'
                : 'The original version is preserved unchanged. Try the new enhanced experience alongside it.'}
            </p>
          </motion.div>

          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {/* Original Experience */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-lg md:p-7"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {bm ? 'Versi Asal' : 'Original'}
                </span>
              </div>
              <h2 className="font-display mt-4 text-xl font-bold tracking-tight text-gray-900">
                {bm ? 'Pengalaman Asal' : 'Original Experience'}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {bm ? 'Antara muka Phoenix AI yang sedia ada, tidak diubah.' : 'The familiar Phoenix AI interface, exactly as it is.'}
              </p>
              <div className="mt-5 space-y-2">
                <Link href="/hcp-login" className="group flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-all hover:border-[#8B0000]/20 hover:bg-[#8B0000]/5">
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B0000] to-[#C0392B]">
                      <Stethoscope className="h-5 w-5 text-white" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{t('landing.hcp_title')}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#8B0000] transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/community" className="group flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-all hover:border-[#0F9B8E]/20 hover:bg-[#0F9B8E]/5">
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F9B8E] to-[#0e8a7e]">
                      <Users className="h-5 w-5 text-white" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{t('landing.community_title')}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#0F9B8E] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>

            {/* Phoenix AI v2.0 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Link href="/v2" className="group flex h-full flex-col rounded-2xl border border-[#8B0000]/20 bg-white p-5 text-left shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl md:p-7">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#8B0000] to-[#E67E22] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    <Sparkles className="h-3 w-3" /> {bm ? 'Baharu' : 'New'} · v{APP_VERSION}
                  </span>
                </div>
                <h2 className="font-display mt-4 text-xl font-bold tracking-tight text-gray-900">
                  {bm ? 'Phoenix AI v2.0 (Dipertingkatkan)' : 'Phoenix AI v2.0 (Enhanced)'}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  {bm ? 'Pengalaman baharu yang direka semula — kandungan klinikal yang sama.' : 'A redesigned experience — the same clinical content, reimagined.'}
                </p>
                <ul className="mt-5 space-y-2">
                  {v2Highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0F9B8E]" /> {h}
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#8B0000] transition-all group-hover:gap-3">
                  {bm ? 'Cuba v2.0' : 'Try v2.0'} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-[11px] text-gray-400">
            {DEMO_ENVIRONMENT_LABEL} · {bm ? 'Data demonstrasi sintetik sahaja' : 'Synthetic demonstration data only'}
          </p>
        </div>
      </section>
    </div>
  );
}
