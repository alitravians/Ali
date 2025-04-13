import React from 'react';
import { GameSettings, SaveData } from '../../game/types';
import { t } from '../../game/localization';
import { playSoundIfEnabled } from '../../game/soundSystem';
import LevelSelection from './LevelSelection';

interface MainMenuProps {
  settings: GameSettings;
  saveData: SaveData | null;
  onStartGame: () => void;
  onSelectLevel: (cityId: number, levelId: number) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  settings, 
  saveData, 
  onStartGame, 
  onSelectLevel 
}) => {
  const handleStartGame = () => {
    playSoundIfEnabled('buttonClick', settings);
    onStartGame();
  };

  return (
    <div className="main-menu-container p-4 md:p-6 w-full max-w-6xl mx-auto">
      <h1 className="game-title text-center mb-8">
        {t('gameTitle', settings.language)}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* مربع بدء اللعبة - Start Game Box */}
        <div className={`main-menu-box start-game ${settings.language === 'ar' ? 'md:order-1' : 'md:order-none'}`}>
          <div className="box-header">
            <h2>
              {t('startGame', settings.language)}
            </h2>
          </div>
          <div className="p-6 flex flex-col justify-center items-center h-full">
            <button
              onClick={handleStartGame}
              className="start-game-button"
            >
              {t('start', settings.language)}
            </button>
          </div>
        </div>
        
        {/* مربع اختيار المدن والمراحل - City Selection Box */}
        <div className={`main-menu-box city-selection ${settings.language === 'ar' ? 'md:order-none' : 'md:order-1'}`}>
          <div className="box-header">
            <h2>
              {t('selectCity', settings.language)}
            </h2>
          </div>
          <div className="p-6">
            <div className="city-selection-container max-h-[400px] overflow-y-auto pr-2">
              {saveData && (
                <LevelSelection
                  settings={settings}
                  cities={saveData.cities}
                  levels={saveData.levels}
                  onSelectLevel={onSelectLevel}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
