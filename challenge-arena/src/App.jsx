import { useState, useEffect } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import { database } from './utils/firebase';
import { ref, onValue } from 'firebase/database';
import { Globe, AlertCircle } from 'lucide-react';
import LoadingScreen from './components/LoadingScreen';
import HomePage from './pages/HomePage';
import ChallengeRegistry from './pages/ChallengeRegistry';
import SubmitChallenge from './pages/SubmitChallenge';
import CheckStatus from './pages/CheckStatus';
import HowToBook from './pages/HowToBook';
import LiveChallenge from './pages/LiveChallenge';
import AdminPanel from './pages/AdminPanel';

function App() {
  const { language, toggleLanguage, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ isOpen: true, closureReason: '' });

  useEffect(() => {
    const savedPage = localStorage.getItem('currentPage') || 'home';
    setCurrentPage(savedPage);
  }, []);

  useEffect(() => {
    const settingsRef = ref(database, 'siteSettings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    localStorage.setItem('currentPage', page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'registry':
        return <ChallengeRegistry onNavigate={navigateTo} />;
      case 'submit':
        return <SubmitChallenge onNavigate={navigateTo} />;
      case 'status':
        return <CheckStatus onNavigate={navigateTo} />;
      case 'howto':
        return <HowToBook onNavigate={navigateTo} />;
      case 'live':
        return <LiveChallenge onNavigate={navigateTo} />;
      case 'admin':
        return <AdminPanel onNavigate={navigateTo} onLogout={() => { setIsAdmin(false); navigateTo('home'); }} />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  if (!siteSettings.isOpen && currentPage !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-600 rounded-full">
                <AlertCircle size={64} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              {language === 'ar' ? 'الموقع مغلق مؤقتاً' : 'Site Temporarily Closed'}
            </h1>
            {siteSettings.closureReason && (
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <p className="text-xl text-slate-700">{siteSettings.closureReason}</p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigateTo('admin')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
              >
                {t('adminPanel')}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                <Globe size={20} />
                {language === 'ar' ? 'EN' : 'عربي'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigateTo('home')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('siteName')}
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateTo('admin')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                {t('adminPanel')}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                <Globe size={20} />
                {language === 'ar' ? 'EN' : 'عربي'}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      <footer className="bg-white/50 backdrop-blur-sm border-t border-slate-200 py-4 text-center">
        <p className="text-xs text-slate-500">v2025-11-05.3</p>
      </footer>
    </div>
  );
}

export default App;
