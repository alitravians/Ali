import React from 'react';
import { useTranslation } from 'react-i18next';

interface ScoreBoardProps {
  currentRound: number;
  totalRounds: number;
  side1Score: number;
  side2Score: number;
  side1Name: string;
  side2Name: string;
  side1Color: string;
  side2Color: string;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({
  currentRound,
  totalRounds,
  side1Score,
  side2Score,
  side1Name,
  side2Name,
  side1Color,
  side2Color,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-gray-700">
      {/* Round Indicator */}
      <div className="text-center mb-4">
        <span className="text-gray-400 text-sm">{t('debate.round')}</span>
        <div className="text-white text-2xl font-bold">
          {currentRound} <span className="text-gray-500">{t('debate.of')}</span> {totalRounds}
        </div>
      </div>
      
      {/* Score Display */}
      <div className="flex items-center justify-center gap-4">
        {/* Side 1 Score */}
        <div className="flex flex-col items-center">
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: side1Color }}
          >
            {side1Score}
          </div>
          <span className="text-xs text-gray-400 mt-1 truncate max-w-[80px]">{side1Name}</span>
        </div>
        
        {/* Separator */}
        <div className="text-gray-500 text-2xl font-bold">:</div>
        
        {/* Side 2 Score */}
        <div className="flex flex-col items-center">
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: side2Color }}
          >
            {side2Score}
          </div>
          <span className="text-xs text-gray-400 mt-1 truncate max-w-[80px]">{side2Name}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(currentRound / totalRounds) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;
