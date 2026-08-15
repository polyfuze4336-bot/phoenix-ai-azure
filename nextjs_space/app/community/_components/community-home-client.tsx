'use client';

import { useLanguage } from '@/components/language-provider';
import { Heart, ClipboardCheck, Camera, MessageCircle, Phone, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { localizedContent } from '@/lib/i18n/index';

const quickActions = [
  { href: '/community/first-aid', icon: Heart, labelKey: 'community.firstaid_title', descKey: 'community.firstaid_desc', color: 'from-red-500 to-red-600' },
  { href: '/community/assessment', icon: ClipboardCheck, labelKey: 'community.assessment_title', descKey: 'community.assessment_desc', color: 'from-orange-500 to-amber-500' },
  { href: '/community/image-check', icon: Camera, labelKey: 'community.imagecheck_title', descKey: 'community.imagecheck_desc', color: 'from-[#0F9B8E] to-teal-600' },
  { href: '/community/chat', icon: MessageCircle, labelKey: 'community.chat', descKey: 'community.welcome_desc', color: 'from-blue-500 to-blue-600' },
];

export function CommunityHomeClient() {
  const { t, lang } = useLanguage();
  const healthTips = localizedContent(lang).community.healthTips;

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
            <p className="text-sm opacity-90">{t('community.emergency_services')}</p>
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
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">{t('community.health_tips')}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {healthTips.map((tip, i) => (
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
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
