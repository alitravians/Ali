import React from 'react';
import { Button } from '../../components/ui/button';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface SoundToggleProps {
  settings: GameSettings;
  onToggleSound: () => void;
}

const SoundToggle: React.FC<SoundToggleProps> = ({ settings, onToggleSound }) => {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggleSound}
      title={t('sound', settings.language)}
    >
      {settings.soundEnabled ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      )}
    </Button>
  );
};

export default SoundToggle;
