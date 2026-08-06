'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Lang, t as translate } from '@/lib/i18n';
import { trackClientEvent } from '@/lib/telemetry/client';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const t = useCallback((key: string) => translate(key, lang), [lang]);

  // Wrap setLang so every language change (from any control) is recorded.
  // Privacy-safe: only the language codes are sent, never any content.
  const setLang = useCallback((next: Lang) => {
    setLangState((current) => {
      if (next !== current) {
        trackClientEvent('language_changed', { from: current, to: next });
      }
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
