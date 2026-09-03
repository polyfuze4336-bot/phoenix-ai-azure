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
  nextStep: string;
}

export interface FirstAidGuideResource {
  id: string;
  title: string;
  dos: string[];
  donts: string[];
  steps: string[];
}

export interface FirstAidVideoPointResource {
  strong: string;
  text: string;
  secondaryStrong?: string;
  suffix?: string;
}

export interface PreventionSectionResource {
  title: string;
  points: string[];
}

export interface PreventionCategoryResource {
  id: string;
  title: string;
  points?: string[];
  sections?: PreventionSectionResource[];
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
      nextStepLabel: string;
      callEmergency: string;
      questions: AssessmentQuestionResource[];
      results: Record<'minor' | 'moderate' | 'emergency', AssessmentResultResource>;
    };
    firstAid: {
      stepsLabel: string;
      guides: FirstAidGuideResource[];
    };
    firstAidVideo: {
      title: string;
      introduction: string;
      iframeTitle: string;
      unavailable: string;
      featuredHeading: string;
      moreVideosHeading: string;
      watchVideo: string;
      keyPointsHeading: string;
      keyPoints: FirstAidVideoPointResource[];
      misconceptions: string;
      reminder: string;
      disclaimer: string;
    };
    burnPrevention: {
      title: string;
      introduction: string;
      categories: PreventionCategoryResource[];
      callout: {
        heading: string;
        text: string;
        button: string;
      };
      disclaimer: string;
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
