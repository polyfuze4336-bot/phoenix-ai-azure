'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  APP_LANGUAGE_STORAGE_KEY,
  type AppLanguage,
  normalizeLanguage,
  t as translate,
} from '@/lib/i18n';
import { trackClientEvent } from '@/lib/telemetry/client';

interface LanguageContextType {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>('en');
  const [hydrated, setHydrated] = useState(false);
  const t = useCallback((key: string) => translate(key, lang), [lang]);

  useEffect(() => {
    const storedLanguage = normalizeLanguage(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY));
    setLangState(storedLanguage);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [hydrated, lang]);

  // Wrap setLang so every language change (from any control) is recorded.
  // Privacy-safe: only the language codes are sent, never any content.
  const setLang = useCallback((next: AppLanguage) => {
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
