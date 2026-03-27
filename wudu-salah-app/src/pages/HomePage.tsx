import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';
import SectionCard from '../components/SectionCard';
import { Sun, Moon, Baby } from 'lucide-react';

export default function HomePage() {
  const { progress, toggleChildMode, getOverallProgress } = useProgress();
  const { isDark, toggleTheme } = useTheme();
  const overallProgress = getOverallProgress();

  const sections = [
    { title: 'تعلم الوضوء', description: 'تعلم الوضوء الصحيح خطوة بخطوة', icon: '💧', path: '/wudu', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)' },
    { title: 'تعلم الصلاة', description: 'تعلم الصلاة الصحيحة بالتفصيل', icon: '🕌', path: '/salah', gradient: 'linear-gradient(135deg, #059669, #34d399)' },
    { title: 'الأذكار', description: 'أذكار بعد الوضوء والصلاة', icon: '🤲', path: '/adhkar', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
    { title: 'الاختبارات', description: 'اختبر معلوماتك في الوضوء والصلاة', icon: '📝', path: '/quiz', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { title: 'قسم الأطفال', description: 'تعليم مبسط وممتع للأطفال', icon: '👶', path: '/children', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { title: 'قسم الكبار', description: 'شرح مفصل ومنظم للكبار', icon: '📖', path: '/adults', gradient: 'linear-gradient(135deg, #0e7490, #0891b2)' },
    { title: 'الإنجازات', description: 'تتبع تقدمك وإنجازاتك', icon: '🏆', path: '/achievements', gradient: 'linear-gradient(135deg, #dc2626, #f87171)' },
    { title: 'الأسئلة الشائعة', description: 'إجابات على الأسئلة المتكررة', icon: '❓', path: '/faq', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-bl from-primary to-secondary text-white px-4 pt-8 pb-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={toggleChildMode} className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${progress.childMode ? 'bg-accent text-white' : 'bg-white/20 hover:bg-white/30'}`}>
              <Baby size={18} />
            </button>
          </div>
          <span className="text-4xl">🕌</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">تعلم الوضوء والصلاة</h1>
        <p className="text-white/80 text-sm mb-4">تعليم سهل وواضح للجميع</p>

        {/* Progress */}
        <div className="bg-white/15 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">تقدمك العام</span>
            <span className="text-sm font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: overallProgress + '%' }} />
          </div>
        </div>

        {progress.childMode && (
          <div className="mt-3 bg-accent/30 rounded-lg px-3 py-2 text-sm">
            👶 وضع الأطفال مفعّل - الشرح مبسط وسهل
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="px-4 py-4 space-y-3">
        {sections.map((section, i) => (
          <SectionCard key={section.path} {...section} delay={i * 80} />
        ))}
      </div>
    </div>
  );
}
