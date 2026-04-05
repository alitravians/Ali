'use client';

import { useEffect, useRef, useCallback } from 'react';

export default function RainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rainAudioRef = useRef<HTMLAudioElement | null>(null);
  const glassAudioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const dropsRef = useRef<Array<{ x: number; y: number; speed: number; length: number; opacity: number }>>([]);
  const audioStartedRef = useRef(false);
  const glassIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initDrops = useCallback((width: number, height: number) => {
    const count = 120;
    dropsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 1.5 + Math.random() * 3,
      length: 8 + Math.random() * 15,
      opacity: 0.05 + Math.random() * 0.2,
    }));
  }, []);

  // Start audio on first user interaction (browser autoplay policy)
  const startAudio = useCallback(() => {
    if (audioStartedRef.current) return;
    audioStartedRef.current = true;

    // Start rain sound
    if (rainAudioRef.current) {
      rainAudioRef.current.volume = 0.25;
      rainAudioRef.current.play().catch(() => {});
    }

    // Play glass breaking sound once at start
    if (glassAudioRef.current) {
      glassAudioRef.current.volume = 0.15;
      glassAudioRef.current.play().catch(() => {});
    }

    // Repeat glass breaking sound every 45-90 seconds randomly
    glassIntervalRef.current = setInterval(() => {
      if (glassAudioRef.current) {
        glassAudioRef.current.currentTime = 0;
        glassAudioRef.current.volume = 0.1 + Math.random() * 0.1;
        glassAudioRef.current.play().catch(() => {});
      }
    }, 45000 + Math.random() * 45000);
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

  // Auto-play audio on first user interaction
  useEffect(() => {
    // Create audio elements programmatically
    const rainAudio = new Audio('/sounds/rain.mp3');
    rainAudio.loop = true;
    rainAudio.preload = 'auto';
    rainAudioRef.current = rainAudio;

    const glassAudio = new Audio('/sounds/glass.mp3');
    glassAudio.preload = 'auto';
    glassAudioRef.current = glassAudio;

    // Try to play immediately (works if browser allows)
    rainAudio.volume = 0.25;
    rainAudio.play().then(() => {
      audioStartedRef.current = true;
      // Also play glass after a short delay
      setTimeout(() => {
        glassAudio.volume = 0.15;
        glassAudio.play().catch(() => {});
      }, 2000);
      // Set up glass interval
      glassIntervalRef.current = setInterval(() => {
        glassAudio.currentTime = 0;
        glassAudio.volume = 0.1 + Math.random() * 0.1;
        glassAudio.play().catch(() => {});
      }, 45000 + Math.random() * 45000);
    }).catch(() => {
      // Browser blocked autoplay - wait for first interaction
    });

    // Listen for first user interaction to start audio
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    const handler = () => {
      startAudio();
      events.forEach(e => document.removeEventListener(e, handler));
    };
    events.forEach(e => document.addEventListener(e, handler, { once: false, passive: true }));

    return () => {
      events.forEach(e => document.removeEventListener(e, handler));
      if (glassIntervalRef.current) clearInterval(glassIntervalRef.current);
      rainAudio.pause();
      glassAudio.pause();
    };
  }, [startAudio]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
