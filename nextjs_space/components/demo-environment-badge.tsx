'use client';

import { useLanguage } from '@/components/language-provider';

export function DemoEnvironmentBadge() {
  const { t } = useLanguage();
  return (
    <span className="hidden sm:inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold uppercase text-gray-500">
      {t('hcp.demo_environment')}
    </span>
  );
}