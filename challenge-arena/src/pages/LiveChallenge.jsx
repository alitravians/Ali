import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue } from 'firebase/database';
import { ArrowLeft, Clock } from 'lucide-react';

function LiveChallenge({ onNavigate }) {
  const { t } = useLanguage();
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [challengeEnded, setChallengeEnded] = useState(false);

  useEffect(() => {
    const challengesRef = ref(database, 'approvedChallenges');
    const unsubscribe = onValue(challengesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const now = new Date();
        
        const liveChallenge = Object.entries(data).find(([key, challenge]) => {
          const challengeTime = new Date(challenge.dateTime);
          const endTime = new Date(challengeTime.getTime() + 10 * 60 * 1000);
          return now >= challengeTime && now <= endTime && !challenge.result;
        });

        if (liveChallenge) {
          setCurrentChallenge({ id: liveChallenge[0], ...liveChallenge[1] });
        } else {
          setCurrentChallenge(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentChallenge) return;

    const timer = setInterval(() => {
      const now = new Date();
      const challengeTime = new Date(currentChallenge.dateTime);
      const endTime = new Date(challengeTime.getTime() + 10 * 60 * 1000);
      const diff = endTime - now;

      if (diff <= 0) {
        setChallengeEnded(true);
        setTimeRemaining(null);
        clearInterval(timer);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining({ minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentChallenge]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all shadow-lg border border-white/10 backdrop-blur-sm"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent">{t('liveChallenge')}</h1>
      </div>

      {!currentChallenge ? (
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl rounded-3xl p-12 shadow-2xl text-center border border-white/10">
          <div className="text-6xl mb-6">📺</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            لا يوجد تحدي مباشر حالياً
          </h2>
          <p className="text-gray-300 text-lg">
            تابع سجل التحديات لمعرفة مواعيد التحديات القادمة
          </p>
          <button
            onClick={() => onNavigate('registry')}
            className="mt-6 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/50 transform hover:scale-105"
          >
            عرض سجل التحديات
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-br from-red-600/30 to-purple-600/30 backdrop-blur-xl rounded-3xl p-3 shadow-2xl border border-red-500/30">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="text-center mb-8">
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 rounded-full text-white font-bold text-lg mb-4 animate-pulse shadow-lg shadow-red-500/50">
                  🔴 مباشر الآن
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  التحدي الرسمي
                </h2>
                <p className="text-gray-300 text-lg">
                  {new Date(currentChallenge.dateTime).toLocaleString('ar-EG')}
                </p>
              </div>

              <div className="flex justify-between items-center mb-8">
                <div className="flex-1 text-center">
                  <img
                    src={currentChallenge.opponent1Avatar || '/default-avatar.png'}
                    alt={currentChallenge.opponent1}
                    className="w-32 h-32 rounded-full border-4 border-orange-500 mx-auto mb-4 shadow-xl shadow-orange-500/50"
                  />
                  <h3 className="text-2xl font-bold text-white">
                    {currentChallenge.opponent1}
                  </h3>
                </div>

                <div className="flex-shrink-0 px-8">
                  <div className="text-7xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">VS</div>
                </div>

                <div className="flex-1 text-center">
                  <img
                    src={currentChallenge.opponent2Avatar || '/default-avatar.png'}
                    alt={currentChallenge.opponent2}
                    className="w-32 h-32 rounded-full border-4 border-purple-500 mx-auto mb-4 shadow-xl shadow-purple-500/50"
                  />
                  <h3 className="text-2xl font-bold text-white">
                    {currentChallenge.opponent2}
                  </h3>
                </div>
              </div>

              {timeRemaining && !challengeEnded && (
                <div className="bg-purple-500/20 border-2 border-purple-500/50 rounded-2xl p-8 text-center backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Clock className="text-purple-400" size={36} />
                    <h3 className="text-2xl font-bold text-white">
                      {t('timeRemaining')}
                    </h3>
                  </div>
                  <div className="text-8xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {String(timeRemaining.minutes).padStart(2, '0')}:
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </div>
                  <p className="text-gray-300 mt-4 text-lg">{t('minutes')}</p>
                </div>
              )}

              {challengeEnded && !currentChallenge.result && (
                <div className="bg-orange-500/20 border-2 border-orange-500/50 rounded-2xl p-6 text-center backdrop-blur-sm">
                  <h3 className="text-2xl font-bold text-orange-300 mb-2">
                    {t('challengeEnded')}
                  </h3>
                  <p className="text-orange-200">
                    {t('waitingForResult')}
                  </p>
                </div>
              )}

              {currentChallenge.result && (
                <div className="bg-green-500/20 border-2 border-green-500/50 rounded-2xl p-6 text-center backdrop-blur-sm">
                  <h3 className="text-2xl font-bold text-green-300 mb-2">
                    النتيجة النهائية
                  </h3>
                  <p className="text-4xl font-bold text-green-400">
                    🏆 {t('winner')}: {currentChallenge.result}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveChallenge;
