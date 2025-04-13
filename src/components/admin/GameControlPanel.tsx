import React, { useState } from 'react';
import { GameSettings, GameStatus } from '../../game/types';
import { t } from '../../game/localization';
import { playSoundIfEnabled } from '../../game/soundSystem';

interface GameControlPanelProps {
  settings: GameSettings;
  gameStatus: GameStatus;
  onUpdateGameStatus: (status: GameStatus) => void;
}

const GameControlPanel: React.FC<GameControlPanelProps> = ({
  settings,
  gameStatus,
  onUpdateGameStatus
}) => {
  const [isOpen, setIsOpen] = useState(gameStatus.isOpen);
  const [closureReason, setClosureReason] = useState(gameStatus.closureReason);
  
  const handleToggleGameStatus = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSaveChanges = () => {
    const newStatus: GameStatus = {
      isOpen,
      closureReason: isOpen ? '' : closureReason,
      lastUpdated: Date.now()
    };
    
    onUpdateGameStatus(newStatus);
    playSoundIfEnabled('buttonClick', settings);
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  return (
    <div className="game-control-panel">
      <h2 className="text-xl font-bold mb-4">
        {t('gameStatus', settings.language)}
      </h2>
      
      <div className="mb-4">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={!isOpen}
              onChange={handleToggleGameStatus}
            />
            <div className={`block w-14 h-8 rounded-full ${!isOpen ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${!isOpen ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 font-medium">
            {!isOpen ? t('closeGame', settings.language) : t('openGame', settings.language)}
          </div>
        </label>
      </div>
      
      {!isOpen && (
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            {t('closureReason', settings.language)}
          </label>
          <textarea
            value={closureReason}
            onChange={(e) => setClosureReason(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            rows={3}
            placeholder={settings.language === 'en' ? 'Enter reason for game closure...' : 'أدخل سبب إغلاق اللعبة...'}
          />
        </div>
      )}
      
      <button
        onClick={handleSaveChanges}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        {t('saveChanges', settings.language)}
      </button>
    </div>
  );
};

export default GameControlPanel;
