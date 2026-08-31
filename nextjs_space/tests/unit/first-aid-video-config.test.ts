import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractYouTubeVideoId,
  getFirstAidVideoEmbedUrl,
  getFirstAidVideos,
  resolveFirstAidVideos,
} from '../../lib/config/first-aid-video';
import type { FirstAidVideo } from '../../lib/config/first-aid-videos';

const VIDEO_ID = 'AbCdEf123_-';
const REQUIRED_VIDEO_ID = 'qcADGBwSgC8';

test('extracts supported YouTube URL formats', () => {
  assert.equal(extractYouTubeVideoId(`https://youtu.be/${REQUIRED_VIDEO_ID}`), REQUIRED_VIDEO_ID);
  assert.equal(
    extractYouTubeVideoId(`https://youtube.com/watch?v=${REQUIRED_VIDEO_ID}`),
    REQUIRED_VIDEO_ID,
  );
  assert.equal(extractYouTubeVideoId(`https://www.youtube.com/watch?v=${VIDEO_ID}`), VIDEO_ID);
  assert.equal(extractYouTubeVideoId(`https://youtu.be/${VIDEO_ID}`), VIDEO_ID);
  assert.equal(extractYouTubeVideoId(`https://www.youtube.com/shorts/${VIDEO_ID}`), VIDEO_ID);
  assert.equal(extractYouTubeVideoId(`https://m.youtube.com/shorts/${VIDEO_ID}`), VIDEO_ID);
  assert.equal(
    extractYouTubeVideoId(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`),
    VIDEO_ID,
  );
});

test('rejects invalid IDs, protocols, ports, credentials, and arbitrary hosts', () => {
  assert.equal(extractYouTubeVideoId('https://example.com/watch?v=AbCdEf123_-'), null);
  assert.equal(extractYouTubeVideoId('https://youtube.com.evil.test/watch?v=AbCdEf123_-'), null);
  assert.equal(extractYouTubeVideoId('http://www.youtube.com/watch?v=AbCdEf123_-'), null);
  assert.equal(extractYouTubeVideoId('https://www.youtube.com:444/watch?v=AbCdEf123_-'), null);
  assert.equal(extractYouTubeVideoId('https://user@www.youtube.com/watch?v=AbCdEf123_-'), null);
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch?v=too-short'), null);
  assert.equal(extractYouTubeVideoId(undefined), null);
});

test('uses the configured video by default and reads FIRST_AID_VIDEO_URL as a featured override', () => {
  const originalVideo = process.env.FIRST_AID_VIDEO_URL;
  const originalUnrelated = process.env.DATABASE_URL;

  try {
    delete process.env.FIRST_AID_VIDEO_URL;
    process.env.DATABASE_URL = 'postgresql://must-not-be-exposed';
    assert.equal(
      getFirstAidVideoEmbedUrl(),
      `https://www.youtube-nocookie.com/embed/${REQUIRED_VIDEO_ID}?autoplay=0&controls=1`,
    );

    process.env.FIRST_AID_VIDEO_URL = `https://youtu.be/${VIDEO_ID}`;
    const first = getFirstAidVideoEmbedUrl();
    assert.equal(
      first,
      `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=0&controls=1`,
    );
    assert.equal(first?.includes('postgresql'), false);

    process.env.FIRST_AID_VIDEO_URL = 'https://example.com/not-allowed';
    assert.equal(
      getFirstAidVideoEmbedUrl(),
      `https://www.youtube-nocookie.com/embed/${REQUIRED_VIDEO_ID}?autoplay=0&controls=1`,
    );
  } finally {
    if (originalVideo === undefined) delete process.env.FIRST_AID_VIDEO_URL;
    else process.env.FIRST_AID_VIDEO_URL = originalVideo;
    if (originalUnrelated === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUnrelated;
  }
});

test('deduplicates a matching runtime override', () => {
  const videos = resolveFirstAidVideos(
    [
      {
        id: 'configured',
        youtubeUrl: `https://youtu.be/${REQUIRED_VIDEO_ID}`,
        title: { en: 'First Aid Video', ms: 'Video Pertolongan Cemas' },
        enabled: true,
      },
    ],
    `https://www.youtube.com/watch?v=${REQUIRED_VIDEO_ID}`,
  );

  assert.equal(videos.length, 1);
  assert.equal(videos[0].featured, true);
});

test('resolves two enabled fixtures and allows the second video to become active', () => {
  const fixtures: FirstAidVideo[] = [
    {
      id: 'first',
      youtubeUrl: `https://youtu.be/${REQUIRED_VIDEO_ID}`,
      title: { en: 'First Aid Video', ms: 'Video Pertolongan Cemas' },
      enabled: true,
      featured: true,
      order: 1,
    },
    {
      id: 'second',
      youtubeUrl: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
      title: { en: 'Additional Video', ms: 'Video Tambahan' },
      enabled: true,
      order: 2,
    },
  ];

  const videos = resolveFirstAidVideos(fixtures);
  assert.equal(videos.length, 2);
  assert.equal(videos[0].featured, true);
  assert.equal(videos.find((video) => video.id === 'second')?.videoId, VIDEO_ID);
  assert.notEqual(videos[0].embedUrl, videos[1].embedUrl);
});

test('the default library contains one enabled featured video', () => {
  const originalVideo = process.env.FIRST_AID_VIDEO_URL;
  try {
    delete process.env.FIRST_AID_VIDEO_URL;
    const videos = getFirstAidVideos();
    assert.equal(videos.length, 1);
    assert.equal(videos[0].videoId, REQUIRED_VIDEO_ID);
    assert.equal(videos[0].featured, true);
  } finally {
    if (originalVideo === undefined) delete process.env.FIRST_AID_VIDEO_URL;
    else process.env.FIRST_AID_VIDEO_URL = originalVideo;
  }
});
