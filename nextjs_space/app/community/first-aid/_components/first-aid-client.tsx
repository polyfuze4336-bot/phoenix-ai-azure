'use client';

import { useLanguage } from '@/components/language-provider';
import { localizedContent, type FirstAidGuideResource } from '@/lib/i18n/index';
import { Flame, Droplets, Zap, FlaskConical, Sun, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const guideIcons: Record<string, any> = {
  burn: Flame,
  wound: Droplets,
  chemical: FlaskConical,
  electrical: Zap,
  sunburn: Sun,
};

export function FirstAidClient() {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>('burn');
  const content = localizedContent(lang).community.firstAid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('community.firstaid_title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('community.firstaid_desc')}</p>
      </div>

      <div className="space-y-4">
        {content.guides.map((guide: FirstAidGuideResource) => {
          const isOpen = expanded === guide.id;
          const Icon = guideIcons[guide.id] ?? Flame;
          return (
            <motion.div key={guide.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : guide.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-[#8B0000]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#8B0000]" />
                </div>
                <h3 className="flex-1 text-sm font-semibold text-gray-900">{guide.title}</h3>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-5">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">{content.stepsLabel}</h4>
                        <div className="space-y-2">
                          {guide.steps.map((step, index) => <p key={index} className="text-sm text-gray-700 pl-1">{step}</p>)}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-green-700 mb-3">
                            <CheckCircle2 className="w-4 h-4" /> {t('community.do')}
                          </h4>
                          <ul className="space-y-2">
                            {guide.dos.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-green-800">
                                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-red-700 mb-3">
                            <XCircle className="w-4 h-4" /> {t('community.dont')}
                          </h4>
                          <ul className="space-y-2">
                            {guide.donts.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-red-800">
                                <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
