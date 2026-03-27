import { salahIntro } from '../data/salahData';
import SubSectionCard from '../components/SubSectionCard';
import { useProgress } from '../contexts/ProgressContext';

export default function SalahIntroPage() {
  const { completeLesson } = useProgress();
  completeLesson('salah-intro');

  const subSections = [
    { title: 'شروط الصلاة', description: 'شروط صحة الصلاة', icon: '✅', path: '/salah/conditions', count: 9 },
    { title: 'أركان الصلاة', description: 'الأركان التي لا تسقط', icon: '🏛️', path: '/salah/pillars', count: 13 },
    { title: 'واجبات الصلاة', description: 'الواجبات التي تجبر بالسهو', icon: '📋', path: '/salah/obligations', count: 8 },
    { title: 'سنن الصلاة', description: 'السنن المستحبة', icon: '⭐', path: '/salah/sunnah', count: 9 },
    { title: 'خطوات الصلاة', description: 'الصلاة خطوة بخطوة', icon: '🕌', path: '/salah/steps', count: 13 },
    { title: 'الأخطاء الشائعة', description: 'تجنب الأخطاء في الصلاة', icon: '⚠️', path: '/salah/mistakes', count: 8 },
    { title: 'مبطلات الصلاة', description: 'ما يبطل الصلاة', icon: '🚫', path: '/salah/invalidators', count: 8 },
  ];

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      <div className="bg-gradient-to-br from-secondary to-secondary-light rounded-2xl p-5 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">{salahIntro.title}</h2>
        <p className="text-white/90 text-sm leading-relaxed mb-3">{salahIntro.definition}</p>
        <p className="text-white/80 text-sm leading-relaxed">{salahIntro.importance}</p>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-text-primary dark:text-dark-text mb-3">🕛 أوقات الصلاة</h3>
        <div className="space-y-2">
          {salahIntro.prayerTimes.map((pt, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/5 dark:bg-secondary/10 rounded-lg p-2">
              <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">{i + 1}</span>
              <div>
                <span className="font-bold text-text-primary dark:text-dark-text text-sm">{pt.name}</span>
                <span className="text-text-secondary dark:text-dark-text-secondary text-xs mr-2"> - {pt.rakaat}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {subSections.map((s) => (
          <SubSectionCard key={s.path} {...s} />
        ))}
      </div>
    </div>
  );
}
