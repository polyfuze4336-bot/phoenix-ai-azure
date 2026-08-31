import { getVideoStudioConfig } from '@/lib/config/video-studio';
import { getFirstAidVideoEmbedUrl } from '@/lib/config/first-aid-video';
import { VideoStudioClient } from './_components/video-studio-client';

export const dynamic = 'force-dynamic';

export default function VideoStudioPage() {
  const config = getVideoStudioConfig();
  const currentEmbedUrl = getFirstAidVideoEmbedUrl();
  return (
    <VideoStudioClient
      currentEmbedUrl={currentEmbedUrl}
      currentVideoUrl={config.firstAidVideoUrl}
      soraEnabled={config.enabled}
      soraModelDeployment={config.modelDeployment}
    />
  );
}
