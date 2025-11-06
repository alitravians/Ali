import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from './contexts/LanguageContext';
import { database } from './utils/firebase';
import { ref, onValue } from 'firebase/database';
import LoadingScreen from './components/LoadingScreen';
import UpdateNotification from './components/UpdateNotification';
import MaintenancePage from './components/MaintenancePage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ChallengeRegistry from './pages/ChallengeRegistry';
import SubmitChallenge from './pages/SubmitChallenge';
import CheckStatus from './pages/CheckStatus';
import HowToBook from './pages/HowToBook';
import AdminPanel from './pages/AdminPanel';
import Tournaments from './pages/Tournaments';
import Leaderboard from './pages/Leaderboard';
import Rules from './pages/Rules';
import Contact from './pages/Contact';
import { versionManager } from './utils/versionManager';

function App() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState({ isOpen: true, closureReason: '' });
  const [maintenanceSettings, setMaintenanceSettings] = useState(null);

  useEffect(() => {
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

  useEffect(() => {
    const maintenanceRef = ref(database, 'siteSettings/maintenance');
    const unsubscribe = onValue(maintenanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setMaintenanceSettings(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  const navigateTo = (page) => {
    navigate(`/${page === 'home' ? '' : page}`);
  };

  if (!siteSettings.isOpen && location.pathname !== '/admin') {
    return (
      <MaintenancePage 
        settings={{
          ...maintenanceSettings,
          closureReason: siteSettings.closureReason
        }}
        onNavigateToAdmin={() => navigate('/admin')}
      />
    );
  }

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />;
  }

  const isHome = location.pathname === '/';
  const isOldPage = ['/', '/registry', '/submit', '/status', '/howto'].includes(location.pathname);

  return (
    <div className={`min-h-screen flex flex-col ${isHome ? 'bg-white dark:bg-slate-950 bg-gradient-to-b from-slate-50 dark:from-slate-900 to-white dark:to-slate-950' : isOldPage ? 'bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-white dark:bg-slate-950'}`}>
      <UpdateNotification />
      
      {!isHome && isOldPage && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/50 to-slate-950"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl opacity-20 animate-float pointer-events-none"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl opacity-20 animate-float pointer-events-none" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl opacity-20 animate-float pointer-events-none" style={{animationDelay: '4s'}}></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 pointer-events-none"></div>
        </>
      )}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage onNavigate={navigateTo} />} />
            <Route path="/registry" element={<ChallengeRegistry onNavigate={navigateTo} />} />
            <Route path="/submit" element={<SubmitChallenge onNavigate={navigateTo} />} />
            <Route path="/status" element={<CheckStatus onNavigate={navigateTo} />} />
            <Route path="/howto" element={<HowToBook onNavigate={navigateTo} />} />
            <Route path="/admin" element={<AdminPanel onNavigate={navigateTo} onLogout={() => navigate('/')} />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

export default App;
