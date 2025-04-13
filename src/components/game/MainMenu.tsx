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
    <div className="main-menu-container p-6 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-neutral-800 dark:text-neutral-100">
          {t('gameTitle', settings.language)}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* بدء اللعبة - المربع الأول */}
        <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden border-2 ${settings.language === 'ar' ? 'md:order-1' : 'md:order-none'}`}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600 dark:text-blue-400">
              {t('startGame', settings.language)}
            </h2>
            <div className="flex justify-center mt-6">
              <button
                onClick={handleStartGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-300 w-full max-w-xs"
              >
                {t('start', settings.language)}
              </button>
            </div>
          </div>
        </div>
        
        {/* اختيار المدن والمراحل - المربع الثاني */}
        <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden border-2 ${settings.language === 'ar' ? 'md:order-none' : 'md:order-1'}`}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600 dark:text-blue-400">
              {t('selectCity', settings.language)}
            </h2>
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
  );
};

export default MainMenu;
