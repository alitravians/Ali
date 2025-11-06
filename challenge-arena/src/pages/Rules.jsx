import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue } from 'firebase/database';

export default function Rules() {
  const { language } = useLanguage();
  const [rules, setRules] = useState([]);

  useEffect(() => {
    const rulesRef = ref(database, 'rules');
    const unsubscribe = onValue(rulesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const rulesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => a.order - b.order);
        setRules(rulesArray);
      } else {
        setRules([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="container mx-auto px-4 mt-10">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          {language === 'ar' ? 'قواعد المشاركة' : 'Participation Rules'}
        </h2>
        
        {rules.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            {language === 'ar' ? 'لا توجد قواعد حالياً' : 'No rules yet'}
          </p>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div 
                key={rule.id}
                className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-purple-600 text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {language === 'ar' ? rule.textAr : rule.textEn}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-slate-700 rounded-lg border border-blue-200 dark:border-slate-600">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {language === 'ar' 
              ? '💡 للمزيد من المعلومات أو الاستفسارات، يرجى التواصل مع الإدارة.'
              : '💡 For more information or inquiries, please contact administration.'}
          </p>
        </div>
      </div>
    </section>
  );
}
