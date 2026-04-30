'use client';

import { useEffect, useState } from 'react';

interface SplashLoaderProps {
  onDone: () => void;
}

export default function SplashLoader({ onDone }: SplashLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const total = 1800; // ms
    let raf = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / total) * 100));
      setProgress(pct);
      if (elapsed < total) {
        raf = requestAnimationFrame(tick);
      } else {
        setHiding(true);
        setTimeout(onDone, 400);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center loader-bg transition-opacity duration-500 ${
        hiding ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={hiding}
    >
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full glow-ring animate-pulse-slow" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center animate-float">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 5v14l11-7L8 5z"
              fill="white"
              opacity="0.95"
            />
          </svg>
        </div>
        <div className="absolute -inset-3 rounded-full border border-brand-400/20 animate-pulse" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-l from-brand-300 via-white to-brand-300 bg-clip-text text-transparent">
        AI Video Gen
      </h1>
      <p className="text-sm text-brand-200/70 mb-8">توليد فيديوهات بالذكاء الاصطناعي</p>

      <div className="w-64 max-w-[80vw]">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-l from-brand-300 to-brand-500 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="mt-2 text-center text-xs text-brand-200/60 tabular-nums">
          {progress}%
        </div>
      </div>
    </div>
  );
}
