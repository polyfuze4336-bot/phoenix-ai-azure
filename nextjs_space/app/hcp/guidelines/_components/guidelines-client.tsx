'use client';

import { useLanguage } from '@/components/language-provider';
import { localizedContent, type GuidelineResource } from '@/lib/i18n/index';
import { Search, Flame, Droplets, Bug, Package, Scissors, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

const categoryIcons: Record<string, any> = {
  burn_care: Flame,
  wound_care: Droplets,
  infection: Bug,
  dressing: Package,
  surgical: Scissors,
};

export function GuidelinesClient() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const content = localizedContent(lang).hcp.guidelines;

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return content.items.filter((guideline) => {
      const matchesCategory = category === 'all' || guideline.category === category;
      const matchesSearch = !query || guideline.title.toLowerCase().includes(query) || guideline.summary.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, content.items, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('guidelines.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('guidelines.subtitle')}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('guidelines.search')}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(content.filters).map(([key, label]) => {
          const Icon = categoryIcons[key];
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === key ? 'bg-[#8B0000] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((guideline: GuidelineResource) => {
          const isOpen = expanded === guideline.id;
          return (
            <motion.div key={guideline.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : guideline.id)} className="w-full px-5 py-4 flex items-center justify-between text-left">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{guideline.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{guideline.summary}</p>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                      <ol className="space-y-2">
                        {guideline.steps.map((step, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#8B0000]/10 text-[#8B0000] text-xs font-semibold shrink-0">{index + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                      {guideline.references.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-50">
                          <p className="text-xs font-semibold text-gray-400 mb-1">{content.referencesLabel}</p>
                          {guideline.references.map((reference, index) => <p key={index} className="text-xs text-gray-400">• {reference}</p>)}
                        </div>
                      )}
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
