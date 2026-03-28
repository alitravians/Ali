import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakArabic, stopSpeaking } from '../utils/tts';

interface SpeakButtonProps {
  text: string;
  size?: number;
}

export default function SpeakButton({ text, size = 18 }: SpeakButtonProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
    } else {
      setPlaying(true);
      speakArabic(text);
      // Listen for speech end
      const checkInterval = setInterval(() => {
        if (!('speechSynthesis' in window) || !window.speechSynthesis.speaking) {
          setPlaying(false);
          clearInterval(checkInterval);
        }
      }, 300);
      // Safety timeout: reset after 30 seconds max
      setTimeout(() => {
        setPlaying(false);
        clearInterval(checkInterval);
      }, 30000);
    }
  }, [playing, text]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    togglePlay();
  };

  const handleTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    togglePlay();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchEnd={handleTouch}
      className={`p-2 rounded-full transition-all ${
        playing
          ? 'bg-primary text-white shadow-md animate-pulse'
          : 'bg-primary/10 text-primary hover:bg-primary/20'
      }`}
      title={playing ? 'إيقاف الصوت' : 'استمع بالصوت'}
      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
    >
      {playing ? <VolumeX size={size} /> : <Volume2 size={size} />}
    </button>
  );
}
