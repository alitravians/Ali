import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX, FiUsers, FiFlag, FiMessageSquare, FiBell, FiSettings, FiShield, FiActivity, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';

import UserManagement from './Users/UserManagement';
import ReportList from './Reports/ReportList';
import BanAppealsList from './Appeals/BanAppealsList';
import FreezeAppealsList from './Appeals/FreezeAppealsList';
import AnnouncementList from './Announcements/AnnouncementList';
import ChatSettings from './Settings/ChatSettings';
import ModeratorManagement from './Moderators/ModeratorManagement';
import SystemLogs from './Logs/SystemLogs';
import AIModeratedReports from './AIModeration/AIModeratedReports';
import Dashboard from './Dashboard/Dashboard';
import ErrorBoundary from '../common/ErrorBoundary';

import './AdminPanel.css';

const AdminPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const handleError = (event) => {
      console.error('Admin Panel Error:', event.error);
      setError(event.error);
      toast.error(t('admin.generalError'));
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [t]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const menuItems = [
    { 
      path: '/admin/dashboard', 
      name: t('admin.dashboard'), 
      icon: <FiActivity /> 
    },
    { 
      path: '/admin/users', 
      name: t('admin.users'), 
      icon: <FiUsers /> 
    },
    { 
      path: '/admin/reports', 
      name: t('admin.reports'), 
      icon: <FiFlag /> 
    },
    { 
      path: '/admin/announcements', 
      name: t('admin.announcements'), 
      icon: <FiBell /> 
    },
    { 
      path: '/admin/chat-settings', 
      name: t('admin.chatSettings'), 
      icon: <FiSettings /> 
    },
    { 
      path: '/admin/moderators', 
      name: t('admin.moderators'), 
      icon: <FiShield /> 
    },
    { 
      path: '/admin/ai-moderation', 
      name: t('admin.aiModeration'), 
      icon: <FiMessageSquare /> 
    },
    { 
      path: '/admin/appeals', 
      name: t('admin.banAppeals'), 
      icon: <FiAlertTriangle />,
      subMenu: [
        { 
          path: '/admin/appeals/ban', 
          name: t('admin.banAppeals')
        },
        { 
          path: '/admin/appeals/freeze', 
          name: t('admin.freezeAppeals')
        }
      ]
    },
    { 
      path: '/admin/logs', 
      name: t('admin.systemLogs'), 
      icon: <FiActivity /> 
    }
  ];
  
  const isActive = (path) => {
    if (path === '/admin/appeals') {
      return location.pathname.startsWith(path);
    }
    return location.pathname === path;
  };
  
  const isSubMenuActive = (path) => {
    return location.pathname === path;
  };
  
  const [openSubMenu, setOpenSubMenu] = useState(null);
  
  const toggleSubMenu = (index) => {
    if (openSubMenu === index) {
      setOpenSubMenu(null);
    } else {
      setOpenSubMenu(index);
    }
  };
  
  return (
    <div className="admin-panel">
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>{t('admin.dashboard')}</h2>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item, index) => (
              <li key={item.path} className={isActive(item.path) ? 'active' : ''}>
                {item.subMenu ? (
                  <>
                    <div 
                      className={`menu-item has-submenu ${isActive(item.path) ? 'active' : ''}`}
                      onClick={() => toggleSubMenu(index)}
                    >
                      <span className="menu-icon">{item.icon}</span>
                      <span className="menu-text">{item.name}</span>
                      <span className={`submenu-arrow ${openSubMenu === index ? 'open' : ''}`}>▼</span>
                    </div>
                    
                    {openSubMenu === index && (
                      <ul className="submenu">
                        {item.subMenu.map((subItem) => (
                          <li 
                            key={subItem.path} 
                            className={isSubMenuActive(subItem.path) ? 'active' : ''}
                          >
                            <Link to={subItem.path}>
                              <span className="menu-text">{subItem.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link to={item.path} className="menu-item">
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-text">{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className={`admin-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="admin-content-wrapper">
          {error && (
            <div className="admin-error-notification">
              <h3>{t('admin.errorLoading')}</h3>
              <p>{t('common.pleaseRefresh')}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary"
              >
                {t('common.refresh')}
              </button>
            </div>
          )}
          
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
            <Suspense fallback={<div className="loading">{t('common.loading')}</div>}>
              <Routes>
                <Route path="/" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/dashboard" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/users" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <UserManagement />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/reports" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <ReportList />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/appeals/ban" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <BanAppealsList />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/appeals/freeze" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <FreezeAppealsList />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/announcements" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <AnnouncementList />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/chat-settings" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <ChatSettings />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/moderators" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <ModeratorManagement />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/logs" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <SystemLogs />
                    </ErrorBoundary>
                  </div>
                } />
                <Route path="/ai-moderation" element={
                  <div className="admin-component-wrapper">
                    <ErrorBoundary>
                      <AIModeratedReports />
                    </ErrorBoundary>
                  </div>
                } />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
