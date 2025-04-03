import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import './styles/rtl.css';

import Login from './components/auth/Login';
import BannedPage from './components/auth/BannedPage';
import FrozenPage from './components/auth/FrozenPage';
import Chat from './components/chat/Chat';
import AdminPanel from './components/admin/AdminPanel';
import NotFound from './components/common/NotFound';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import MaintenancePage from './components/common/MaintenancePage';
import LanguageSwitcher from './components/common/LanguageSwitcher';

const App = () => {
  const { currentUser, userStatus, banInfo, freezeInfo } = useAuth();
  const [chatSettings, setChatSettings] = useState({
    isOpen: true,
    maintenanceMode: false,
    closedReason: '',
    maintenanceReason: '',
    maintenanceEndTime: null
  });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchChatSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'chatSettings', 'settings'));
        if (settingsDoc.exists()) {
          setChatSettings(settingsDoc.data());
        }
      } catch (error) {
        console.error('Error fetching chat settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatSettings();
  }, []);

  if (loading) {
    return <div className="loading-container">{t('common.loading')}</div>;
  }

  if (currentUser && userStatus === 'banned' && banInfo) {
    return <BannedPage banInfo={banInfo} />;
  }

  if (currentUser && userStatus === 'frozen' && freezeInfo) {
    return <FrozenPage freezeInfo={freezeInfo} />;
  }

  if (chatSettings.maintenanceMode && currentUser && !currentUser.isAdmin) {
    return (
      <MaintenancePage 
        reason={chatSettings.maintenanceReason} 
        endTime={chatSettings.maintenanceEndTime} 
      />
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="language-switcher-container">
        <LanguageSwitcher />
      </div>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
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
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
