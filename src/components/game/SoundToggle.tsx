import React from 'react';
import { Button } from '../ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface SoundToggleProps {
  settings: GameSettings;
  onToggleSound: () => void;
}

const SoundToggle: React.FC<SoundToggleProps> = ({ settings, onToggleSound }) => {
  const language = settings.language;
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onToggleSound}
      className="flex items-center gap-2"
      title={t('sound', language)}
    >
      {settings.soundEnabled ? (
        <>
          <Volume2 className="h-4 w-4" />
          {t('soundOn', language)}
        </>
      ) : (
        <>
          <VolumeX className="h-4 w-4" />
          {t('soundOff', language)}
        </>
      )}
    </Button>
  );
};

export default SoundToggle;
