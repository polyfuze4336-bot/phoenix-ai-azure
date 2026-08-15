'use client';

import { useLanguage } from '@/components/language-provider';
import { Flame, Shield, Apple, Bug, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { localizedContent, type ArticleResource } from '@/lib/i18n/index';

const articleIcons: Record<string, any> = {
  '1': Shield,
  '2': Heart,
  '3': Apple,
  '4': Bug,
  '5': Flame,
};

export function ArticlesClient() {
  const { t, lang } = useLanguage();
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const articles = localizedContent(lang).community.articles;

  const filtered = useMemo(() => {
    if (category === 'all') return articles.items;
    return articles.items.filter((article) => article.category === category);
  }, [articles.items, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('community.articles_title')}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(articles.filters).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              category === key ? 'bg-[#0F9B8E] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((article: ArticleResource, i: number) => {
          const isOpen = expanded === article?.id;
          const Icon = articleIcons[article.id] ?? Shield;
          return (
            <motion.div key={article?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : article?.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-[#0F9B8E]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#0F9B8E]" />
                  </div>
                  <h3 className="flex-1 text-sm font-semibold text-gray-900">{article.title}</h3>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{article.content}</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
