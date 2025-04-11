import React, { useEffect } from 'react';
import { Direction } from '../../game/types';
import { Button } from '../ui/button';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Pause, 
  Play, 
  RefreshCw 
} from 'lucide-react';

interface GameControlsProps {
  onDirectionChange: (direction: Direction) => void;
  onPauseToggle: () => void;
  onRestart: () => void;
  isPaused: boolean;
  isGameOver: boolean;
  language: 'en' | 'ar';
}

const GameControls: React.FC<GameControlsProps> = ({
  onDirectionChange,
  onPauseToggle,
  onRestart,
  isPaused,
  isGameOver,
  language
}) => {
  const translations = {
    en: {
      pause: 'Pause',
      resume: 'Resume',
      restart: 'Restart',
      up: 'Up',
      down: 'Down',
      left: 'Left',
      right: 'Right'
    },
    ar: {
      pause: 'إيقاف مؤقت',
      resume: 'استئناف',
      restart: 'إعادة تشغيل',
      up: 'فوق',
      down: 'تحت',
      left: 'يسار',
      right: 'يمين'
    }
  };

  const t = translations[language];
  const isRtl = language === 'ar';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          onDirectionChange('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          onDirectionChange('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          onDirectionChange('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          onDirectionChange('RIGHT');
          break;
        case ' ':
          onPauseToggle();
          break;
        case 'r':
        case 'R':
          onRestart();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDirectionChange, onPauseToggle, onRestart, isGameOver]);

  return (
    <div className={`flex flex-col gap-4 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          onClick={onPauseToggle}
          className="flex-1"
          disabled={isGameOver}
        >
          {isPaused ? (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t.resume}
            </>
          ) : (
            <>
              <Pause className="mr-2 h-4 w-4" />
              {t.pause}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onRestart}
          className="flex-1"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t.restart}
        </Button>
      </div>

      {/* Touch controls for mobile */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="col-start-2">
          <Button
            variant="outline"
            onClick={() => onDirectionChange('UP')}
            className="w-full"
            disabled={isGameOver || isPaused}
          >
            <ArrowUp className="h-6 w-6" />
            <span className="sr-only">{t.up}</span>
          </Button>
        </div>
        <div className="col-start-1 row-start-2">
          <Button
            variant="outline"
            onClick={() => onDirectionChange('LEFT')}
            className="w-full"
            disabled={isGameOver || isPaused}
          >
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">{t.left}</span>
          </Button>
        </div>
        <div className="col-start-2 row-start-2">
          <Button
            variant="outline"
            onClick={() => onDirectionChange('DOWN')}
            className="w-full"
            disabled={isGameOver || isPaused}
          >
            <ArrowDown className="h-6 w-6" />
            <span className="sr-only">{t.down}</span>
          </Button>
        </div>
        <div className="col-start-3 row-start-2">
          <Button
            variant="outline"
            onClick={() => onDirectionChange('RIGHT')}
            className="w-full"
            disabled={isGameOver || isPaused}
          >
            <ArrowRight className="h-6 w-6" />
            <span className="sr-only">{t.right}</span>
          </Button>
        </div>
      </div>

      {/* Keyboard controls info */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        <p>{language === 'en' ? 'Use arrow keys or WASD to move' : 'استخدم مفاتيح الأسهم أو WASD للتحرك'}</p>
        <p>{language === 'en' ? 'Space to pause, R to restart' : 'مسافة للإيقاف المؤقت، R لإعادة التشغيل'}</p>
      </div>
    </div>
  );
};

export default GameControls;
