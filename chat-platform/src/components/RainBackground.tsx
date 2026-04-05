'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function RainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showControls, setShowControls] = useState(false);
  const animFrameRef = useRef<number>(0);
  const dropsRef = useRef<Array<{ x: number; y: number; speed: number; length: number; opacity: number }>>([]);

  const initDrops = useCallback((width: number, height: number) => {
    const count = 100;
    dropsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 1.5 + Math.random() * 3,
      length: 8 + Math.random() * 15,
      opacity: 0.05 + Math.random() * 0.2,
    }));
  }, []);

  // Rain animation
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
        ctx.lineTo(drop.x + 0.3, drop.y + drop.length);
        ctx.strokeStyle = `rgba(148, 163, 184, ${drop.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        drop.y += drop.speed;
        if (drop.y > canvas.height) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initDrops]);

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
    const saved = localStorage.getItem('rain_bg_prefs');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.volume !== undefined) setVolume(prefs.volume);
        if (prefs.soundOn !== undefined) setSoundOn(prefs.soundOn);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rain_bg_prefs', JSON.stringify({ volume, soundOn }));
  }, [volume, soundOn]);

  return (
    <>
      {/* Rain canvas - fixed behind everything */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Floating sound control button - bottom left */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowControls(!showControls)}
          className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-lg hover:bg-white/[0.1] transition-all shadow-lg"
          title={soundOn ? 'صوت المطر مفعّل' : 'تشغيل صوت المطر'}
        >
          {soundOn ? '🔊' : '🌧️'}
        </button>

        {/* Controls popup */}
        {showControls && (
          <div className="absolute bottom-12 left-0 w-56 backdrop-blur-xl bg-gray-900/90 border border-white/[0.1] rounded-2xl p-4 shadow-2xl space-y-3">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2 ${
                soundOn
                  ? 'bg-violet-500/15 border border-violet-500/25 text-violet-300'
                  : 'bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white'
              }`}
            >
              <span>{soundOn ? '🔊' : '🔇'}</span>
              <span>{soundOn ? 'صوت المطر مفعّل' : 'تشغيل صوت المطر'}</span>
            </button>

            {/* Volume slider */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-[10px]">🔈</span>
              <input
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-white/[0.08] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
              />
              <span className="text-gray-500 text-[10px]">🔊</span>
            </div>
          </div>
        )}
      </div>

      {/* Rain sound audio */}
      <audio ref={audioRef} loop preload="auto">
        <source src="/sounds/rain.mp3" type="audio/mpeg" />
      </audio>
    </>
  );
}
