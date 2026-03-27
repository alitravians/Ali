import SubSectionCard from '../components/SubSectionCard';

export default function AdultsPage() {
  const wuduSections = [
    { title: 'مقدمة عن الوضوء', description: 'تعريف وفضائل الوضوء', icon: '📖', path: '/wudu' },
    { title: 'شروط الوضوء', description: 'شروط صحة الوضوء', icon: '✅', path: '/wudu/conditions', count: 6 },
    { title: 'خطوات الوضوء', description: 'الخطوات بالتفصيل', icon: '💧', path: '/wudu/steps', count: 10 },
    { title: 'الأخطاء الشائعة', description: 'أخطاء يجب تجنبها', icon: '⚠️', path: '/wudu/mistakes', count: 8 },
    { title: 'مبطلات الوضوء', description: 'نواقض الوضوء', icon: '🚫', path: '/wudu/invalidators', count: 6 },
  ];

  const salahSections = [
    { title: 'مقدمة عن الصلاة', description: 'تعريف وأهمية الصلاة', icon: '📖', path: '/salah' },
    { title: 'شروط الصلاة', description: 'شروط صحة الصلاة', icon: '✅', path: '/salah/conditions', count: 9 },
    { title: 'أركان الصلاة', description: 'الأركان التي لا تسقط', icon: '🏛️', path: '/salah/pillars', count: 13 },
    { title: 'واجبات الصلاة', description: 'الواجبات المطلوبة', icon: '📋', path: '/salah/obligations', count: 8 },
    { title: 'سنن الصلاة', description: 'السنن المستحبة', icon: '⭐', path: '/salah/sunnah', count: 9 },
    { title: 'خطوات الصلاة', description: 'الصلاة خطوة بخطوة', icon: '🕌', path: '/salah/steps', count: 13 },
    { title: 'الأخطاء الشائعة', description: 'أخطاء يجب تجنبها', icon: '⚠️', path: '/salah/mistakes', count: 8 },
    { title: 'مبطلات الصلاة', description: 'ما يبطل الصلاة', icon: '🚫', path: '/salah/invalidators', count: 8 },
  ];

  return (
    <div className="px-4 py-4 space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-primary-dark to-primary rounded-2xl p-5 text-white shadow-lg text-center">
        <span className="text-3xl block mb-2">📖</span>
        <h2 className="text-xl font-bold mb-1">قسم الكبار</h2>
        <p className="text-white/80 text-sm">شرح مفصل ومنظم للوضوء والصلاة</p>
      </div>

      <div>
        <h3 className="font-bold text-text-primary dark:text-dark-text text-lg mb-3 flex items-center gap-2">
          <span>💧</span> الوضوء
        </h3>
        <div className="space-y-2">
          {wuduSections.map((s) => <SubSectionCard key={s.path} {...s} />)}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-text-primary dark:text-dark-text text-lg mb-3 flex items-center gap-2">
          <span>🕌</span> الصلاة
        </h3>
        <div className="space-y-2">
          {salahSections.map((s) => <SubSectionCard key={s.path} {...s} />)}
        </div>
      </div>
    </div>
  );
}
