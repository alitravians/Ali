/**
 * Resolves a user query (URL or search text) into one or more playable Tracks
 * and opens streams for them.
 *
 * Sources, in order of preference:
 *   1. Direct HTTPS audio file URLs (.mp3, .m4a, .opus, .webm, .ogg, .flac,
 *      .wav, .aac) — passed straight to ffmpeg.
 *   2. SoundCloud — uses play-dl with a self-fetched anonymous client_id.
 *   3. YouTube — uses youtubei.js (the maintained successor to ytdl-core /
 *      play-dl, both of which are now deprecated/archived).
 *
 * NOTE: YouTube has rolled out aggressive anti-bot enforcement in 2026 and
 * frequently rejects anonymous requests with "Sign in to confirm you're not a
 * bot" / "Video is login required". We try every Innertube client (web ➜
 * web_embedded ➜ tv_embedded ➜ ios ➜ android) and surface a clear error if
 * none work, so the failure mode is visible instead of silent.
 */
import { Innertube, UniversalCache } from 'youtubei.js';
import { Readable } from 'node:stream';
import play from 'play-dl';

const YT_WATCH_RE = /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i;
const SC_RE = /^https?:\/\/(www\.|m\.)?soundcloud\.com\//i;
const DIRECT_AUDIO_RE = /\.(mp3|m4a|aac|opus|ogg|oga|webm|flac|wav)(\?.*)?$/i;

let _yt = null;
let _scInited = false;

async function getInnertube() {
  if (_yt) return _yt;
  _yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
  return _yt;
}

async function ensureSoundCloud() {
  if (_scInited) return;
  try {
    const cid = await play.getFreeClientID();
    await play.setToken({ soundcloud: { client_id: cid } });
    console.log('[resolver] play-dl SoundCloud client_id initialised');
  } catch (err) {
    console.warn('[resolver] play-dl SoundCloud init failed:', err?.message);
  } finally {
    _scInited = true;
  }
}

/**
 * Best-effort YouTube info lookup using youtubei.js. Returns null if every
 * Innertube client refuses (typically LOGIN_REQUIRED).
 */
async function ytInfo(videoId) {
  const yt = await getInnertube();
  for (const client of ['WEB', 'WEB_EMBEDDED', 'TV_EMBEDDED', 'IOS', 'ANDROID', 'MWEB']) {
    try {
      const info = await yt.getBasicInfo(videoId, client);
      // basic_info is sometimes present even when playability is restricted; we
      // only consider it usable if there's a playable title.
      if (info?.basic_info?.title) return { info, client };
    } catch (err) {
      // try the next client
    }
  }
  return null;
}

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
    if (u.searchParams.has('v')) return u.searchParams.get('v');
    const m = u.pathname.match(/\/(shorts|embed)\/([\w-]{6,})/);
    if (m) return m[2];
  } catch {}
  return null;
}

function titleFromUrl(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop() || u.hostname;
    return decodeURIComponent(last.replace(/\.[a-z0-9]+$/i, ''));
  } catch {
    return 'Audio';
  }
}

export async function resolveQuery(query, requesterId) {
  const q = (query ?? '').trim();
  if (!q) throw new Error('empty query');

  // Direct audio file URL
  if (/^https?:\/\//i.test(q) && DIRECT_AUDIO_RE.test(q)) {
    return [{
      title: titleFromUrl(q),
      url: q,
      duration: null,
      thumbnail: null,
      provider: 'direct',
      requesterId,
    }];
  }

  // SoundCloud URL
  if (SC_RE.test(q)) {
    await ensureSoundCloud();
    const info = await play.soundcloud(q).catch(() => null);
    if (info && info.name) {
      // Always keep the user-provided permalink as the canonical url; play-dl
      // sometimes returns api.soundcloud.com/tracks/<id> which doesn't work
      // for play.stream().
      return [{
        title: info.name,
        url: q,
        duration: Math.round((info.durationInMs ?? 0) / 1000) || null,
        thumbnail: info.thumbnail ?? null,
        provider: 'soundcloud',
        requesterId,
      }];
    }
    throw new Error('تعذّر قراءة معلومات رابط SoundCloud');
  }

  // YouTube watch URL → youtubei.js
  if (YT_WATCH_RE.test(q)) {
    const videoId = extractVideoId(q);
    if (!videoId) throw new Error('Invalid YouTube URL');
    const result = await ytInfo(videoId);
    if (!result) {
      throw new Error('YouTube blocked the request (login required) — جرّب رابط SoundCloud أو رفع ملف MP3 مباشر');
    }
    const v = result.info.basic_info;
    return [{
      title: v.title ?? 'Unknown',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      ytClient: result.client,
      duration: v.duration ?? null,
      thumbnail: v.thumbnail?.[0]?.url ?? null,
      provider: 'youtube',
      requesterId,
    }];
  }

  // Plain text search — try YouTube first via youtubei.js
  try {
    const yt = await getInnertube();
    const search = await yt.search(q, { type: 'video' });
    const first = search?.videos?.[0];
    if (first?.id) {
      return [{
        title: first.title?.text ?? first.title ?? 'Unknown',
        url: `https://www.youtube.com/watch?v=${first.id}`,
        videoId: first.id,
        duration: typeof first.duration?.seconds === 'number' ? first.duration.seconds : null,
        thumbnail: first.best_thumbnail?.url ?? first.thumbnails?.[0]?.url ?? null,
        provider: 'youtube',
        requesterId,
      }];
    }
  } catch (err) {
    console.warn('youtubei search failed:', err?.message);
  }

  throw new Error('لم يُعثر على نتائج للبحث — جرّب رابط SoundCloud أو رابط مباشر لملف MP3');
}

/**
 * Open a fresh audio stream for a Track. Returns a Node Readable that ffmpeg
 * (via @discordjs/voice's createAudioResource) can decode.
 */
export async function openTrackStream(track) {
  if (track.provider === 'direct') {
    // Let ffmpeg fetch HTTPS itself — pass the URL through as a string path.
    // createAudioResource accepts a string; ffmpeg will demux the remote file.
    return track.url;
  }

  if (track.provider === 'soundcloud') {
    await ensureSoundCloud();
    const res = await play.stream(track.url, { quality: 1 });
    return res.stream;
  }

  if (track.provider === 'youtube') {
    const yt = await getInnertube();
    const videoId = track.videoId ?? extractVideoId(track.url);
    if (!videoId) throw new Error('Invalid YouTube URL');
    let lastErr = null;
    const clients = track.ytClient
      ? [track.ytClient, 'WEB', 'WEB_EMBEDDED', 'TV_EMBEDDED', 'IOS', 'ANDROID', 'MWEB']
      : ['WEB', 'WEB_EMBEDDED', 'TV_EMBEDDED', 'IOS', 'ANDROID', 'MWEB'];
    for (const client of clients) {
      try {
        const webStream = await yt.download(videoId, {
          type: 'audio',
          quality: 'best',
          format: 'any',
          client,
        });
        return Readable.fromWeb(webStream);
      } catch (err) {
        lastErr = err;
      }
    }
    throw new Error(
      `YouTube refused the download (${lastErr?.info?.error_type || lastErr?.message || 'unknown'}). ` +
      'جرّب رابط SoundCloud أو رابط مباشر لملف MP3.',
    );
  }

  throw new Error(`unknown provider: ${track.provider}`);
}
