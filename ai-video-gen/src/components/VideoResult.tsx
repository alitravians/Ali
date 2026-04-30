'use client';

import { useEffect, useRef } from 'react';
import type { GeneratedVideo } from '@/lib/types';

interface Props {
  video: GeneratedVideo;
  onReset: () => void;
}

export default function VideoResult({ video, onReset }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => { /* autoplay may fail; user can press play */ });
  }, [video.url]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = video.url;
    a.download = `ai-video-${video.duration}s-${video.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const res = await fetch(video.url);
        const blob = await res.blob();
        const file = new File([blob], `ai-video-${video.id}.mp4`, { type: 'video/mp4' });
        await navigator.share({ files: [file], title: 'AI Video', text: video.prompt });
      } catch {
        // user cancelled share
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="card p-4 md:p-6">
      <div className="aspect-video rounded-xl overflow-hidden bg-black border border-brand-400/15 glow-ring">
        <video
          ref={videoRef}
          src={video.url}
          controls
          loop
          playsInline
          className="w-full h-full object-contain bg-black"
        />
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="text-sm text-brand-200/80 line-clamp-2">
          <span className="text-brand-100 font-semibold">الوصف:</span> {video.prompt}
        </div>
        <div className="text-xs text-brand-200/60 whitespace-nowrap">
          {video.duration} ثانية · 720p
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="btn-primary rounded-xl py-3 font-bold flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          تحميل MP4
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="rounded-xl py-3 font-bold border border-brand-400/30 bg-black/30 hover:bg-brand-500/15 transition flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          مشاركة
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl py-3 font-bold border border-brand-400/30 bg-black/30 hover:bg-brand-500/15 transition flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3m2 7a8 8 0 01-14 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          فيديو جديد
        </button>
      </div>
    </div>
  );
}
