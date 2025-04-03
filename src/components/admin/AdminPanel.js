import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX, FiUsers, FiFlag, FiMessageSquare, FiBell, FiSettings, FiShield, FiActivity, FiAlertTriangle } from 'react-icons/fi';

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

import './AdminPanel.css';

const AdminPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
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
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/reports" element={<ReportList />} />
          <Route path="/appeals/ban" element={<BanAppealsList />} />
          <Route path="/appeals/freeze" element={<FreezeAppealsList />} />
          <Route path="/announcements" element={<AnnouncementList />} />
          <Route path="/chat-settings" element={<ChatSettings />} />
          <Route path="/moderators" element={<ModeratorManagement />} />
          <Route path="/logs" element={<SystemLogs />} />
          <Route path="/ai-moderation" element={<AIModeratedReports />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPanel;
