import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue, push, remove, update } from 'firebase/database';

export default function Tournaments() {
  const { language } = useLanguage();
  const [tournaments, setTournaments] = useState([]);
  const [form, setForm] = useState({ name: '', game: '', date: '', status: 'open' });

  useEffect(() => {
    const tournamentsRef = ref(database, 'tournaments');
    const unsubscribe = onValue(tournamentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const tournamentsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setTournaments(tournamentsArray);
      } else {
        setTournaments([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name) return;
    
    const tournamentsRef = ref(database, 'tournaments');
    push(tournamentsRef, {
      name: form.name,
      game: form.game,
      date: form.date,
      status: form.status,
      createdAt: Date.now()
    });
    
    setForm({ name: '', game: '', date: '', status: 'open' });
  };

  const handleRemove = (id) => {
    const tournamentRef = ref(database, `tournaments/${id}`);
    remove(tournamentRef);
  };

  return (
    <section className="container mx-auto px-4 mt-10">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          {language === 'ar' ? 'البطولات' : 'Tournaments'}
        </h2>
        
        <form onSubmit={handleAdd} className="grid md:grid-cols-5 gap-3 mb-6">
          <input 
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none"
            placeholder={language === 'ar' ? 'اسم البطولة' : 'Tournament Name'}
            value={form.name} 
            onChange={e => setForm({...form, name: e.target.value})} 
          />
          <input 
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none"
            placeholder={language === 'ar' ? 'اللعبة' : 'Game'}
            value={form.game} 
            onChange={e => setForm({...form, game: e.target.value})} 
          />
          <input 
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none"
            type="date" 
            value={form.date} 
            onChange={e => setForm({...form, date: e.target.value})} 
          />
          <select 
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none"
            value={form.status} 
            onChange={e => setForm({...form, status: e.target.value})}
          >
            <option value="open">{language === 'ar' ? 'مفتوحة' : 'Open'}</option>
            <option value="upcoming">{language === 'ar' ? 'قادمة' : 'Upcoming'}</option>
            <option value="closed">{language === 'ar' ? 'مغلقة' : 'Closed'}</option>
          </select>
          <button 
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-purple-600 hover:bg-blue-700 dark:hover:bg-purple-700 text-white font-medium transition-colors"
          >
            {language === 'ar' ? 'إضافة' : 'Add'}
          </button>
        </form>

        <div className="grid gap-3">
          {tournaments.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              {language === 'ar' ? 'لا توجد بطولات حالياً' : 'No tournaments yet'}
            </p>
          ) : (
            tournaments.map(t => (
              <div 
                key={t.id} 
                className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-slate-200 dark:border-slate-600"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.game} • {t.date} • {t.status}
                  </p>
                </div>
                <button 
                  onClick={() => handleRemove(t.id)}
                  className="mt-2 md:mt-0 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
