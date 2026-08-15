import type { AppLanguage } from '../i18n';
import { en } from './en';
import { ms } from './ms';

export interface ArticleResource {
  id: string;
  category: string;
  title: string;
  content: string;
}

export interface AssessmentQuestionResource {
  id: number;
  text: string;
  options: { label: string; score: number }[];
}

export interface AssessmentResultResource {
  title: string;
  description: string;
}

export interface FirstAidGuideResource {
  id: string;
  title: string;
  dos: string[];
  donts: string[];
  steps: string[];
}

export interface GuidelineResource {
  id: string;
  category: string;
  title: string;
  summary: string;
  steps: string[];
  references: string[];
}

export interface LocalizedContent {
  community: {
    healthTips: string[];
    chatQuickPrompts: string[];
    articles: {
      filters: Record<string, string>;
      items: ArticleResource[];
    };
    assessment: {
      disclaimer: string;
      questionLabel: string;
      callEmergency: string;
      questions: AssessmentQuestionResource[];
      results: Record<'minor' | 'moderate' | 'emergency', AssessmentResultResource>;
    };
    firstAid: {
      stepsLabel: string;
      guides: FirstAidGuideResource[];
    };
  };
  hcp: {
    chatQuickPrompts: string[];
    guidelines: {
      referencesLabel: string;
      filters: Record<string, string>;
      items: GuidelineResource[];
    };
  };
}

export const contentResources: Record<AppLanguage, LocalizedContent> = { en, ms };

export function localizedContent(language: AppLanguage): LocalizedContent {
  return contentResources[language];
}
