import React from 'react';
import { useTranslation } from 'react-i18next';
import { judges, calculateAverageScore } from '../../data/debates';

interface JudgeScore {
  judgeId: string;
  score: number | null;
  isEvaluating: boolean;
}

interface JudgesPanelProps {
  scores: JudgeScore[];
  showAverage: boolean;
}

const JudgesPanel: React.FC<JudgesPanelProps> = ({ scores, showAverage }) => {
  const { t } = useTranslation();
  
  const validScores = scores.filter(s => s.score !== null).map(s => s.score as number);
  const averageScore = calculateAverageScore(validScores);

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-gray-700">
      <h3 className="text-white text-center font-bold text-lg mb-4">
        {t('debate.judgesPanel')}
      </h3>
      
      {/* Judges Grid */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {judges.map((judge) => {
          const judgeScore = scores.find(s => s.judgeId === judge.id);
          const isEvaluating = judgeScore?.isEvaluating || false;
          const score = judgeScore?.score;
          
          return (
            <div 
              key={judge.id}
              className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${
                isEvaluating ? 'animate-pulse' : ''
              }`}
              style={{ 
                backgroundColor: `${judge.color}20`,
                borderColor: judge.color,
                borderWidth: '2px'
              }}
            >
              {/* Judge Icon */}
              <div className="text-2xl mb-1">{judge.icon}</div>
              
              {/* Judge Name */}
              <div className="text-xs text-gray-300 mb-1">{judge.name}</div>
              
              {/* Score */}
              <div 
                className="w-12 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: judge.color }}
              >
                {isEvaluating ? (
                  <span className="animate-spin">⏳</span>
                ) : score !== null && score !== undefined ? (
                  score
                ) : (
                  '-'
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Average Score */}
      {showAverage && validScores.length > 0 && (
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-700">
          <span className="text-gray-400">{t('debate.averageScore')}:</span>
          <span className="text-3xl font-bold text-yellow-400 animate-pulse">
            {averageScore}
          </span>
        </div>
      )}
    </div>
  );
};

export default JudgesPanel;
