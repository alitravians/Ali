import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { Sun, Moon, Baby, RotateCcw, Info } from 'lucide-react';

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { progress, toggleChildMode, resetProgress, getOverallProgress } = useProgress();

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Theme */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-text-primary dark:text-dark-text mb-3">المظهر</h3>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary"
        >
          <div className="flex items-center gap-3">
            {isDark ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-accent" />}
            <span className="text-text-primary dark:text-dark-text text-sm font-medium">
              {isDark ? 'الوضع الليلي' : 'الوضع العادي'}
            </span>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? 'bg-primary' : 'bg-surface-tertiary'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${isDark ? 'left-0.5' : 'left-6'}`} />
          </div>
        </button>
      </div>

      {/* Child Mode */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-text-primary dark:text-dark-text mb-3">وضع الأطفال</h3>
        <button
          onClick={toggleChildMode}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary"
        >
          <div className="flex items-center gap-3">
            <Baby size={20} className={progress.childMode ? 'text-children-primary' : 'text-text-tertiary'} />
            <div>
              <span className="text-text-primary dark:text-dark-text text-sm font-medium block">
                {progress.childMode ? 'وضع الأطفال مفعّل' : 'وضع الأطفال معطّل'}
              </span>
              <span className="text-text-tertiary text-xs">شرح مبسط وكلمات سهلة</span>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors relative ${progress.childMode ? 'bg-children-primary' : 'bg-surface-tertiary'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${progress.childMode ? 'left-0.5' : 'left-6'}`} />
          </div>
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-text-primary dark:text-dark-text mb-3">التقدم</h3>
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary dark:text-dark-text-secondary">الدروس المكتملة</span>
            <span className="font-bold text-text-primary dark:text-dark-text">{progress.completedLessons.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary dark:text-dark-text-secondary">المفضلة</span>
            <span className="font-bold text-text-primary dark:text-dark-text">{progress.favorites.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary dark:text-dark-text-secondary">التقدم العام</span>
            <span className="font-bold text-primary">{getOverallProgress()}%</span>
          </div>
        </div>
        <div className="w-full h-2 bg-surface-tertiary rounded-full">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: getOverallProgress() + '%' }} />
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() => {
          if (confirm('هل أنت متأكد من إعادة تعيين التقدم؟ سيتم حذف جميع البيانات المحفوظة.')) {
            resetProgress();
          }
        }}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-danger/10 text-danger font-bold text-sm hover:bg-danger/20 transition-colors"
      >
        <RotateCcw size={18} />
        إعادة تعيين التقدم
      </button>

      {/* About */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Info size={18} className="text-primary" />
          <h3 className="font-bold text-text-primary dark:text-dark-text">عن التطبيق</h3>
        </div>
        <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
          تطبيق تعلم الوضوء والصلاة - تعليم سهل وواضح للجميع
        </p>
        <p className="text-text-tertiary text-xs mt-2">الإصدار 1.0.0</p>
      </div>
    </div>
  );
}
