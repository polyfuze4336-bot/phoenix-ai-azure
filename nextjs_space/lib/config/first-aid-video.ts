import {
  firstAidVideos,
  type FirstAidVideo,
  type LocalizedFirstAidVideoText,
} from './first-aid-videos';

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

function validVideoId(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  return candidate && YOUTUBE_VIDEO_ID.test(candidate) ? candidate : null;
}

export function extractYouTubeVideoId(value: string | undefined): string | null {
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;

  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be') {
    return validVideoId(url.pathname.split('/').filter(Boolean)[0]);
  }
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (url.pathname === '/watch') return validVideoId(url.searchParams.get('v'));

  const [format, id] = url.pathname.split('/').filter(Boolean);
  if (['embed', 'shorts', 'live', 'v'].includes(format)) return validVideoId(id);

  return null;
}

export interface ResolvedFirstAidVideo {
  id: string;
  videoId: string;
  embedUrl: string;
  title: LocalizedFirstAidVideoText;
  description?: LocalizedFirstAidVideoText;
  category?: LocalizedFirstAidVideoText;
  featured: boolean;
  order: number;
}

function resolveVideo(video: FirstAidVideo): ResolvedFirstAidVideo | null {
  const videoId = extractYouTubeVideoId(video.youtubeUrl);
  if (!video.enabled || !videoId) return null;

  return {
    id: video.id,
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&controls=1`,
    title: video.title,
    description: video.description,
    category: video.category,
    featured: Boolean(video.featured),
    order: video.order ?? Number.MAX_SAFE_INTEGER,
  };
}

export function resolveFirstAidVideos(
  configuredVideos: readonly FirstAidVideo[],
  runtimeUrl?: string,
): ResolvedFirstAidVideo[] {
  const videos: ResolvedFirstAidVideo[] = [];
  const seenVideoIds = new Set<string>();

  for (const video of [...configuredVideos].sort(
    (left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER),
  )) {
    const resolved = resolveVideo(video);
    if (!resolved || seenVideoIds.has(resolved.videoId)) continue;
    seenVideoIds.add(resolved.videoId);
    videos.push(resolved);
  }

  const runtimeVideoId = extractYouTubeVideoId(runtimeUrl);
  if (runtimeVideoId) {
    const existingIndex = videos.findIndex((video) => video.videoId === runtimeVideoId);
    if (existingIndex >= 0) {
      const [existing] = videos.splice(existingIndex, 1);
      videos.unshift(existing);
    } else {
      videos.unshift({
        id: 'runtime-first-aid-video',
        videoId: runtimeVideoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${runtimeVideoId}?autoplay=0&controls=1`,
        title: {
          en: 'First Aid Video',
          ms: 'Video Pertolongan Cemas',
        },
        featured: true,
        order: 0,
      });
    }
  }

  const featuredId = runtimeVideoId
    ?? videos.find((video) => video.featured)?.videoId
    ?? videos[0]?.videoId;

  return videos.map((video) => ({
    ...video,
    featured: video.videoId === featuredId,
  }));
}

export function getFirstAidVideos(): ResolvedFirstAidVideo[] {
  return resolveFirstAidVideos(firstAidVideos, process.env.FIRST_AID_VIDEO_URL);
}

export function getFirstAidVideoEmbedUrl(): string | null {
  return getFirstAidVideos().find((video) => video.featured)?.embedUrl ?? null;
}
