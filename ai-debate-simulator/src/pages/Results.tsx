import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Home, RotateCcw, Share2 } from 'lucide-react';
import i18n from '../i18n/config';

interface RoundResult {
  round: number;
  side1Score: number;
  side2Score: number;
  side1Argument: string;
  side2Argument: string;
}

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const { topic, side1TotalScore, side2TotalScore, roundResults } = location.state || {};

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl mb-4">{t('common.error')}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('debate.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  const side1Name = isArabic ? topic.side1.nameAr : topic.side1.nameEn;
  const side2Name = isArabic ? topic.side2.nameAr : topic.side2.nameEn;
  const topicTitle = isArabic ? topic.titleAr : topic.titleEn;

  const winner = side1TotalScore > side2TotalScore ? 'side1' : side2TotalScore > side1TotalScore ? 'side2' : 'draw';
  const winnerName = winner === 'side1' ? side1Name : winner === 'side2' ? side2Name : null;
  const winnerColor = winner === 'side1' ? topic.side1.color : winner === 'side2' ? topic.side2.color : '#fbbf24';

  const handleShare = () => {
    const text = `${topicTitle}\n${t('results.winner')}: ${winnerName || t('results.draw')}\n${side1Name}: ${side1TotalScore} - ${side2Name}: ${side2TotalScore}`;
    
    if (navigator.share) {
      navigator.share({
        title: t('appTitle'),
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('تم نسخ النتائج!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      {/* Confetti Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-20px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {t('results.title')}
          </h1>
          <p className="text-gray-400">{topicTitle}</p>
        </header>

        {/* Winner Section */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 mb-8 text-center">
          {winner !== 'draw' ? (
            <>
              <div className="mb-4">
                <Trophy size={64} className="mx-auto text-yellow-400 animate-bounce" />
              </div>
              <h2 className="text-2xl text-gray-400 mb-2">{t('results.winner')}</h2>
              <h3 
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ color: winnerColor }}
              >
                {winnerName}
              </h3>
              <p className="text-xl text-gray-300">{t('results.congratulations')}</p>
            </>
          ) : (
            <>
              <div className="mb-4 text-6xl">🤝</div>
              <h2 className="text-4xl md:text-5xl font-bold text-yellow-400">
                {t('results.draw')}
              </h2>
            </>
          )}
        </div>

        {/* Final Scores */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white text-center mb-6">
            {t('results.finalScores')}
          </h3>
          
          <div className="flex items-center justify-center gap-8">
            {/* Side 1 */}
            <div className="text-center">
              <div 
                className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-2xl ${
                  winner === 'side1' ? 'ring-4 ring-yellow-400' : ''
                }`}
                style={{ backgroundColor: topic.side1.color }}
              >
                {side1TotalScore}
              </div>
              <p className="text-white mt-3 font-medium">{side1Name}</p>
              {winner === 'side1' && <span className="text-yellow-400">👑</span>}
            </div>

            {/* VS */}
            <div className="text-3xl text-gray-500 font-bold">:</div>

            {/* Side 2 */}
            <div className="text-center">
              <div 
                className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-2xl ${
                  winner === 'side2' ? 'ring-4 ring-yellow-400' : ''
                }`}
                style={{ backgroundColor: topic.side2.color }}
              >
                {side2TotalScore}
              </div>
              <p className="text-white mt-3 font-medium">{side2Name}</p>
              {winner === 'side2' && <span className="text-yellow-400">👑</span>}
            </div>
          </div>
        </div>

        {/* Round by Round Results */}
        {roundResults && roundResults.length > 0 && (
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white text-center mb-6">
              {t('results.roundByRound')}
            </h3>
            
            <div className="space-y-4">
              {roundResults.map((result: RoundResult, index: number) => (
                <div 
                  key={index}
                  className="bg-gray-800/50 rounded-xl p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">{t('debate.round')} {result.round}</span>
                    <div className="flex items-center gap-4">
                      <span style={{ color: topic.side1.color }}>{result.side1Score}</span>
                      <span className="text-gray-500">-</span>
                      <span style={{ color: topic.side2.color }}>{result.side2Score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
          >
            <Home size={20} />
            {t('debate.backToHome')}
          </button>
          
          <button
            onClick={() => navigate(`/debate/${topic.id}`)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <RotateCcw size={20} />
            {t('results.playAgain')}
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            <Share2 size={20} />
            {t('results.shareResults')}
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Results;
