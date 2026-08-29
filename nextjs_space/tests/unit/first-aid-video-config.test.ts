import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractYouTubeVideoId,
  getFirstAidVideoEmbedUrl,
} from '../../lib/config/first-aid-video';

const VIDEO_ID = 'AbCdEf123_-';

test('extracts supported YouTube URL formats', () => {
  assert.equal(extractYouTubeVideoId(`https://www.youtube.com/watch?v=${VIDEO_ID}`), VIDEO_ID);
  assert.equal(extractYouTubeVideoId(`https://youtu.be/${VIDEO_ID}`), VIDEO_ID);
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

test('reads FIRST_AID_VIDEO_URL at call time and exposes only a normalized embed URL', () => {
  const originalVideo = process.env.FIRST_AID_VIDEO_URL;
  const originalUnrelated = process.env.DATABASE_URL;

  try {
    delete process.env.FIRST_AID_VIDEO_URL;
    process.env.DATABASE_URL = 'postgresql://must-not-be-exposed';
    assert.equal(getFirstAidVideoEmbedUrl(), null);

    process.env.FIRST_AID_VIDEO_URL = `https://youtu.be/${VIDEO_ID}`;
    const first = getFirstAidVideoEmbedUrl();
    assert.equal(
      first,
      `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=0&controls=1`,
    );
    assert.equal(first?.includes('postgresql'), false);

    process.env.FIRST_AID_VIDEO_URL = 'https://example.com/not-allowed';
    assert.equal(getFirstAidVideoEmbedUrl(), null);
  } finally {
    if (originalVideo === undefined) delete process.env.FIRST_AID_VIDEO_URL;
    else process.env.FIRST_AID_VIDEO_URL = originalVideo;
    if (originalUnrelated === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUnrelated;
  }
});
