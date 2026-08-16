'use client';

import { AlertTriangle, Database, LockKeyhole } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';

type NoticeVariant = 'decision-support' | 'confidentiality' | 'personal-data';

const NOTICE_CONFIG = {
  'decision-support': {
    title: 'clinical_notice.decision_title',
    body: 'clinical_notice.decision_body',
    Icon: AlertTriangle,
    style: 'border-amber-200 bg-amber-50 text-amber-950',
    iconStyle: 'text-amber-600',
  },
  confidentiality: {
    title: 'clinical_notice.confidentiality_title',
    body: 'clinical_notice.confidentiality_body',
    Icon: LockKeyhole,
    style: 'border-gray-200 bg-white text-gray-700',
    iconStyle: 'text-[#0F9B8E]',
  },
  'personal-data': {
    title: 'clinical_notice.personal_data_title',
    body: 'clinical_notice.personal_data_body',
    Icon: Database,
    style: 'border-gray-200 bg-gray-50 text-gray-700',
    iconStyle: 'text-[#8B0000]',
  },
} as const;

export function ClinicalAiNotice({
  className,
  variant = 'decision-support',
}: {
  className?: string;
  variant?: NoticeVariant;
}) {
  const { t } = useLanguage();
  const config = NOTICE_CONFIG[variant];
  const Icon = config.Icon;

  return (
    <div
      className={cn('rounded-lg border px-3 py-2.5', config.style, className)}
      role="note"
      aria-label={t('clinical_notice.label')}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconStyle)} aria-hidden="true" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold">{t(config.title)}</p>
          <p className="mt-0.5">{t(config.body)}</p>
        </div>
      </div>
    </div>
  );
}