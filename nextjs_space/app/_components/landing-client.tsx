'use client';

import { useLanguage } from '@/components/language-provider';
import { LanguageToggle } from '@/components/language-toggle';
import { PhoenixLogo } from '@/components/phoenix-logo';
import { Stethoscope, Users, ArrowRight, Shield, Flame, Heart, Smartphone, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export function LandingClient() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 flex flex-col">
      {/* Header — compact on mobile */}
      <header className="sticky top-0 z-50 phoenix-gradient safe-area-top">
        <div className="max-w-[1200px] mx-auto px-4 py-2.5 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <PhoenixLogo className="w-8 h-8 md:w-10 md:h-10" alt="Phoenix AI Logo" />
            <span className="font-display text-lg md:text-xl font-bold text-white tracking-tight">Phoenix AI</span>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Official endorsement banner */}
      <div className="bg-gradient-to-br from-gray-50 via-white to-orange-50/30 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 py-3 md:py-4 flex justify-center">
          <div className="relative w-[180px] h-[117px] md:w-[230px] md:h-[150px]">
            <Image src="/kkm-hkl-logo.jpeg" alt="Kementerian Kesihatan Malaysia — Hospital Kuala Lumpur" fill className="object-contain" priority />
          </div>
        </div>
      </div>

      {/* Hero Section — mobile optimized */}
      <section className="relative flex-1 flex flex-col">
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative flex-1 flex flex-col justify-center max-w-[1200px] mx-auto px-4 py-10 md:py-20 text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-5 md:mb-8">
              <PhoenixLogo className="w-28 h-28 md:w-44 md:h-44 animate-spin-slow" style={{ perspective: '800px', transformStyle: 'preserve-3d' }} imageClassName="drop-shadow-lg" />
            </div>
            <h1 className="font-display text-3xl md:text-6xl font-bold tracking-tight mb-2 md:mb-4">
              <span className="phoenix-gradient-text">Phoenix AI</span>
            </h1>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto mb-1 font-medium">
              {t('landing.tagline')}
            </p>
            <p className="text-xs md:text-base text-gray-500 max-w-xl mx-auto mb-8 md:mb-12 px-2">
              {t('landing.subtitle')}
            </p>
          </motion.div>

          {/* Portal Cards — stack on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto w-full">
            {/* HCP Portal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Link href="/hcp-login" className="block group active:scale-[0.98] transition-transform">
                <div className="bg-white rounded-2xl p-5 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-[#8B0000]/20 h-full">
                  <div className="flex items-center gap-4 md:block">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-[#8B0000] to-[#C0392B] flex items-center justify-center shrink-0 md:mb-6 group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-7 h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="flex-1 text-left md:text-left">
                      <h2 className="font-display text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-3 tracking-tight">
                        {t('landing.hcp_title')}
                      </h2>
                      <p className="text-xs md:text-sm text-gray-500 leading-relaxed hidden md:block">
                        {t('landing.hcp_desc')}
                      </p>
                      <p className="text-xs text-gray-500 md:hidden">
                        {t('landing.hcp_short')}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#8B0000] md:hidden shrink-0" />
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-[#8B0000] font-semibold text-sm mt-6 group-hover:gap-3 transition-all">
                    {t('landing.enter')} <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Community Portal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Link href="/community" className="block group active:scale-[0.98] transition-transform">
                <div className="bg-white rounded-2xl p-5 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-[#0F9B8E]/20 h-full">
                  <div className="flex items-center gap-4 md:block">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-[#0F9B8E] to-[#0e8a7e] flex items-center justify-center shrink-0 md:mb-6 group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="flex-1 text-left md:text-left">
                      <h2 className="font-display text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-3 tracking-tight">
                        {t('landing.community_title')}
                      </h2>
                      <p className="text-xs md:text-sm text-gray-500 leading-relaxed hidden md:block">
                        {t('landing.community_desc')}
                      </p>
                      <p className="text-xs text-gray-500 md:hidden">
                        {t('landing.community_short')}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#0F9B8E] md:hidden shrink-0" />
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-[#0F9B8E] font-semibold text-sm mt-6 group-hover:gap-3 transition-all">
                    {t('landing.enter')} <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 md:gap-4 mt-8 md:mt-16"
          >
            {[
              { icon: Shield, label: t('landing.feature_analysis') },
              { icon: Flame, label: t('landing.feature_calculators') },
              { icon: Heart, label: t('landing.feature_education') },
            ].map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-full shadow-sm border border-gray-100 text-xs md:text-sm text-gray-600">
                <item.icon className="w-3.5 h-3.5 text-[#0F9B8E]" />
                {item?.label}
              </div>
            ))}
          </motion.div>

          {/* Install app hint on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6 md:hidden"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B0000]/5 rounded-full text-xs text-[#8B0000]">
              <Smartphone className="w-3.5 h-3.5" />
              {t('landing.install_hint')}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer — minimal on mobile */}
      <footer className="py-5 md:py-8 text-center border-t border-gray-100 px-4">
        <p className="text-xs md:text-sm font-medium text-gray-600">
          {t('landing.department')}
        </p>
        <p className="text-xs text-gray-400 mt-1">{t('landing.copyright')}</p>
      </footer>
    </div>
  );
}
