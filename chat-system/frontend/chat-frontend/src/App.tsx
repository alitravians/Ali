import { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import BanAppealPage from './components/BanAppealPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
  username: string;
  user_id: string;
  role: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'chat' | 'admin' | 'ban-appeal'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [banInfo, setBanInfo] = useState<any>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedLanguage = localStorage.getItem('language');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setCurrentScreen('chat');
    }
    
    if (savedLanguage) {
      setLanguage(savedLanguage as 'ar' | 'en');
    }
  }, []);

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    if (userData.role === 'admin') {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('chat');
    }
  };

  const handleBanned = (banData: any) => {
    setBanInfo(banData);
    const tempUser = {
      username: banData.username,
      user_id: banData.username, // We'll use username as a temporary identifier
      role: 'user'
    };
    localStorage.setItem('user', JSON.stringify(tempUser));
    setCurrentScreen('ban-appeal');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentScreen('login');
  };

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const goToAdmin = () => {
    setCurrentScreen('admin');
  };

  const goToChat = () => {
    setCurrentScreen('chat');
  };

  return (
    <div className={`app ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="language-toggle">
        <button onClick={toggleLanguage} className="language-btn">
          {language === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      {currentScreen === 'login' && (
        <LoginPage 
          onLogin={handleLogin} 
          onBanned={handleBanned}
          language={language}
          apiUrl={API_URL}
        />
      )}

      {currentScreen === 'chat' && user && token && (
        <ChatInterface
          user={user}
          token={token}
          language={language}
          apiUrl={API_URL}
          onLogout={handleLogout}
          onGoToAdmin={user.role === 'admin' ? goToAdmin : undefined}
        />
      )}

      {currentScreen === 'admin' && user && user.role === 'admin' && token && (
        <AdminPanel
          user={user}
          token={token}
          language={language}
          apiUrl={API_URL}
          onLogout={handleLogout}
          onGoToChat={goToChat}
        />
      )}

      {currentScreen === 'ban-appeal' && banInfo && (
        <BanAppealPage
          banInfo={banInfo}
          language={language}
          apiUrl={API_URL}
          onBack={() => setCurrentScreen('login')}
        />
      )}
    </div>
  );
}

export default App;
