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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-slate-800 rounded-xl p-8 shadow-2xl text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-600 rounded-full">
                <AlertCircle size={64} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white">
              {language === 'ar' ? 'الموقع مغلق مؤقتاً' : 'Site Temporarily Closed'}
            </h1>
            {siteSettings.closureReason && (
              <div className="bg-slate-700 p-6 rounded-lg">
                <p className="text-xl text-white">{siteSettings.closureReason}</p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigateTo('admin')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
              >
                {t('adminPanel')}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-purple-100/30 to-pink-100/30 pointer-events-none"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float pointer-events-none" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float pointer-events-none" style={{animationDelay: '4s'}}></div>
      <div className="relative z-10">
      <nav className="bg-white bg-opacity-95 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigateTo('home')}
              className="text-2xl font-bold text-gray-800 hover:text-purple-600 transition-colors"
            >
              {t('siteName')}
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateTo('admin')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
              >
                {t('adminPanel')}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
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
      </div>
    </div>
  );
}

export default App;
