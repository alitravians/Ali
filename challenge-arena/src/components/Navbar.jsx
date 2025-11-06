import { Link } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 transition-colors">
            <span>{t('siteName')}</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-purple-600 hover:bg-blue-700 dark:hover:bg-purple-700 text-white transition-colors shadow-sm"
            >
              {t('adminPanel')}
            </Link>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Globe size={20} />
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
