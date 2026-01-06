import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Settings, Code } from 'lucide-react';
import type { SiteSettings } from '../../types';

interface SiteClosedPageProps {
  settings: SiteSettings;
}

const SiteClosedPage: React.FC<SiteClosedPageProps> = ({ settings }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  const closureMessage = isArabic ? settings.closureMessage_ar : settings.closureMessage_en;
  const siteName = isArabic ? settings.siteName_ar : settings.siteName_en;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
      >
        {isArabic ? 'English' : 'العربية'}
      </button>

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center">
        {/* Lock Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Lock size={48} className="text-white" />
        </div>

        {/* Site Name */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {siteName}
        </h1>

        {/* Closure Title */}
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          {isArabic ? 'الموقع مغلق حالياً' : 'Site Currently Closed'}
        </h2>

        {/* Closure Message */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700 text-lg leading-relaxed">
            {closureMessage || (isArabic ? 'المتجر مغلق حالياً للصيانة.' : 'The store is currently closed for maintenance.')}
          </p>
        </div>

        {/* Admin Access Button */}
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
        >
          <Settings size={20} />
          {isArabic ? 'إدارة الموقع' : 'Site Management'}
        </Link>

        {/* Footer */}
        <p className="mt-6 text-sm text-gray-500">
          {isArabic ? 'نعتذر عن الإزعاج. سنعود قريباً!' : 'We apologize for the inconvenience. We will be back soon!'}
        </p>

        {/* Developer Credit */}
        {settings?.developerName && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2">
              <Code size={16} className="text-purple-500" />
              <span className="text-gray-500 text-sm">
                {isArabic ? 'تطوير بواسطة' : 'Developed by'}
              </span>
              <span 
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"
                style={{
                  animation: 'float 2s ease-in-out infinite, gradient 3s ease infinite',
                  backgroundSize: '200% 200%'
                }}
              >
                {settings.developerName}
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default SiteClosedPage;
