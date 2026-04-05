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

  // Start audio - called on user interaction
  const startAudio = useCallback(() => {
    if (audioStartedRef.current) return;
    audioStartedRef.current = true;

    // Create fresh audio elements inside the gesture handler for mobile compatibility
    const rainAudio = new Audio('/sounds/rain.mp3');
    rainAudio.loop = true;
    rainAudio.volume = 0.25;
    rainAudio.setAttribute('playsinline', '');
    rainAudioRef.current = rainAudio;

    const glassAudio = new Audio('/sounds/glass.mp3');
    glassAudio.volume = 0.15;
    glassAudio.setAttribute('playsinline', '');
    glassAudioRef.current = glassAudio;

    // Play rain immediately
    rainAudio.play().catch(() => {
      // If this still fails, reset so we can try again
      audioStartedRef.current = false;
    });

    // Play glass after 2 seconds
    setTimeout(() => {
      glassAudio.play().catch(() => {});
    }, 2000);

    // Repeat glass breaking every 45-90 seconds
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

  // Auto-play audio: try immediately, fallback to first user interaction
  useEffect(() => {
    // Try to autoplay immediately (works on desktop if browser allows)
    const tryAutoplay = new Audio('/sounds/rain.mp3');
    tryAutoplay.loop = true;
    tryAutoplay.volume = 0.25;
    tryAutoplay.play().then(() => {
      // Autoplay worked (desktop)
      audioStartedRef.current = true;
      rainAudioRef.current = tryAutoplay;

      const glassAudio = new Audio('/sounds/glass.mp3');
      glassAudio.volume = 0.15;
      glassAudioRef.current = glassAudio;

      setTimeout(() => {
        glassAudio.play().catch(() => {});
      }, 2000);

      glassIntervalRef.current = setInterval(() => {
        glassAudio.currentTime = 0;
        glassAudio.volume = 0.1 + Math.random() * 0.1;
        glassAudio.play().catch(() => {});
      }, 45000 + Math.random() * 45000);
    }).catch(() => {
      // Autoplay blocked (mobile) - clean up and wait for interaction
      tryAutoplay.pause();
      tryAutoplay.src = '';
    });

    // Listen for user interaction to unlock audio (mobile)
    // IMPORTANT: On Android Chrome, 'click' works but 'touchstart' does NOT
    const handler = () => {
      startAudio();
      // Remove all listeners after first successful start
      interactionEvents.forEach(e => document.removeEventListener(e, handler));
    };

    const interactionEvents = ['click', 'touchend', 'keydown'];
    interactionEvents.forEach(e => {
      document.addEventListener(e, handler, { passive: true });
    });

    return () => {
      interactionEvents.forEach(e => document.removeEventListener(e, handler));
      if (glassIntervalRef.current) clearInterval(glassIntervalRef.current);
      if (rainAudioRef.current) {
        rainAudioRef.current.pause();
        rainAudioRef.current.src = '';
      }
      if (glassAudioRef.current) {
        glassAudioRef.current.pause();
        glassAudioRef.current.src = '';
      }
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
