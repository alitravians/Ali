'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export default function AmbiancePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [reducedMotion, setReducedMotion] = useState(false);
  const animFrameRef = useRef<number>(0);

  // Rain drops
  const dropsRef = useRef<Array<{ x: number; y: number; speed: number; length: number; opacity: number }>>([]);

  const initDrops = useCallback((width: number, height: number) => {
    const count = reducedMotion ? 40 : 150;
    dropsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 2 + Math.random() * 4,
      length: 10 + Math.random() * 20,
      opacity: 0.1 + Math.random() * 0.4,
    }));
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDrops(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dropsRef.current.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + 0.5, drop.y + drop.length);
        ctx.strokeStyle = `rgba(148, 163, 184, ${drop.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Glow effect at bottom of drop
        const gradient = ctx.createRadialGradient(drop.x, drop.y + drop.length, 0, drop.x, drop.y + drop.length, 3);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${drop.opacity * 0.3})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(drop.x - 3, drop.y + drop.length - 3, 6, 6);

        drop.y += drop.speed;
        if (drop.y > canvas.height) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    if (!reducedMotion) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [reducedMotion, initDrops]);

  // Sound control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (soundOn) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [soundOn, volume]);

  // Persist preferences
  useEffect(() => {
    const saved = localStorage.getItem('ambiance_prefs');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.volume !== undefined) setVolume(prefs.volume);
        if (prefs.reducedMotion !== undefined) setReducedMotion(prefs.reducedMotion);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ambiance_prefs', JSON.stringify({ volume, reducedMotion }));
  }, [volume, reducedMotion]);

  return (
    <div className="min-h-screen bg-[#020408] relative overflow-hidden">
      {/* Rain canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-violet-900/[0.08] rounded-full blur-[150px] bg-orb-1" />
        <div className="absolute bottom-[20%] right-[15%] w-[350px] h-[350px] bg-indigo-900/[0.06] rounded-full blur-[130px] bg-orb-2" />
        <div className="absolute top-[50%] left-[60%] w-[300px] h-[300px] bg-sky-900/[0.05] rounded-full blur-[120px] bg-orb-3" />
      </div>

      {/* Glass content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Glass card */}
        <div className="w-full max-w-md backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-10 shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🌧️</div>
            <h1 className="text-2xl font-bold text-white mb-2">أجواء هادئة</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              استرخِ واستمتع بأصوات المطر الهادئة
            </p>
          </div>

          {/* Sound control */}
          <div className="space-y-5">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className={`w-full py-4 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                soundOn
                  ? 'bg-violet-500/15 border border-violet-500/25 text-violet-300 shadow-lg shadow-violet-500/10'
                  : 'bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span className="text-xl">{soundOn ? '🔊' : '🔇'}</span>
              <span>{soundOn ? 'صوت المطر مفعّل' : 'تشغيل صوت المطر'}</span>
            </button>

            {/* Volume slider */}
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs">🔈</span>
              <input
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-white/[0.08] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-500/30"
              />
              <span className="text-gray-500 text-xs">🔊</span>
            </div>

            {/* Reduced motion toggle */}
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className="w-full py-3 rounded-xl text-xs border transition-all flex items-center justify-center gap-2 bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.04]"
            >
              <span>{reducedMotion ? '✨' : '🌙'}</span>
              <span>{reducedMotion ? 'تفعيل الحركة الكاملة' : 'تقليل الحركة (للأجهزة الضعيفة)'}</span>
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-gray-600 text-[11px] leading-relaxed">
              صُممت هذه الصفحة لتوفير أجواء مريحة ✨<br/>
              اترك التبويب مفتوحاً واستمتع
            </p>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="mt-8 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-white text-xs px-4 py-2 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all">← الرئيسية</Link>
          <Link href="/chat" className="text-gray-600 hover:text-white text-xs px-4 py-2 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all">💬 الدردشة</Link>
        </div>
      </div>

      {/* Rain sound audio - use a free rain sound URL */}
      <audio ref={audioRef} loop preload="none">
        <source src="https://cdn.pixabay.com/audio/2022/10/30/audio_938188614f.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}
