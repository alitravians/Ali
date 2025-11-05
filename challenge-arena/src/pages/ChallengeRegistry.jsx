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
          className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors shadow-md"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{t('challengeRegistry')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-xl">
            <p className="text-gray-600 text-xl">لا توجد تحديات معتمدة حالياً</p>
          </div>
        ) : (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src={challenge.opponent1Avatar || '/default-avatar.png'}
                    alt={challenge.opponent1}
                    className="w-16 h-16 rounded-full border-4 border-orange-500 shadow-lg"
                  />
                  <div>
                    <p className="text-gray-800 font-bold text-lg">{challenge.opponent1}</p>
                  </div>
                </div>
                <div className="text-purple-600 text-3xl font-bold">VS</div>
                <div className="flex items-center gap-3">
                  <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                    <p className="text-gray-800 font-bold text-lg">{challenge.opponent2}</p>
                  </div>
                  <img
                    src={challenge.opponent2Avatar || '/default-avatar.png'}
                    alt={challenge.opponent2}
                    className="w-16 h-16 rounded-full border-4 border-purple-500 shadow-lg"
                  />
                </div>
              </div>

              <div className="space-y-3 text-gray-600 bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-purple-600" />
                  <span className="font-semibold">{new Date(challenge.dateTime).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-purple-600" />
                  <span className="font-semibold">{new Date(challenge.dateTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {challenge.result && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <p className="text-green-700 font-bold text-center text-lg">
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
