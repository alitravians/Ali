import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './styles/rtl.css';
import { LocalAuthProvider } from './contexts/LocalAuthContext';
import { useLocalAuth } from './contexts/LocalAuthContext';
import Chat from './components/chat/Chat';
import AdminPanel from './components/admin/AdminPanel';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import NotFound from './components/common/NotFound';
import BannedPage from './components/auth/BannedPage';
import FrozenPage from './components/auth/FrozenPage';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from './components/common/ErrorBoundary';
import DatabaseErrorHandler from './components/common/DatabaseErrorHandler';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useLocalAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>{t('auth.login')}</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const [chatSettings, setChatSettings] = useState({
    isOpen: true,
    maintenanceMode: false,
    closedReason: '',
    maintenanceEndTime: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchChatSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'chatSettings', 'general'));
        
        if (settingsDoc.exists()) {
          setChatSettings(settingsDoc.data());
        }
        
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error fetching chat settings:', error);
        setError(error);
        setLoading(false);
      }
    };
    
    fetchChatSettings();
  }, []);

  const AppContent = () => {
    const { isAuthenticated, loading: authLoading } = useLocalAuth();

    if (authLoading) {
      return <div className="loading-container">{t('common.loading')}</div>;
    }

    return (
      <ErrorBoundary>
        <DatabaseErrorHandler error={error}>
          <div className="app-container">
            <LanguageSwitcher />
            <Routes>
              <Route
                path="/"
                element={isAuthenticated ? <Navigate to="/chat" /> : <Navigate to="/login" />}
              />
              <Route path="/login" element={isAuthenticated ? <Navigate to="/chat" /> : <Login />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat chatSettings={chatSettings} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
              <Route path="/banned" element={<BannedPage />} />
              <Route path="/frozen" element={<FrozenPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ToastContainer position="top-center" rtl />
          </div>
        </DatabaseErrorHandler>
      </ErrorBoundary>
    );
  };

  if (loading) {
    return <div className="loading-container">{t('common.loading')}</div>;
  }

  return (
    <LocalAuthProvider>
      <AppContent />
    </LocalAuthProvider>
  );
};

const AppWithRouter = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWithRouter;
