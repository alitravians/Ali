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
          className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-white">{t('liveChallenge')}</h1>
      </div>

      {!currentChallenge ? (
        <div className="max-w-4xl mx-auto bg-slate-800 rounded-xl p-12 shadow-lg text-center">
          <div className="text-6xl mb-6">📺</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            لا يوجد تحدي مباشر حالياً
          </h2>
          <p className="text-gray-400 text-lg">
            تابع سجل التحديات لمعرفة مواعيد التحديات القادمة
          </p>
          <button
            onClick={() => onNavigate('registry')}
            className="mt-6 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
          >
            عرض سجل التحديات
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-br from-red-600 to-purple-600 rounded-xl p-2 shadow-2xl">
            <div className="bg-slate-900 rounded-lg p-8">
              <div className="text-center mb-8">
                <div className="inline-block px-6 py-2 bg-red-600 rounded-full text-white font-bold text-lg mb-4 animate-pulse">
                  🔴 مباشر الآن
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  التحدي الرسمي
                </h2>
                <p className="text-gray-400">
                  {new Date(currentChallenge.dateTime).toLocaleString('ar-EG')}
                </p>
              </div>

              <div className="flex justify-between items-center mb-8">
                <div className="flex-1 text-center">
                  <img
                    src={currentChallenge.opponent1Avatar || '/default-avatar.png'}
                    alt={currentChallenge.opponent1}
                    className="w-24 h-24 rounded-full border-4 border-orange-500 mx-auto mb-4"
                  />
                  <h3 className="text-2xl font-bold text-white">
                    {currentChallenge.opponent1}
                  </h3>
                </div>

                <div className="flex-shrink-0 px-8">
                  <div className="text-6xl font-bold text-yellow-400">VS</div>
                </div>

                <div className="flex-1 text-center">
                  <img
                    src={currentChallenge.opponent2Avatar || '/default-avatar.png'}
                    alt={currentChallenge.opponent2}
                    className="w-24 h-24 rounded-full border-4 border-purple-500 mx-auto mb-4"
                  />
                  <h3 className="text-2xl font-bold text-white">
                    {currentChallenge.opponent2}
                  </h3>
                </div>
              </div>

              {timeRemaining && !challengeEnded && (
                <div className="bg-slate-800 rounded-lg p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Clock className="text-purple-400" size={32} />
                    <h3 className="text-xl font-bold text-white">
                      {t('timeRemaining')}
                    </h3>
                  </div>
                  <div className="text-6xl font-bold text-purple-400">
                    {String(timeRemaining.minutes).padStart(2, '0')}:
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </div>
                  <p className="text-gray-400 mt-2">{t('minutes')}</p>
                </div>
              )}

              {challengeEnded && !currentChallenge.result && (
                <div className="bg-orange-600 rounded-lg p-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t('challengeEnded')}
                  </h3>
                  <p className="text-white">
                    {t('waitingForResult')}
                  </p>
                </div>
              )}

              {currentChallenge.result && (
                <div className="bg-green-600 rounded-lg p-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    النتيجة النهائية
                  </h3>
                  <p className="text-3xl font-bold text-white">
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
