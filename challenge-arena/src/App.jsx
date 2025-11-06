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
    if (savedPage === 'live') {
      setCurrentPage('home');
      localStorage.setItem('currentPage', 'home');
    } else {
      setCurrentPage(savedPage);
    }
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
      case 'admin':
        return <AdminPanel onNavigate={navigateTo} onLogout={() => { setIsAdmin(false); navigateTo('home'); }} />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  if (!siteSettings.isOpen && currentPage !== 'admin') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {/* Full Background with Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/70 to-slate-950/90"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}></div>
        
        {/* Brand Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <img 
            src="/closure-bg.jpg" 
            alt="" 
            className="w-96 h-96 object-contain"
          />
        </div>
        
        {/* Main Content Card */}
        <div className="max-w-3xl w-full relative z-10">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Card Header with Icon */}
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-white/10 px-8 md:px-12 py-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-40"></div>
                  <div className="relative p-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-xl">
                    <AlertCircle size={64} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
                {language === 'ar' ? 'الموقع مغلق مؤقتاً' : 'Site Temporarily Closed'}
              </h1>
              <div className="h-1 w-24 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
            </div>
            
            {/* Card Body with Closure Reason */}
            <div className="px-8 md:px-12 py-10 space-y-8">
              {siteSettings.closureReason && (
                <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-8 border border-white/5">
                  <p className="text-xl md:text-2xl text-slate-100 leading-relaxed text-center font-medium">
                    {siteSettings.closureReason}
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                  onClick={() => navigateTo('admin')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transform"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Power size={20} />
                    {t('adminPanel')}
                  </span>
                </button>
                <button
                  onClick={toggleLanguage}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl transition-all border border-white/10 hover:border-white/20 hover:scale-105 transform"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Globe size={20} />
                    {language === 'ar' ? 'EN' : 'عربي'}
                  </span>
                </button>
              </div>
              
              {/* Footer Message */}
              <div className="pt-6 border-t border-white/5 text-center">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {language === 'ar' ? 'نعتذر عن الإزعاج، سنعود قريباً' : 'Sorry for the inconvenience, we will be back soon'}
                </p>
              </div>
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
