import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue } from 'firebase/database';
import { Trophy, Calendar, Gamepad2 } from 'lucide-react';

export default function Tournaments() {
  const { language } = useLanguage();
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    const tournamentsRef = ref(database, 'tournaments');
    const unsubscribe = onValue(tournamentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const tournamentsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
        setTournaments(tournamentsArray);
      } else {
        setTournaments([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      open: {
        ar: 'مفتوحة',
        en: 'Open',
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      },
      upcoming: {
        ar: 'قادمة',
        en: 'Upcoming',
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      },
      closed: {
        ar: 'مغلقة',
        en: 'Closed',
        color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
      }
    };
    
    const badge = badges[status] || badges.closed;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        {language === 'ar' ? badge.ar : badge.en}
      </span>
    );
  };

  return (
    <section className="container mx-auto px-4 mt-10">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-blue-600 dark:text-cyan-400" size={32} />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {language === 'ar' ? 'البطولات' : 'Tournaments'}
          </h2>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {language === 'ar' 
            ? 'تابع البطولات القادمة والمفتوحة للتسجيل. للمشاركة، يرجى التواصل مع الإدارة.'
            : 'Follow upcoming and open tournaments for registration. To participate, please contact administration.'}
        </p>

        <div className="grid gap-4">
          {tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={64} />
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                {language === 'ar' ? 'لا توجد بطولات حالياً' : 'No tournaments yet'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
                {language === 'ar' ? 'تابعنا لمعرفة البطولات القادمة' : 'Follow us for upcoming tournaments'}
              </p>
            </div>
          ) : (
            tournaments.map(t => (
              <div 
                key={t.id} 
                className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <Trophy className="text-blue-600 dark:text-cyan-400 mt-1" size={24} />
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {t.name}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                          {t.game && (
                            <div className="flex items-center gap-1">
                              <Gamepad2 size={16} />
                              <span>{t.game}</span>
                            </div>
                          )}
                          {t.date && (
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              <span>{t.date}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(t.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
