'use client';

import { useCallback, useEffect, useState } from 'react';
import SplashLoader from '@/components/SplashLoader';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromptForm from '@/components/PromptForm';
import ProgressView from '@/components/ProgressView';
import VideoResult from '@/components/VideoResult';
import Gallery from '@/components/Gallery';
import { DEFAULT_STYLE, VIDEO_STYLES } from '@/lib/styles';
import type { Duration, FrameData, GeneratedVideo } from '@/lib/types';
import { composeVideo } from '@/lib/videoComposer';

const GALLERY_KEY = 'ai-video-gen:gallery:v1';
const MAX_GALLERY = 8;

type Phase = 'idle' | 'requesting' | 'downloading frames' | 'rendering clips' | 'joining clips' | 'finalizing' | 'done' | 'error';

export default function HomePage() {
  const [splashDone, setSplashDone] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<Duration>(5);
  const [styleId, setStyleId] = useState<string>(DEFAULT_STYLE.id);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [video, setVideo] = useState<GeneratedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedVideo[]>([]);

  // Load gallery from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GALLERY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GeneratedVideo[];
        setGallery(parsed.filter((v) => v && v.url && v.id));
      }
    } catch { /* ignore */ }
  }, []);

  const persistGallery = useCallback((items: GeneratedVideo[]) => {
    setGallery(items);
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
    } catch { /* localStorage may be full; ignore */ }
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setProgress(0);
    setFrames([]);
    setVideo(null);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setError(null);
    setVideo(null);
    setFrames([]);
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
      setFrames(data.frames);

      // Pre-warm the URLs so Pollinations starts generating in parallel.
      // Browsers will cache them when fetchFile pulls them again from ffmpeg side.
      data.frames.forEach((f) => {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.src = f.url;
      });

      const blob = await composeVideo({
        imageUrls: data.frames.map((f) => f.url),
        durationSec: duration,
        onPhase: (p) => setPhase(p as Phase),
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
      setVideo(newVideo);
      setPhase('done');
      setProgress(1);

      const next = [newVideo, ...gallery].slice(0, MAX_GALLERY);
      persistGallery(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'حدث خطأ غير متوقع';
      setError(msg);
      setPhase('error');
    }
  }, [prompt, duration, styleId, gallery, persistGallery]);

  const handleClearGallery = useCallback(() => {
    setGallery([]);
    try { localStorage.removeItem(GALLERY_KEY); } catch { /* ignore */ }
  }, []);

  const busy = phase !== 'idle' && phase !== 'done' && phase !== 'error';

  return (
    <>
      {!splashDone && <SplashLoader onDone={() => setSplashDone(true)} />}

      <main className="min-h-screen pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <Header />

          <div className="mt-6 space-y-5">
            <PromptForm
              prompt={prompt}
              setPrompt={setPrompt}
              duration={duration}
              setDuration={setDuration}
              styleId={styleId}
              setStyleId={setStyleId}
              onSubmit={handleGenerate}
              busy={busy}
            />

            {error && (
              <div className="card p-4 border-red-500/40 bg-red-500/10">
                <div className="text-sm text-red-200">
                  <strong>خطأ:</strong> {error}
                </div>
              </div>
            )}

            {(busy || (phase === 'done' && !video)) && (
              <ProgressView
                phase={phase}
                progress={progress}
                framesPreview={frames.map((f) => f.url)}
              />
            )}

            {video && phase === 'done' && (
              <VideoResult video={video} onReset={reset} />
            )}

            <Gallery items={gallery} onSelect={(v) => setVideo(v)} onClear={handleClearGallery} />
          </div>

          <Footer />
        </div>
      </main>
    </>
  );
}
