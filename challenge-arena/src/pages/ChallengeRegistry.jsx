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
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">{t('challengeRegistry')}</h1>
            <p className="text-slate-600 text-lg">عرض جميع التحديات المعتمدة</p>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 duration-200 font-semibold"
          >
            <ArrowLeft size={20} />
            العودة للرئيسية
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {challenges.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-xl border border-slate-200">
            <p className="text-slate-600 text-xl">لا توجد تحديات معتمدة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
                <BannerCard challenge={challenge} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChallengeRegistry;
