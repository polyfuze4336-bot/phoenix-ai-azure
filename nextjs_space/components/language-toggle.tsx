'use client';

import { useLanguage } from './language-provider';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  const nextLanguage = lang === 'en' ? 'ms' : 'en';

  return (
    <button
      onClick={() => setLang(nextLanguage)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all"
      aria-label={t(`language.switch_to_${nextLanguage}`)}
    >
      <Globe className="w-4 h-4" />
      <span>{nextLanguage === 'ms' ? 'BM' : 'EN'}</span>
    </button>
  );
}

export function LanguageToggleDark() {
  const { lang, setLang, t } = useLanguage();
  const nextLanguage = lang === 'en' ? 'ms' : 'en';

  return (
    <button
      onClick={() => setLang(nextLanguage)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-sm"
      aria-label={t(`language.switch_to_${nextLanguage}`)}
    >
      <Globe className="w-4 h-4" />
      <span>{nextLanguage === 'ms' ? 'BM' : 'EN'}</span>
    </button>
  );
}
