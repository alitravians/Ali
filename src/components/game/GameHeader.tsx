import React, { useState } from 'react';
import { GameSettings } from '../../game/types';
import LanguageToggle from './LanguageToggle';
import SoundToggle from './SoundToggle';
import DeviceToggle from './DeviceToggle';
import SettingsPanel from './SettingsPanel';
import { Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { t, getDirection } from '../../game/localization';

interface GameHeaderProps {
  settings: GameSettings;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
  onToggleDevice: () => void;
  onChangeDifficulty: (difficulty: 'easy' | 'normal' | 'hard') => void;
  onOpenSaveManager?: () => void;
  onOpenUpdatesPage?: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  settings,
  onToggleSound,
  onToggleLanguage,
  onToggleDevice,
  onChangeDifficulty,
  onOpenSaveManager,
  onOpenUpdatesPage
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const direction = getDirection(settings.language);
  
  return (
    <>
      <div className={`flex justify-between items-center mb-6 ${direction}`}>
        <h1 className="text-3xl font-bold text-center flex-grow">
          {t('startGame', settings.language)}
        </h1>
        <div className="flex gap-2 items-center">
          <SoundToggle settings={settings} onToggleSound={onToggleSound} />
          <LanguageToggle settings={settings} onToggleLanguage={onToggleLanguage} />
          <DeviceToggle settings={settings} onToggleDevice={onToggleDevice} />
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            title={t('settings', settings.language)}
          >
            <Settings className="h-5 w-5" />
          </Button>
          {onOpenSaveManager && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onOpenSaveManager}
              title={t('saveManager', settings.language)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            </Button>
          )}
          
          {onOpenUpdatesPage && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onOpenUpdatesPage}
              title={t('updatesPage', settings.language)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </Button>
          )}
        </div>
      </div>
      
      <SettingsPanel 
        settings={settings}
        onToggleSound={onToggleSound}
        onToggleLanguage={onToggleLanguage}
        onChangeDifficulty={onChangeDifficulty}
        language={settings.language}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default GameHeader;
