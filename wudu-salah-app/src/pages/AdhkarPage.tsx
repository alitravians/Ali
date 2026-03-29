import { useState , useEffect } from 'react';
import { adhkarAfterWudu, adhkarAfterSalah } from '../data/adhkarData';
import { Heart } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import TappableText from '../components/TappableText';

export default function AdhkarPage() {
  const [tab, setTab] = useState<'wudu' | 'salah'>('wudu');
  const { toggleFavorite, isFavorite, progress, completeLesson } = useProgress();
  const isChild = progress.childMode;
  useEffect(() => { completeLesson('adhkar'); }, [completeLesson]);

  const data = tab === 'wudu' ? adhkarAfterWudu : adhkarAfterSalah;

  return (
    <div className="animate-fade-in">
      {/* Tabs */}
      <div className="px-4 pt-4 flex gap-2">
        <button
          onClick={() => setTab('wudu')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === 'wudu' ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-dark-surface text-text-secondary'
          }`}
        >
          أذكار بعد الوضوء
        </button>
        <button
          onClick={() => setTab('salah')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === 'salah' ? 'bg-secondary text-white shadow-md' : 'bg-white dark:bg-dark-surface text-text-secondary'
          }`}
        >
          أذكار بعد الصلاة
        </button>
      </div>

      {/* Cards */}
      <div className="px-4 py-4 space-y-3">
        {data.map((dhikr) => {
          const fav = isFavorite(dhikr.id);
          return (
            <div key={dhikr.id} className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-bold">
                    {dhikr.count > 1 ? dhikr.count + 'x' : 'مرة'}
                  </span>
                </div>
                <button onClick={() => toggleFavorite(dhikr.id)} className={`p-1 ${fav ? 'text-danger' : 'text-text-tertiary'}`}>
                  <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="mb-2">
                {isChild ? (
                  <TappableText text={dhikr.childText} as="p" className="text-text-primary dark:text-dark-text text-sm leading-relaxed font-medium">
                    {dhikr.childText}
                  </TappableText>
                ) : (
                  <p className="text-text-primary dark:text-dark-text text-sm leading-relaxed font-medium">
                    {dhikr.text}
                  </p>
                )}
              </div>
              {!isChild && (
                <p className="text-text-tertiary dark:text-dark-text-secondary text-xs">📖 {dhikr.source}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
