import { useProgress } from '../contexts/ProgressContext';
import { wuduSteps, wuduConditions, wuduInvalidators } from '../data/wuduData';
import { salahSteps, salahConditions, salahPillars, salahObligations, salahSunnah, salahInvalidators } from '../data/salahData';
import { adhkarAfterWudu, adhkarAfterSalah } from '../data/adhkarData';
import { Heart, Trash2 } from 'lucide-react';

export default function FavoritesPage() {
  const { progress, toggleFavorite } = useProgress();
  const favIds = progress.favorites;

  const allItems = [
    ...wuduSteps.map(s => ({ id: s.id, title: s.title, desc: s.description, icon: s.icon, type: 'وضوء' })),
    ...wuduConditions.map(c => ({ id: c.id, title: c.title, desc: c.description, icon: c.icon, type: 'شروط الوضوء' })),
    ...wuduInvalidators.map(i => ({ id: i.id, title: i.title, desc: i.description, icon: i.icon, type: 'مبطلات الوضوء' })),
    ...salahSteps.map(s => ({ id: s.id, title: s.title, desc: s.description, icon: s.icon, type: 'صلاة' })),
    ...salahConditions.map((c, i) => ({ id: `sc-${i}`, title: c.title, desc: c.description, icon: c.icon, type: 'شروط الصلاة' })),
    ...salahPillars.map((p, i) => ({ id: `sp-${i}`, title: p.title, desc: p.description, icon: p.icon, type: 'أركان' })),
    ...salahObligations.map((o, i) => ({ id: `so-${i}`, title: o.title, desc: o.description, icon: o.icon, type: 'واجبات' })),
    ...salahSunnah.map((s, i) => ({ id: `ss-${i}`, title: s.title, desc: s.description, icon: s.icon, type: 'سنن' })),
    ...salahInvalidators.map((inv, i) => ({ id: `si-${i}`, title: inv.title, desc: inv.description, icon: inv.icon, type: 'مبطلات الصلاة' })),
    ...adhkarAfterWudu.map(d => ({ id: d.id, title: d.text.slice(0, 40) + '...', desc: d.source, icon: '🤲', type: 'أذكار' })),
    ...adhkarAfterSalah.map(d => ({ id: d.id, title: d.text.slice(0, 40) + '...', desc: d.source, icon: '🤲', type: 'أذكار' })),
  ];

  const favItems = allItems.filter(item => favIds.includes(item.id));

  return (
    <div className="px-4 py-4 animate-fade-in">
      {favItems.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="text-text-tertiary mx-auto mb-3" />
          <h3 className="text-text-primary dark:text-dark-text font-bold text-lg mb-1">لا توجد مفضلات</h3>
          <p className="text-text-secondary dark:text-dark-text-secondary text-sm">اضغط على أيقونة القلب لإضافة عناصر للمفضلة</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-text-secondary dark:text-dark-text-secondary text-sm">{favItems.length} عنصر في المفضلة</p>
          {favItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm flex items-start gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{item.type}</span>
                </div>
                <h3 className="font-bold text-text-primary dark:text-dark-text text-sm">{item.title}</h3>
                <p className="text-text-secondary dark:text-dark-text-secondary text-xs mt-1">{item.desc}</p>
              </div>
              <button onClick={() => toggleFavorite(item.id)} className="text-danger p-1">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
