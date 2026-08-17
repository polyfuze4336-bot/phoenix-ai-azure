'use client';

import { AlertTriangle, Database, LockKeyhole, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';

type NoticeVariant = 'decision-support' | 'confidentiality' | 'personal-data' | 'ai-disclaimer';

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
  'ai-disclaimer': {
    title: 'chat.community_disclaimer_title',
    body: 'chat.community_disclaimer_body',
    label: 'chat.community_disclaimer_title',
    Icon: Sparkles,
    style: 'border-gray-200 bg-gray-50 text-gray-700',
    iconStyle: 'text-[#0F9B8E]',
  },
} as const;

export function ClinicalAiNotice({
  className,
  variant = 'decision-support',
  'data-testid': dataTestId,
}: {
  className?: string;
  variant?: NoticeVariant;
  'data-testid'?: string;
}) {
  const { t } = useLanguage();
  const config = NOTICE_CONFIG[variant];
  const Icon = config.Icon;

  return (
    <div
      className={cn('rounded-lg border px-3 py-2.5', config.style, className)}
      role="note"
      aria-label={t('label' in config ? config.label : 'clinical_notice.label')}
      data-testid={dataTestId}
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