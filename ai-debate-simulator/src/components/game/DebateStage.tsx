import React from 'react';
import Debater from './Debater';
import { useTranslation } from 'react-i18next';

interface DebateStageProps {
  side1: {
    name: string;
    color: string;
    score: number;
    customImage?: string | null;
  };
  side2: {
    name: string;
    color: string;
    score: number;
    customImage?: string | null;
  };
  activeSide: 'side1' | 'side2' | null;
  isSpeaking: boolean;
}

const DebateStage: React.FC<DebateStageProps> = ({ side1, side2, activeSide, isSpeaking }) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full">
      {/* Stage Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 to-purple-900/50 rounded-3xl" />
      
      {/* Stage Lights */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
      
      {/* Stage Content */}
      <div className="relative flex items-center justify-between px-4 md:px-12 py-8">
        {/* Side 1 (Left) */}
        <div className="flex-1 flex justify-center">
          <Debater
            name={side1.name}
            color={side1.color}
            isActive={activeSide === 'side1'}
            isSpeaking={activeSide === 'side1' && isSpeaking}
            score={side1.score}
            side="left"
            customImage={side1.customImage}
          />
        </div>
        
        {/* VS Badge */}
        <div className="flex flex-col items-center mx-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl">
            <span className="text-white font-bold text-xl md:text-2xl">{t('debate.vs')}</span>
          </div>
          {/* Podium/Table */}
          <div className="mt-4 w-24 h-3 bg-gray-700 rounded-full shadow-lg" />
        </div>
        
        {/* Side 2 (Right) */}
        <div className="flex-1 flex justify-center">
          <Debater
            name={side2.name}
            color={side2.color}
            isActive={activeSide === 'side2'}
            isSpeaking={activeSide === 'side2' && isSpeaking}
            score={side2.score}
            side="right"
            customImage={side2.customImage}
          />
        </div>
      </div>
      
      {/* Stage Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-b-3xl" />
    </div>
  );
};

export default DebateStage;
