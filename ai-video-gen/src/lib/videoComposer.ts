import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

const FFMPEG_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';

/**
 * Fetch a remote URL with retry/backoff. Pollinations.ai often returns 429
 * when too many requests are queued; back off and retry.
 */
async function fetchFileWithRetry(url: string, attempts = 4): Promise<Uint8Array> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const data = await fetchFile(url);
      // fetchFile returns Uint8Array on success even for HTML/JSON error bodies,
      // so verify we got an image. Pollinations error responses are JSON < 4KB.
      if (data.byteLength < 4096) {
        const text = new TextDecoder().decode(data.slice(0, 200));
        if (text.includes('Too Many Requests') || text.includes('"error"')) {
          throw new Error('rate limited');
        }
      }
      return data;
    } catch (e) {
      lastErr = e;
      const wait = 1500 * Math.pow(1.6, i) + Math.random() * 500;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('failed to fetch image');
}

export async function getFFmpeg(onLog?: (msg: string) => void, onProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  const attempt = (async () => {
    const ff = new FFmpeg();
    if (onLog) ff.on('log', (e) => onLog(e.message));
    if (onProgress) ff.on('progress', (e) => onProgress(e.progress));
    await ff.load({
      coreURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegInstance = ff;
    return ff;
  })().catch((err) => {
    // Reset cached promise so a transient failure (network, CDN hiccup, etc.)
    // doesn't permanently brick the app.
    loadingPromise = null;
    throw err;
  });

  loadingPromise = attempt;
  return attempt;
}

export interface ComposeOptions {
  imageUrls: string[];
  durationSec: 5 | 10 | 15;
  width?: number;
  height?: number;
  fps?: number;
  onPhase?: (phase: string) => void;
  onProgress?: (ratio: number) => void;
}

/**
 * Compose a single MP4 from a sequence of images.
 *
 * Strategy:
 * - For each image, render it as a video clip with Ken Burns (zoompan) motion
 *   covering its allotted slot length.
 * - Cross-fade between consecutive clips using xfade.
 * - Pad/scale to the target resolution.
 *
 * Total output duration = durationSec exactly.
 */
export async function composeVideo(opts: ComposeOptions): Promise<Blob> {
  const {
    imageUrls,
    durationSec,
    width = 1280,
    height = 720,
    fps = 24,
    onPhase,
    onProgress,
  } = opts;

  if (imageUrls.length < 2) {
    throw new Error('Need at least 2 images to compose a video');
  }

  const ff = await getFFmpeg(undefined, onProgress);
  const n = imageUrls.length;
  const xfade = 0.6; // crossfade length per transition (seconds)

  // perClip * n - xfade * (n - 1) = durationSec
  const perClip = (durationSec + xfade * (n - 1)) / n;
  const slotFrames = Math.round(perClip * fps);

  onPhase?.('downloading frames');
  // Pollinations rate-limits to 1 concurrent per IP, so fetch sequentially.
  for (let i = 0; i < n; i++) {
    const data = await fetchFileWithRetry(imageUrls[i]);
    await ff.writeFile(`in${i}.jpg`, data);
  }

  onPhase?.('rendering clips');
  // Render each image to an MP4 clip with a Ken Burns zoompan motion.
  // Alternate zoom-in / zoom-out so transitions feel varied.
  for (let i = 0; i < n; i++) {
    const zoomIn = i % 2 === 0;
    // zoompan input is a single image; produce 'slotFrames' frames at fps.
    // Smooth zoom from 1.0 -> 1.15 (or reverse). x/y center the frame.
    const zoomExpr = zoomIn
      ? `min(zoom+0.0008,1.15)`
      : `if(lte(zoom,1.0),1.15,max(1.001,zoom-0.0008))`;

    const filter =
      `scale=${width * 2}:${height * 2}:force_original_aspect_ratio=increase,` +
      `crop=${width * 2}:${height * 2},` +
      `zoompan=z='${zoomExpr}':d=${slotFrames}:s=${width}x${height}:fps=${fps}:` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',` +
      `format=yuv420p`;

    await ff.exec([
      '-y',
      '-loop', '1',
      '-i', `in${i}.jpg`,
      '-t', String(perClip),
      '-r', String(fps),
      '-vf', filter,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'ultrafast',
      '-crf', '23',
      `clip${i}.mp4`,
    ]);
  }

  onPhase?.('joining clips');
  // Build an xfade chain across all clips.
  // ffmpeg xfade requires offsets relative to the start of the *first* input,
  // and produces a single stream. We stitch sequentially using -filter_complex.
  const inputs: string[] = [];
  for (let i = 0; i < n; i++) {
    inputs.push('-i', `clip${i}.mp4`);
  }

  let filterComplex = '';
  let prevLabel = '[0:v]';
  let cumulative = 0;
  for (let i = 1; i < n; i++) {
    cumulative += perClip - xfade;
    const out = i === n - 1 ? '[v]' : `[v${i}]`;
    filterComplex +=
      `${prevLabel}[${i}:v]xfade=transition=fade:duration=${xfade}:offset=${cumulative.toFixed(3)}${out};`;
    prevLabel = out;
  }
  // Strip trailing semicolon
  filterComplex = filterComplex.replace(/;$/, '');

  await ff.exec([
    '-y',
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[v]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-crf', '22',
    '-r', String(fps),
    '-movflags', '+faststart',
    'out.mp4',
  ]);

  onPhase?.('finalizing');
  const data = await ff.readFile('out.mp4');
  const buf = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
  // Cleanup intermediate files (best-effort)
  for (let i = 0; i < n; i++) {
    try { await ff.deleteFile(`in${i}.jpg`); } catch { /* ignore */ }
    try { await ff.deleteFile(`clip${i}.mp4`); } catch { /* ignore */ }
  }
  try { await ff.deleteFile('out.mp4'); } catch { /* ignore */ }

  return new Blob([buf as BlobPart], { type: 'video/mp4' });
}
