'use client';

import { useCallback, useEffect, useState } from 'react';
import SplashLoader from '@/components/SplashLoader';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromptForm from '@/components/PromptForm';
import StartingFrameUpload from '@/components/StartingFrameUpload';
import StoryboardEditor from '@/components/StoryboardEditor';
import ProgressView from '@/components/ProgressView';
import VideoResult from '@/components/VideoResult';
import Gallery from '@/components/Gallery';
import { DEFAULT_STYLE, VIDEO_STYLES } from '@/lib/styles';
import type { Duration, FrameData, GeneratedVideo, StoryboardFrame } from '@/lib/types';
import { composeVideo } from '@/lib/videoComposer';
import { clearGallery as clearStoredGallery, hydrateGallery, saveVideo } from '@/lib/videoStore';

type Phase =
  | 'idle'
  | 'requesting'
  | 'storyboard'
  | 'downloading frames'
  | 'rendering clips'
  | 'joining clips'
  | 'finalizing'
  | 'done'
  | 'error';

const COMPOSE_PHASES: Phase[] = [
  'downloading frames',
  'rendering clips',
  'joining clips',
  'finalizing',
];

export default function HomePage() {
  const [splashDone, setSplashDone] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<Duration>(5);
  const [styleId, setStyleId] = useState<string>(DEFAULT_STYLE.id);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [storyboard, setStoryboard] = useState<StoryboardFrame[]>([]);
  const [video, setVideo] = useState<GeneratedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedVideo[]>([]);

  // Starting frame (user-uploaded image used as scene #1).
  const [startingBlob, setStartingBlob] = useState<Blob | null>(null);
  const [startingUrl, setStartingUrl] = useState<string | null>(null);

  // Hydrate gallery from IndexedDB on mount. Blobs are restored as fresh blob:
  // URLs each session, so the gallery survives reloads (bug #4 from review).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const items = await hydrateGallery();
      if (!cancelled) setGallery(items);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Manage object URL lifecycle for the uploaded starting frame.
  useEffect(() => {
    if (!startingBlob) {
      setStartingUrl(null);
      return;
    }
    const url = URL.createObjectURL(startingBlob);
    setStartingUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [startingBlob]);

  const handleClearGallery = useCallback(() => {
    setGallery([]);
    void clearStoredGallery();
  }, []);

  // Bug #9 fix: stabilize onDone so SplashLoader's effect (which lists onDone
  // in its deps) doesn't restart the animation every time HomePage re-renders
  // (e.g. when hydrateGallery resolves and calls setGallery during the splash).
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  const reset = useCallback(() => {
    setPhase('idle');
    setProgress(0);
    setStoryboard([]);
    setVideo(null);
    setError(null);
  }, []);

  /**
   * Step 1: ask the API for AI keyframe URLs and assemble the storyboard.
   * The user then reviews/edits/regenerates frames before composing the video.
   */
  const handleGenerateStoryboard = useCallback(async () => {
    if (!prompt.trim()) return;
    setError(null);
    setVideo(null);
    setStoryboard([]);
    setProgress(0);
    setPhase('requesting');

    try {
      const stylePrompt = VIDEO_STYLES.find((s) => s.id === styleId)?.prompt ?? '';
      const res = await fetch('/api/generate-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration, style: stylePrompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `فشل الطلب (${res.status})`);
      }

      const data = (await res.json()) as { frames: FrameData[] };

      const aiFrames: StoryboardFrame[] = data.frames.map((f, i) => ({
        id: `ai-${Date.now()}-${i}`,
        source: 'ai',
        prompt: f.prompt,
        url: f.url,
        seed: f.seed,
      }));

      // If the user uploaded a starting frame, replace AI frame 0 with it
      // so total frame count stays = framesForDuration(duration).
      let composed: StoryboardFrame[];
      if (startingBlob && startingUrl) {
        composed = [
          {
            id: `upload-${Date.now()}`,
            source: 'upload',
            prompt: prompt.trim(),
            url: startingUrl,
            localBlob: startingBlob,
          },
          ...aiFrames.slice(1),
        ];
      } else {
        composed = aiFrames;
      }

      setStoryboard(composed);
      setPhase('storyboard');

      // Pre-warm: kick the browser into fetching the AI image URLs in the
      // background so they're cached by the time the user composes.
      composed.forEach((f) => {
        if (f.source !== 'ai') return;
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.src = f.url;
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'حدث خطأ غير متوقع';
      setError(msg);
      setPhase('error');
    }
  }, [prompt, duration, styleId, startingBlob, startingUrl]);

  /**
   * Step 2: take the (possibly-edited) storyboard and compose the video.
   */
  const handleComposeFromStoryboard = useCallback(async () => {
    if (storyboard.length < 2) {
      setError('تحتاج إلى مشهدين على الأقل لتركيب الفيديو');
      return;
    }
    setError(null);
    setProgress(0);
    setPhase('downloading frames');

    try {
      const blob = await composeVideo({
        imageUrls: storyboard.map((f) => f.url),
        durationSec: duration,
        onPhase: (p) => {
          if ((COMPOSE_PHASES as string[]).includes(p)) setPhase(p as Phase);
        },
        onProgress: (r) => setProgress(r),
      });

      const url = URL.createObjectURL(blob);
      const newVideo: GeneratedVideo = {
        id: Math.random().toString(36).slice(2, 10),
        prompt,
        duration,
        style: styleId,
        url,
        createdAt: Date.now(),
      };

      // Persist blob bytes to IndexedDB + metadata to localStorage
      // (bug #2 fix). saveVideo also handles eviction & best-effort cleanup.
      const updatedMetas = await saveVideo(
        {
          id: newVideo.id,
          prompt: newVideo.prompt,
          duration: newVideo.duration,
          style: newVideo.style,
          createdAt: newVideo.createdAt,
        },
        blob,
      );

      // Functional setGallery avoids the stale-closure bug (#3 from review):
      // even if gallery state changed during the long composition, we
      // reconcile with the metadata list saveVideo just persisted.
      setGallery((prev) => {
        const map = new Map<string, GeneratedVideo>();
        // Existing items keep their already-hydrated blob URLs.
        for (const v of prev) map.set(v.id, v);
        // The newly composed video provides the fresh URL for its id.
        map.set(newVideo.id, newVideo);
        return updatedMetas
          .map((m) => map.get(m.id))
          .filter((v): v is GeneratedVideo => v != null);
      });

      setVideo(newVideo);
      setPhase('done');
      setProgress(1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'حدث خطأ غير متوقع';
      setError(msg);
      // Bug #8 fix: restore the storyboard view so the user keeps their
      // (possibly reordered/regenerated/edited) frames instead of losing
      // 20-90s of work to a flat error screen.
      setPhase('storyboard');
      setProgress(0);
    }
  }, [storyboard, duration, prompt, styleId]);

  const handleSelectFromGallery = useCallback((v: GeneratedVideo) => {
    // Bug #1 fix: switching the gallery selection must also switch phase
    // back to 'done' so VideoResult actually re-renders.
    setVideo(v);
    setPhase('done');
    setProgress(1);
    // Scroll the player into view so the user sees the change.
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  const updateStoryboardFrame = useCallback(
    (index: number, updater: (f: StoryboardFrame) => StoryboardFrame) => {
      setStoryboard((prev) => prev.map((f, i) => (i === index ? updater(f) : f)));
    },
    [],
  );

  const removeStoryboardFrame = useCallback((index: number) => {
    setStoryboard((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveStoryboardFrame = useCallback((from: number, to: number) => {
    setStoryboard((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = prev.slice();
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  }, []);

  const composing =
    phase === 'downloading frames' ||
    phase === 'rendering clips' ||
    phase === 'joining clips' ||
    phase === 'finalizing';

  const requesting = phase === 'requesting';
  const onStoryboard = phase === 'storyboard';
  const formBusy = requesting || composing;

  // Composition needs at least 2 frames (one xfade transition); the storyboard
  // never lets the user shrink below this regardless of selected duration.
  const minStoryboardFrames = 2;

  return (
    <>
      {!splashDone && <SplashLoader onDone={handleSplashDone} />}

      <main className="min-h-screen pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <Header />

          <div className="mt-6 space-y-5">
            <StartingFrameUpload
              blob={startingBlob}
              url={startingUrl}
              onChange={setStartingBlob}
              disabled={formBusy || onStoryboard}
            />

            <PromptForm
              prompt={prompt}
              setPrompt={setPrompt}
              duration={duration}
              setDuration={setDuration}
              styleId={styleId}
              setStyleId={setStyleId}
              onSubmit={handleGenerateStoryboard}
              busy={formBusy || onStoryboard}
              ctaLabel={onStoryboard ? 'الستوريبورد جاهز' : undefined}
            />

            {error && (
              <div className="card p-4 border-red-500/40 bg-red-500/10">
                <div className="text-sm text-red-200">
                  <strong>خطأ:</strong> {error}
                </div>
              </div>
            )}

            {requesting && (
              <ProgressView
                phase={phase}
                progress={progress}
                framesPreview={storyboard.map((f) => f.url)}
              />
            )}

            {onStoryboard && (
              <StoryboardEditor
                frames={storyboard}
                onUpdateFrame={updateStoryboardFrame}
                onRemoveFrame={removeStoryboardFrame}
                onMoveFrame={moveStoryboardFrame}
                onCompose={handleComposeFromStoryboard}
                onCancel={reset}
                busy={composing}
                minFrames={minStoryboardFrames}
              />
            )}

            {composing && (
              <ProgressView
                phase={phase}
                progress={progress}
                framesPreview={storyboard.map((f) => f.url)}
              />
            )}

            {video && phase === 'done' && (
              <VideoResult video={video} onReset={reset} />
            )}

            <Gallery
              items={gallery}
              onSelect={handleSelectFromGallery}
              onClear={handleClearGallery}
            />
          </div>

          <Footer />
        </div>
      </main>
    </>
  );
}
