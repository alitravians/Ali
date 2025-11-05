import { useState, useEffect } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import { database } from './utils/firebase';
import { ref, onValue } from 'firebase/database';
import { Globe, AlertCircle, Power } from 'lucide-react';
import LoadingScreen from './components/LoadingScreen';
import UpdateNotification from './components/UpdateNotification';
import HomePage from './pages/HomePage';
import ChallengeRegistry from './pages/ChallengeRegistry';
import SubmitChallenge from './pages/SubmitChallenge';
import CheckStatus from './pages/CheckStatus';
import HowToBook from './pages/HowToBook';
import LiveChallenge from './pages/LiveChallenge';
import AdminPanel from './pages/AdminPanel';
import { versionManager } from './utils/versionManager';

function App() {
  const { language, toggleLanguage, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ isOpen: true, closureReason: '' });

  useEffect(() => {
    const savedPage = localStorage.getItem('currentPage') || 'home';
    setCurrentPage(savedPage);
    versionManager.initialize();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-slate-900/50 to-slate-950"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-red-500/20 rounded-full filter blur-3xl opacity-30 animate-float pointer-events-none"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl opacity-30 animate-float pointer-events-none" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full filter blur-3xl opacity-20 animate-pulse-slow pointer-events-none"></div>
        
        <div className="max-w-3xl w-full relative z-10">
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl p-12 shadow-2xl border border-white/10 text-center space-y-8">
            {/* Icon with Gradient Background */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative p-6 bg-gradient-to-br from-red-600 to-orange-600 rounded-full shadow-2xl">
                  <AlertCircle size={80} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>
            
            {/* Title with Gradient */}
            <div className="space-y-3">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent animate-gradient">
                {language === 'ar' ? 'الموقع مغلق مؤقتاً' : 'Site Temporarily Closed'}
              </h1>
              <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full"></div>
            </div>
            
            {/* Closure Reason */}
            {siteSettings.closureReason && (
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-white/5 shadow-inner">
                <p className="text-2xl text-white leading-relaxed font-medium">
                  {siteSettings.closureReason}
                </p>
              </div>
            )}
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={() => navigateTo('admin')}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transform"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Power size={20} />
                  {t('adminPanel')}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur"></div>
              </button>
              <button
                onClick={toggleLanguage}
                className="group relative px-8 py-4 bg-slate-700/50 hover:bg-slate-600/50 backdrop-blur-sm text-white font-bold rounded-xl transition-all border border-white/10 hover:border-white/20 hover:scale-105 transform"
              >
                <span className="flex items-center justify-center gap-2">
                  <Globe size={20} />
                  {language === 'ar' ? 'EN' : 'عربي'}
                </span>
              </button>
            </div>
            
            {/* Footer Message */}
            <div className="pt-6 border-t border-white/5">
              <p className="text-slate-400 text-sm">
                {language === 'ar' ? 'نعتذر عن الإزعاج، سنعود قريباً' : 'Sorry for the inconvenience, we will be back soon'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />;
  }

  const isHome = currentPage === 'home';

  return (
    <div className={`min-h-screen relative overflow-hidden ${isHome ? 'bg-white bg-gradient-to-b from-slate-50 to-white' : 'bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'}`}>
      {/* Update Notification */}
      <UpdateNotification />
      
      {!isHome && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/50 to-slate-950"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl opacity-20 animate-float pointer-events-none"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl opacity-20 animate-float pointer-events-none" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl opacity-20 animate-float pointer-events-none" style={{animationDelay: '4s'}}></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 pointer-events-none"></div>
        </>
      )}
      
      <div className="relative z-10">
        <nav className={`backdrop-blur-xl shadow-2xl sticky top-0 z-50 ${isHome ? 'bg-white/80 border-b border-slate-200' : 'bg-slate-900/80 border-b border-white/10'}`}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigateTo('home')}
                className={`text-2xl font-bold transition-all ${isHome ? 'text-blue-600 hover:text-blue-700' : 'bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent hover:from-orange-400 hover:to-cyan-400'}`}
              >
                {t('siteName')}
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateTo('admin')}
                  className={`px-4 py-2 rounded-lg transition-all ${isHome ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30'}`}
                >
                  {t('adminPanel')}
                </button>
                <button
                  onClick={toggleLanguage}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isHome ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-sm'}`}
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
