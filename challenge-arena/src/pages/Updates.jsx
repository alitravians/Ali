import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue } from 'firebase/database';
import { Clock, Sparkles } from 'lucide-react';

function Updates() {
  const { language } = useLanguage();
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const updatesRef = ref(database, 'updates');
    const unsubscribe = onValue(updatesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const updatesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
        setUpdates(updatesArray);
      } else {
        setUpdates([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="container mx-auto px-4 mt-10">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="text-blue-600 dark:text-cyan-400" size={32} />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {language === 'ar' ? 'سجل التحديثات' : 'Updates Log'}
          </h2>
        </div>

        {updates.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            {language === 'ar' ? 'لا توجد تحديثات حالياً' : 'No updates yet'}
          </p>
        ) : (
          <div className="space-y-6">
            {updates.map((update) => (
              <div key={update.id} className="border-b border-slate-200 dark:border-slate-700 pb-6 last:border-0">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-blue-600 dark:text-cyan-400" />
                  <span className="text-sm font-mono text-blue-600 dark:text-cyan-400">
                    {update.date}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {language === 'ar' ? update.textAr : update.textEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Updates;
