import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue } from 'firebase/database';
import { ArrowLeft } from 'lucide-react';
import BannerCard from '../components/BannerCard';

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

      <div className="space-y-8">
        {challenges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-xl">
            <p className="text-gray-600 text-xl">لا توجد تحديات معتمدة حالياً</p>
          </div>
        ) : (
          challenges.map((challenge) => (
            <BannerCard key={challenge.id} challenge={challenge} />
          ))
        )}
      </div>
    </div>
  );
}

export default ChallengeRegistry;
