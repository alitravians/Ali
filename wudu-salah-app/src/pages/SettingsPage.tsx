import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { Sun, Moon, Baby, RotateCcw, Info, Bell, BellOff, BookOpen, Clock } from 'lucide-react';
import { loadSettings, saveSettings, scheduleNotifications, type NotificationSettings } from '../utils/notificationService';

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { progress, toggleChildMode, resetProgress, getOverallProgress } = useProgress();
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(loadSettings);

  const updateNotifSetting = (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...notifSettings, ...updates };
    setNotifSettings(newSettings);
    saveSettings(newSettings);
    scheduleNotifications(newSettings);
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'م' : 'ص';
    const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
  };

  const cycleTime = (currentHour: number, field: 'dailyReminder' | 'adhkarReminder') => {
    let newHour = currentHour + 1;
    if (newHour >= 24) newHour = 0;
    updateNotifSetting({
      [`${field}Hour`]: newHour,
      [`${field}Minute`]: 0,
    });
  };

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

      {/* Notifications */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={18} className="text-primary" />
          <h3 className="font-bold text-text-primary dark:text-dark-text">التذكيرات والإشعارات</h3>
        </div>

        <div className="space-y-3">
          {/* Daily Reminder */}
          <div className="p-3 rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary">
            <button
              onClick={() => updateNotifSetting({ dailyReminderEnabled: !notifSettings.dailyReminderEnabled })}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={18} className={notifSettings.dailyReminderEnabled ? 'text-primary' : 'text-text-tertiary'} />
                <div className="text-right">
                  <span className="text-text-primary dark:text-dark-text text-sm font-medium block">تذكير المراجعة اليومية</span>
                  <span className="text-text-tertiary text-xs">تذكير يومي بمراجعة الوضوء والصلاة</span>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative ${notifSettings.dailyReminderEnabled ? 'bg-primary' : 'bg-surface-tertiary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${notifSettings.dailyReminderEnabled ? 'left-0.5' : 'left-6'}`} />
              </div>
            </button>
            {notifSettings.dailyReminderEnabled && (
              <button
                onClick={() => cycleTime(notifSettings.dailyReminderHour, 'dailyReminder')}
                className="mt-2 flex items-center gap-2 text-primary text-xs font-medium bg-primary/10 rounded-lg px-3 py-1.5"
              >
                <Clock size={14} />
                <span>الوقت: {formatTime(notifSettings.dailyReminderHour, notifSettings.dailyReminderMinute)}</span>
                <span className="text-text-tertiary">(اضغط للتغيير)</span>
              </button>
            )}
          </div>

          {/* Adhkar Reminder */}
          <div className="p-3 rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary">
            <button
              onClick={() => updateNotifSetting({ adhkarReminderEnabled: !notifSettings.adhkarReminderEnabled })}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {notifSettings.adhkarReminderEnabled
                  ? <Bell size={18} className="text-secondary" />
                  : <BellOff size={18} className="text-text-tertiary" />
                }
                <div className="text-right">
                  <span className="text-text-primary dark:text-dark-text text-sm font-medium block">تذكير الأذكار</span>
                  <span className="text-text-tertiary text-xs">تذكير يومي بأذكار بعد الصلاة</span>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative ${notifSettings.adhkarReminderEnabled ? 'bg-secondary' : 'bg-surface-tertiary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${notifSettings.adhkarReminderEnabled ? 'left-0.5' : 'left-6'}`} />
              </div>
            </button>
            {notifSettings.adhkarReminderEnabled && (
              <button
                onClick={() => cycleTime(notifSettings.adhkarReminderHour, 'adhkarReminder')}
                className="mt-2 flex items-center gap-2 text-secondary text-xs font-medium bg-secondary/10 rounded-lg px-3 py-1.5"
              >
                <Clock size={14} />
                <span>الوقت: {formatTime(notifSettings.adhkarReminderHour, notifSettings.adhkarReminderMinute)}</span>
                <span className="text-text-tertiary">(اضغط للتغيير)</span>
              </button>
            )}
          </div>

          {/* Weekly Motivation */}
          <div className="p-3 rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary">
            <button
              onClick={() => updateNotifSetting({ weeklyMotivationEnabled: !notifSettings.weeklyMotivationEnabled })}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{notifSettings.weeklyMotivationEnabled ? '🏆' : '🔕'}</span>
                <div className="text-right">
                  <span className="text-text-primary dark:text-dark-text text-sm font-medium block">تحفيز أسبوعي</span>
                  <span className="text-text-tertiary text-xs">تذكير كل جمعة بإكمال الاختبارات</span>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative ${notifSettings.weeklyMotivationEnabled ? 'bg-accent' : 'bg-surface-tertiary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${notifSettings.weeklyMotivationEnabled ? 'left-0.5' : 'left-6'}`} />
              </div>
            </button>
          </div>
        </div>
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
        <p className="text-text-tertiary text-xs mt-2">الإصدار 1.6.0</p>
      </div>
    </div>
  );
}
