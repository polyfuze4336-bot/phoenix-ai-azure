export interface LocalizedFirstAidVideoText {
  en: string;
  ms: string;
}

export interface FirstAidVideo {
  id: string;
  youtubeUrl: string;
  title: LocalizedFirstAidVideoText;
  description?: LocalizedFirstAidVideoText;
  category?: LocalizedFirstAidVideoText;
  enabled: boolean;
  featured?: boolean;
  order?: number;
}

export const firstAidVideos: FirstAidVideo[] = [
  {
    id: 'burn-first-aid-001',
    youtubeUrl: 'https://youtu.be/qcADGBwSgC8',
    title: {
      en: 'First Aid Video',
      ms: 'Video Pertolongan Cemas',
    },
    description: {
      en: 'Educational first aid guidance for burn injuries.',
      ms: 'Panduan pendidikan pertolongan cemas untuk kecederaan melecur.',
    },
    enabled: true,
    featured: true,
    order: 1,
  },
];