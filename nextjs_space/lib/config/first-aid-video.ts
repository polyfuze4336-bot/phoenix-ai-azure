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

export function getFirstAidVideoEmbedUrl(): string | null {
  const videoId = extractYouTubeVideoId(process.env.FIRST_AID_VIDEO_URL);
  return videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&controls=1`
    : null;
}
