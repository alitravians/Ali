import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue, push, remove } from 'firebase/database';

export default function Leaderboard() {
  const { language } = useLanguage();
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ name: '', points: '' });

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

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.points) return;
    
    const playersRef = ref(database, 'leaderboard');
    push(playersRef, {
      name: form.name,
      points: parseInt(form.points),
      createdAt: Date.now()
    });
    
    setForm({ name: '', points: '' });
  };

  const handleRemove = (id) => {
    const playerRef = ref(database, `leaderboard/${id}`);
    remove(playerRef);
  };

  return (
    <section className="container mx-auto px-4 mt-10">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          {language === 'ar' ? 'المتصدرون' : 'Leaderboard'}
        </h2>
        
        <form onSubmit={handleAdd} className="grid md:grid-cols-3 gap-3 mb-6">
          <input 
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none"
            placeholder={language === 'ar' ? 'اسم اللاعب' : 'Player Name'}
            value={form.name} 
            onChange={e => setForm({...form, name: e.target.value})} 
          />
          <input 
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none"
            type="number"
            placeholder={language === 'ar' ? 'النقاط' : 'Points'}
            value={form.points} 
            onChange={e => setForm({...form, points: e.target.value})} 
          />
          <button 
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-purple-600 hover:bg-blue-700 dark:hover:bg-purple-700 text-white font-medium transition-colors"
          >
            {language === 'ar' ? 'إضافة' : 'Add'}
          </button>
        </form>

        <div className="grid gap-3">
          {players.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              {language === 'ar' ? 'لا يوجد لاعبون حالياً' : 'No players yet'}
            </p>
          ) : (
            players.map((player, index) => (
              <div 
                key={player.id} 
                className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 flex items-center justify-between border border-slate-200 dark:border-slate-600"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-slate-400' : 
                    index === 2 ? 'bg-orange-600' : 
                    'bg-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{player.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {player.points} {language === 'ar' ? 'نقطة' : 'points'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemove(player.id)}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
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
