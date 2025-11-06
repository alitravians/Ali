import { useLanguage } from '../contexts/LanguageContext';
import { useThemeStore } from '../store/useThemeStore';

function Updates() {
  const { language, t } = useLanguage();
  const theme = useThemeStore((state) => state.theme);

  const updates = [
    {
      date: '2025-11-06 03:20',
      ar: [
        'إعادة بناء المشروع على Vite + React + Tailwind',
        'دعم كامل RTL + الوضع الليلي مع تذكر الحالة',
        'إضافة React Router وصفحات: الرئيسية/البطولات/المتصدرون/القواعد/تواصل/الإدارة',
        'لوحة إدارة مبسطة (إنشاء/تصفية/حذف/تغيير حالة البطولة) — تخزين على Firebase',
        'تحسين SEO وPWA (manifest + service worker)',
        'مكونات مشتركة (Navbar, Footer) وتصميم بطاقات وأزرار احترافي',
        'دليل عربي شامل للتثبيت والربط مع Firebase',
      ],
      en: [
        'Rebuilt project on Vite + React + Tailwind',
        'Full RTL support + dark mode with state persistence',
        'Added React Router and pages: Home/Tournaments/Leaderboard/Rules/Contact/Admin',
        'Simplified admin panel (create/filter/delete/change tournament status) — Firebase storage',
        'SEO and PWA improvements (manifest + service worker)',
        'Shared components (Navbar, Footer) with professional card and button design',
        'Comprehensive Arabic guide for installation and Firebase integration',
      ]
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className={`max-w-4xl mx-auto ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          <h1 className={`text-4xl font-bold mb-8 text-center ${language === 'ar' ? 'font-arabic' : ''}`}>
            {t('updatesTitle')}
          </h1>

          <div className="space-y-8">
            {updates.map((update, index) => (
              <div
                key={index}
                className={`rounded-lg p-6 shadow-lg ${
                  theme === 'dark'
                    ? 'bg-slate-900 border border-slate-800'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <div className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {update.date}
                </div>
                <ul className={`space-y-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {(language === 'ar' ? update.ar : update.en).map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className={`flex items-start gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                    >
                      <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-600'
                      }`}></span>
                      <span className={`flex-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={`mt-12 p-6 rounded-lg ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/30'
              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' ? 'قادم قريباً' : 'Coming Soon'}
            </h2>
            <ul className={`space-y-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' ? (
                <>
                  <li className="flex items-center gap-2 flex-row-reverse">
                    <span>⏳</span>
                    <span>تحسينات إضافية للأداء</span>
                  </li>
                  <li className="flex items-center gap-2 flex-row-reverse">
                    <span>⏳</span>
                    <span>ميزات جديدة للبطولات</span>
                  </li>
                  <li className="flex items-center gap-2 flex-row-reverse">
                    <span>⏳</span>
                    <span>نظام إشعارات متقدم</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <span>⏳</span>
                    <span>Additional performance improvements</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>⏳</span>
                    <span>New tournament features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>⏳</span>
                    <span>Advanced notification system</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Updates;
