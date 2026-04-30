/**
 * Resolves a user query (URL or search text) into one or more playable Tracks.
 * Uses @distube/ytdl-core for YouTube watch URLs and play-dl for searches /
 * other providers. Returns objects with { title, url, duration, thumbnail,
 * requesterId }.
 */
import play from 'play-dl';
import ytdl from '@distube/ytdl-core';

const YT_WATCH_RE = /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i;
const SC_RE = /^https?:\/\/(www\.|m\.)?soundcloud\.com\//i;

export async function resolveQuery(query, requesterId) {
  const q = (query ?? '').trim();
  if (!q) throw new Error('empty query');

  // YouTube watch URL → use ytdl-core for richer metadata
  if (YT_WATCH_RE.test(q)) {
    try {
      const info = await ytdl.getInfo(q);
      const v = info.videoDetails;
      return [
        {
          title: v.title ?? 'Unknown',
          url: v.video_url ?? q,
          duration: parseInt(v.lengthSeconds ?? '0', 10) || null,
          thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url ?? null,
          provider: 'youtube',
          requesterId,
        },
      ];
    } catch (err) {
      // fall through to play-dl below
      console.warn('ytdl getInfo failed, falling back to play-dl:', err.message);
    }
  }

  // SoundCloud or YouTube via play-dl
  if (SC_RE.test(q) || YT_WATCH_RE.test(q)) {
    const info = await play.video_info(q).catch(() => null) ?? await play.soundcloud(q).catch(() => null);
    if (info?.video_details) {
      const v = info.video_details;
      return [
        {
          title: v.title ?? 'Unknown',
          url: v.url ?? q,
          duration: v.durationInSec ?? null,
          thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url ?? null,
          provider: 'youtube',
          requesterId,
        },
      ];
    }
    if (info && info.name) {
      return [
        {
          title: info.name,
          url: info.url ?? q,
          duration: Math.round((info.durationInMs ?? 0) / 1000) || null,
          thumbnail: info.thumbnail ?? null,
          provider: 'soundcloud',
          requesterId,
        },
      ];
    }
  }

  // Plain text search → first YouTube result via play-dl
  const results = await play.search(q, { source: { youtube: 'video' }, limit: 1 });
  if (!results || !results.length) {
    throw new Error('No results found for query');
  }
  const r = results[0];
  return [
    {
      title: r.title ?? 'Unknown',
      url: r.url,
      duration: r.durationInSec ?? null,
      thumbnail: r.thumbnails?.[r.thumbnails.length - 1]?.url ?? null,
      provider: 'youtube',
      requesterId,
    },
  ];
}

/**
 * Open a fresh audio stream for the given track and pipe it through
 * @discordjs/voice's player. Returns a readable stream of webm/opus or
 * arbitrary audio that ffmpeg will normalise downstream.
 */
export async function openTrackStream(track) {
  if (track.provider === 'youtube') {
    // ytdl-core returns a Node Readable of webm/opus or m4a depending on
    // chosen format. We pick highest-bitrate audio-only and let
    // @discordjs/voice / ffmpeg handle re-encoding.
    return ytdl(track.url, {
      quality: 'highestaudio',
      filter: 'audioonly',
      highWaterMark: 1 << 25, // 32 MB buffer to avoid stutter
    });
  }
  if (track.provider === 'soundcloud') {
    const res = await play.stream(track.url, { quality: 1 });
    return res.stream;
  }
  // last-resort fallback — try play-dl's auto detection
  const res = await play.stream(track.url, { quality: 1 });
  return res.stream;
}
