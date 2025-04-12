import React from 'react';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface GameClosureMessageProps {
  settings: GameSettings;
  closureReason: string;
}

const GameClosureMessage: React.FC<GameClosureMessageProps> = ({ settings, closureReason }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto mb-4">
        <h2 className="text-xl font-bold mb-2">
          {t('gameClosed', settings.language)}
        </h2>
        <p className="mb-4">
          {closureReason || (settings.language === 'en' 
            ? 'The game is currently closed for maintenance.' 
            : 'اللعبة مغلقة حاليًا للصيانة.')}
        </p>
      </div>
    </div>
  );
};

export default GameClosureMessage;
