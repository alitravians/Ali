import { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { speakArabic, stopSpeaking, isSpeaking } from '../utils/tts';

interface TappableTextProps {
  text: string;
  speakText?: string; // Optional different text to speak (e.g. simplified explanation)
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';
  iconSize?: number;
  showIcon?: boolean;
}

export default function TappableText({
  text,
  speakText,
  children,
  className = '',
  as: Tag = 'span',
  iconSize = 14,
  showIcon = true,
}: TappableTextProps) {
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    if (playing) {
      stopSpeaking();
      setPlaying(false);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    } else {
      setPlaying(true);
      speakArabic(speakText || text);

      // Monitor speech end
      intervalRef.current = setInterval(() => {
        if (!isSpeaking()) {
          setPlaying(false);
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        }
      }, 500);

      // Safety timeout
      timeoutRef.current = setTimeout(() => {
        setPlaying(false);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      }, 60000);
    }
  }, [playing, text, speakText]);

  return (
    <Tag
      onClick={handleTap}
      className={`inline-flex items-center gap-1.5 cursor-pointer transition-all rounded-lg ${
        playing
          ? 'bg-primary/15 dark:bg-primary/25'
          : 'hover:bg-primary/5 dark:hover:bg-primary/10 active:bg-primary/15'
      } ${className}`}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        borderBottom: playing ? '2px solid var(--color-primary, #0891b2)' : '2px dashed rgba(8, 145, 178, 0.3)',
        paddingBottom: '2px',
      }}
    >
      {children}
      {showIcon && (
        <Volume2
          size={iconSize}
          className={`shrink-0 text-primary transition-all ${playing ? 'animate-pulse' : 'opacity-50'}`}
        />
      )}
    </Tag>
  );
}
