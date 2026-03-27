import { useProgress } from '../contexts/ProgressContext';
import { Trophy, Lock } from 'lucide-react';

const allAchievements = [
  { id: 'wudu-intro', title: 'بداية الرحلة', desc: 'أكملت مقدمة الوضوء', icon: '💧' },
  { id: 'wudu-conditions', title: 'عارف الشروط', desc: 'تعلمت شروط الوضوء', icon: '✅' },
  { id: 'wudu-steps', title: 'متوضئ', desc: 'تعلمت خطوات الوضوء', icon: '👏' },
  { id: 'wudu-mistakes', title: 'متجنب الأخطاء', desc: 'تعلمت أخطاء الوضوء', icon: '⚠️' },
  { id: 'wudu-invalidators', title: 'حافظ الوضوء', desc: 'تعلمت مبطلات الوضوء', icon: '🛡️' },
  { id: 'salah-intro', title: 'بداية الصلاة', desc: 'أكملت مقدمة الصلاة', icon: '🕌' },
  { id: 'salah-conditions', title: 'عارف شروط الصلاة', desc: 'تعلمت شروط الصلاة', icon: '📋' },
  { id: 'salah-pillars', title: 'عارف الأركان', desc: 'تعلمت أركان الصلاة', icon: '🏛️' },
  { id: 'salah-obligations', title: 'عارف الواجبات', desc: 'تعلمت واجبات الصلاة', icon: '📝' },
  { id: 'salah-steps', title: 'مصلّي', desc: 'تعلمت خطوات الصلاة', icon: '🤲' },
  { id: 'adhkar', title: 'ذاكر', desc: 'تعلمت الأذكار', icon: '🌟' },
  { id: 'quiz-all', title: 'متفوق', desc: 'حصلت على 80% في الاختبار', icon: '🏆' },
  { id: 'perfect-all', title: 'متميز', desc: 'حصلت على 100% في الاختبار', icon: '🥇' },
];

export default function AchievementsPage() {
  const { progress, getOverallProgress } = useProgress();
  const overallProgress = getOverallProgress();
  const completedCount = progress.completedLessons.length;

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Stats */}
      <div className="bg-gradient-to-br from-accent to-accent-light rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <Trophy size={40} />
          <div>
            <h2 className="text-xl font-bold">إنجازاتك</h2>
            <p className="text-white/80 text-sm">أكملت {completedCount} درس - التقدم {overallProgress}%</p>
          </div>
        </div>
        <div className="mt-3 w-full h-2 bg-white/20 rounded-full">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: overallProgress + '%' }} />
        </div>
      </div>

      {/* Achievement badges */}
      <div className="grid grid-cols-2 gap-3">
        {allAchievements.map((ach) => {
          const unlocked = progress.completedLessons.includes(ach.id) || progress.achievements.includes(ach.id);
          return (
            <div
              key={ach.id}
              className={`rounded-xl p-4 text-center shadow-sm transition-all ${
                unlocked ? 'bg-white dark:bg-dark-surface' : 'bg-surface-tertiary dark:bg-dark-surface-secondary opacity-60'
              }`}
            >
              <div className="text-3xl mb-2">{unlocked ? ach.icon : ''}</div>
              {!unlocked && <Lock size={24} className="mx-auto mb-2 text-text-tertiary" />}
              <h3 className={`font-bold text-sm ${unlocked ? 'text-text-primary dark:text-dark-text' : 'text-text-tertiary'}`}>{ach.title}</h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">{ach.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
