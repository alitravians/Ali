import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/LocalAuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ErrorBoundary from '../common/ErrorBoundary';
import DatabaseErrorHandler from '../common/DatabaseErrorHandler';
import './AdminPanel.css';

const Dashboard = lazy(() => import('./Dashboard/Dashboard'));
const UserManagement = lazy(() => import('./Users/UserManagement'));
const ModeratorManagement = lazy(() => import('./Moderators/ModeratorManagement'));
const ReportList = lazy(() => import('./Reports/ReportList'));
const BanAppealsList = lazy(() => import('./Appeals/BanAppealsList'));
const FreezeAppealsList = lazy(() => import('./Appeals/FreezeAppealsList'));
const AnnouncementList = lazy(() => import('./Announcements/AnnouncementList'));
const AdvertisementList = lazy(() => import('./Advertisements/AdvertisementList'));
const ChatSettings = lazy(() => import('./Settings/ChatSettings'));
const SystemLogs = lazy(() => import('./Logs/SystemLogs'));
const AIModeratedReports = lazy(() => import('./AIModeration/AIModeratedReports'));

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatSettings, setChatSettings] = useState({
    isOpen: true,
    maintenanceMode: false,
    closedReason: '',
    maintenanceEndTime: null
  });
  
  const { currentUser, userRole } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (userRole !== 'admin' && userRole !== 'moderator') {
      navigate('/chat');
      return;
    }
    
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
  }, [currentUser, userRole, navigate]);
  
  if (loading) {
    return <div className="loading-container">{t('common.loading')}</div>;
  }
  
  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <h2>{t('admin.controlPanel')}</h2>
        </div>
        
        <nav className="admin-nav">
          <NavLink 
            to="/admin" 
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {t('admin.dashboard')}
          </NavLink>
          
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {t('admin.users')}
          </NavLink>
          
          {userRole === 'admin' && (
            <NavLink 
              to="/admin/moderators" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {t('admin.moderators')}
            </NavLink>
          )}
          
          <NavLink 
            to="/admin/reports" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {t('admin.reports')}
          </NavLink>
          
          <NavLink 
            to="/admin/ai-moderation" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {t('admin.aiModeration')}
          </NavLink>
          
          <NavLink 
            to="/admin/ban-appeals" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {t('admin.banAppeals')}
          </NavLink>
          
          <NavLink 
            to="/admin/freeze-appeals" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {t('admin.freezeAppeals')}
          </NavLink>
          
          <NavLink 
            to="/admin/announcements" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {t('admin.announcements')}
          </NavLink>
          
          {userRole === 'admin' && (
            <NavLink 
              to="/admin/advertisements" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {t('admin.advertisements')}
            </NavLink>
          )}
          
          {userRole === 'admin' && (
            <NavLink 
              to="/admin/settings" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {t('admin.settings')}
            </NavLink>
          )}
          
          {userRole === 'admin' && (
            <NavLink 
              to="/admin/logs" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {t('admin.logs')}
            </NavLink>
          )}
          
          <NavLink 
            to="/chat" 
            className="back-to-chat"
          >
            {t('admin.backToChat')}
          </NavLink>
        </nav>
      </div>
      
      <div className="admin-content">
        <div className="admin-header">
          <h1>
            {location.pathname === '/admin' && t('admin.dashboard')}
            {location.pathname === '/admin/users' && t('admin.users')}
            {location.pathname === '/admin/moderators' && t('admin.moderators')}
            {location.pathname === '/admin/reports' && t('admin.reports')}
            {location.pathname === '/admin/ai-moderation' && t('admin.aiModeration')}
            {location.pathname === '/admin/ban-appeals' && t('admin.banAppeals')}
            {location.pathname === '/admin/freeze-appeals' && t('admin.freezeAppeals')}
            {location.pathname === '/admin/announcements' && t('admin.announcements')}
            {location.pathname === '/admin/advertisements' && t('admin.advertisements')}
            {location.pathname === '/admin/settings' && t('admin.settings')}
            {location.pathname === '/admin/logs' && t('admin.logs')}
          </h1>
          
          <div className="admin-user-info">
            <span>{currentUser.displayName || currentUser.username}</span>
            <span className="admin-badge">{t(`roles.${userRole}`)}</span>
          </div>
        </div>
        
        <div className="admin-main">
          <ErrorBoundary 
            fallback={
              <div className="admin-error">
                <h3>{t('admin.errorLoading')}</h3>
                <p>{t('common.pleaseRefresh')}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-primary"
                >
                  {t('common.refresh')}
                </button>
              </div>
            }
          >
            <DatabaseErrorHandler error={error}>
              <Suspense fallback={<div className="loading">{t('common.loading')}</div>}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/users/*" element={<UserManagement />} />
                  <Route path="/moderators/*" element={<ModeratorManagement />} />
                  <Route path="/reports/*" element={<ReportList />} />
                  <Route path="/ai-moderation" element={<AIModeratedReports />} />
                  <Route path="/ban-appeals/*" element={<BanAppealsList />} />
                  <Route path="/freeze-appeals/*" element={<FreezeAppealsList />} />
                  <Route path="/announcements/*" element={<AnnouncementList />} />
                  <Route path="/advertisements/*" element={<AdvertisementList />} />
                  <Route path="/settings" element={<ChatSettings chatSettings={chatSettings} />} />
                  <Route path="/logs" element={<SystemLogs />} />
                </Routes>
              </Suspense>
            </DatabaseErrorHandler>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
