import React, { useState, useEffect } from 'react';
import { GameSettings, SaveData } from '../../game/types';
import { t } from '../../game/localization';
import { playSoundIfEnabled } from '../../game/soundSystem';

interface GameProps {
  settings: GameSettings;
  isMobileView: boolean;
  saveData: SaveData | null;
  onUpdateSaveData: (saveData: SaveData) => void;
}

const Game: React.FC<GameProps> = ({ 
  settings, 
  isMobileView, 
  saveData, 
  onUpdateSaveData 
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">
            {t('loading', settings.language)}...
          </h2>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {t('gameTitle', settings.language)}
        </h1>
        <p className="text-lg mb-6">
          {t('selectLevel', settings.language)}
        </p>
      </div>
      
      <div className="flex justify-center">
        <button 
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            playSoundIfEnabled('buttonClick', settings);
            console.log('Starting game with settings:', settings);
          }}
        >
          {t('start', settings.language)}
        </button>
      </div>
    </div>
  );
};

export default Game;
