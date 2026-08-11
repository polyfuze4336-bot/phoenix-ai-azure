'use client';

import { useLanguage } from '@/components/language-provider';
import { Heart, ClipboardCheck, MessageCircle, Phone, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const quickActions = [
  { href: '/community/first-aid', icon: Heart, labelKey: 'community.firstaid_title', descKey: 'community.firstaid_desc', color: 'from-red-500 to-red-600' },
  { href: '/community/assessment', icon: ClipboardCheck, labelKey: 'community.assessment_title', descKey: 'community.assessment_desc', color: 'from-orange-500 to-amber-500' },
  { href: '/community/chat', icon: MessageCircle, labelKey: 'community.chat', descKey: 'community.welcome_desc', color: 'from-blue-500 to-blue-600' },
];

const healthTips = [
  { en: 'Cool burns immediately under running water for 20 minutes', bm: 'Sejukkan kelecuran segera di bawah air mengalir selama 20 minit' },
  { en: 'Never apply toothpaste, butter, or ice to burns', bm: 'Jangan sapukan ubat gigi, mentega, atau ais pada kelecuran' },
  { en: 'Keep wounds clean and covered to prevent infection', bm: 'Pastikan luka bersih dan ditutup untuk mencegah jangkitan' },
  { en: 'Seek medical help for burns larger than your palm', bm: 'Dapatkan bantuan perubatan untuk kelecuran lebih besar daripada tapak tangan' },
];

export function CommunityHomeClient() {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('community.welcome')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('community.welcome_desc')}</p>
      </div>

      {/* Emergency Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-5 text-white flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8" />
          <div>
            <p className="font-bold text-lg">{t('community.emergency')}</p>
            <p className="text-sm opacity-90">Bomba & Ambulans / Fire & Ambulance</p>
          </div>
        </div>
        <a href="tel:999" className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 rounded-lg font-bold text-lg hover:bg-red-50 transition-colors">
          <Phone className="w-5 h-5" /> 999
        </a>
      </motion.div>

      {/* Quick Action Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {quickActions?.map((action: any, i: number) => (
          <motion.div key={action?.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link href={action?.href} className="block group">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action?.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-base font-semibold text-gray-900 mb-1">{t(action?.labelKey)}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{t(action?.descKey)}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Health Tips */}
      <div>
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Health Tips / Tips Kesihatan</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {healthTips?.map((tip: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0F9B8E]/10 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-[#0F9B8E]" />
                </div>
                <p className="text-sm text-gray-700">{lang === 'en' ? tip?.en : tip?.bm}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
