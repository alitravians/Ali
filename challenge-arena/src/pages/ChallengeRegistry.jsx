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
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all shadow-lg border border-white/10 backdrop-blur-sm"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent">{t('challengeRegistry')}</h1>
      </div>

      <div className="space-y-8">
        {challenges.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10">
            <p className="text-gray-300 text-xl">لا توجد تحديات معتمدة حالياً</p>
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
