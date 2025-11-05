import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue } from 'firebase/database';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

function ChallengeRegistry({ onNavigate }) {
  const { t, direction } = useLanguage();
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    const challengesRef = ref(database, 'approvedChallenges');
    const unsubscribe = onValue(challengesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const challengesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setChallenges(challengesList);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-white">{t('challengeRegistry')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-xl">لا توجد تحديات معتمدة حالياً</p>
          </div>
        ) : (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={challenge.opponent1Avatar || '/default-avatar.png'}
                    alt={challenge.opponent1}
                    className="w-12 h-12 rounded-full border-4 border-orange-500"
                  />
                  <div>
                    <p className="text-white font-bold">{challenge.opponent1}</p>
                  </div>
                </div>
                <div className="text-yellow-400 text-2xl font-bold">VS</div>
                <div className="flex items-center gap-4">
                  <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                    <p className="text-white font-bold">{challenge.opponent2}</p>
                  </div>
                  <img
                    src={challenge.opponent2Avatar || '/default-avatar.png'}
                    alt={challenge.opponent2}
                    className="w-12 h-12 rounded-full border-4 border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2 text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{new Date(challenge.dateTime).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{new Date(challenge.dateTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {challenge.result && (
                <div className="mt-4 p-3 bg-green-600 rounded-lg">
                  <p className="text-white font-bold text-center">
                    {t('winner')}: {challenge.result}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChallengeRegistry;
