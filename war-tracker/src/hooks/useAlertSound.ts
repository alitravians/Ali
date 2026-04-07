import { useRef, useState, useCallback, useEffect } from 'react';

// Generate alert beep using Web Audio API (no external files needed)
function playAlertBeep() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1100; // C#6
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.65);
    // Close AudioContext after all oscillators finish to avoid resource leak
    osc2.onended = () => ctx.close();
  } catch {
    // Audio not available
  }
}

export function useAlertSound() {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('warscope_muted') === 'true';
  });
  const prevBreakingCount = useRef(0);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('warscope_muted', String(next));
      return next;
    });
  }, []);

  const checkAndPlay = useCallback((breakingCount: number) => {
    if (breakingCount > prevBreakingCount.current && !isMutedRef.current) {
      playAlertBeep();
    }
    prevBreakingCount.current = breakingCount;
  }, []);

  return { isMuted, toggleMute, checkAndPlay };
}
