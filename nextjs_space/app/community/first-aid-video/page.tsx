import { getFirstAidVideos } from '@/lib/config/first-aid-video';
import { FirstAidVideoClient } from './_components/first-aid-video-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function FirstAidVideoPage() {
  return <FirstAidVideoClient videos={getFirstAidVideos()} />;
}
