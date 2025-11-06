import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue } from 'firebase/database';
import { Crown, Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard() {
  const { language } = useLanguage();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const playersRef = ref(database, 'leaderboard');
    const unsubscribe = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const playersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.points - a.points);
        setPlayers(playersArray);
      } else {
        setPlayers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="text-yellow-500" size={24} />;
    if (index === 1) return <Trophy className="text-slate-400" size={24} />;
    if (index === 2) return <Medal className="text-orange-600" size={24} />;
    return <Award className="text-slate-500" size={20} />;
  };

  const getRankBadge = (index) => {
    const badges = [
      'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg',
      'bg-gradient-to-r from-slate-300 to-slate-500 text-white shadow-md',
      'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md',
    ];
    
    return badges[index] || 'bg-slate-500 text-white';
  };

  return (
    <section className="container mx-auto px-4 mt-10">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Crown className="text-yellow-500" size={32} />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {language === 'ar' ? 'المتصدرون' : 'Leaderboard'}
          </h2>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {language === 'ar' 
            ? 'أفضل اللاعبين في المنصة. تنافس للوصول إلى القمة!'
            : 'Top players on the platform. Compete to reach the top!'}
        </p>

        <div className="grid gap-3">
          {players.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={64} />
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                {language === 'ar' ? 'لا يوجد لاعبون حالياً' : 'No players yet'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
                {language === 'ar' ? 'كن أول من يتصدر القائمة!' : 'Be the first to top the list!'}
              </p>
            </div>
          ) : (
            players.map((player, index) => (
              <div 
                key={player.id} 
                className={`rounded-lg p-4 flex items-center justify-between border transition-all ${
                  index < 3 
                    ? 'bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md' 
                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${getRankBadge(index)}`}>
                    {index < 3 ? getRankIcon(index) : index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                      {player.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Trophy size={14} />
                      <span className="font-semibold">{player.points}</span>
                      <span>{language === 'ar' ? 'نقطة' : 'points'}</span>
                    </p>
                  </div>
                </div>
                {index < 3 && (
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {index === 0 && (language === 'ar' ? '🥇 المركز الأول' : '🥇 1st Place')}
                      {index === 1 && (language === 'ar' ? '🥈 المركز الثاني' : '🥈 2nd Place')}
                      {index === 2 && (language === 'ar' ? '🥉 المركز الثالث' : '🥉 3rd Place')}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
