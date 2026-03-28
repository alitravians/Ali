import { useState, useEffect } from 'react';
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) {
      stopSpeaking();
      setPlaying(false);
    } else {
      setPlaying(true);
      speakArabic(text);
      // Listen for speech end
      const checkInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setPlaying(false);
          clearInterval(checkInterval);
        }
      }, 200);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-all ${
        playing
          ? 'bg-primary text-white shadow-md animate-pulse'
          : 'bg-primary/10 text-primary hover:bg-primary/20'
      }`}
      title={playing ? 'إيقاف الصوت' : 'استمع بالصوت'}
    >
      {playing ? <VolumeX size={size} /> : <Volume2 size={size} />}
    </button>
  );
}
