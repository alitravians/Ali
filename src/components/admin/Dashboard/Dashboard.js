import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { FiUsers, FiMessageSquare, FiFlag, FiAlertTriangle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { retryFirestoreOperation, handleFirestoreError } from '../../../utils/firebase-helpers';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalMessages: 0,
    todayMessages: 0,
    pendingReports: 0,
    pendingAppeals: 0,
    chatStatus: 'open'
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  const calculateTodayMessages = async () => {
    try {
      const messagesRef = collection(db, 'messages');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);
      
      const todayMessagesQuery = query(
        messagesRef, 
        where('timestamp', '>=', todayTimestamp)
      );
      
      const todayMessagesSnapshot = await retryFirestoreOperation(() => 
        getDocs(todayMessagesQuery)
      );
      
      const todayMessages = todayMessagesSnapshot.size;
      
      setStats(prevStats => ({
        ...prevStats,
        todayMessages
      }));
    } catch (error) {
      console.error('Error calculating today messages:', error);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data...');
        
        const chatSettingsDoc = await retryFirestoreOperation(async () => {
          return await getDoc(doc(db, 'chatSettings', 'settings'));
        });
        
        let chatStatus = 'open';
        if (chatSettingsDoc.exists()) {
          const settings = chatSettingsDoc.data();
          if (settings.maintenanceMode) {
            chatStatus = 'maintenance';
          } else if (!settings.isOpen) {
            chatStatus = 'closed';
          }
        }
        
        const usersRef = collection(db, 'users');
        const messagesRef = collection(db, 'messages');
        const reportsRef = collection(db, 'reports');
        const appealsRef = collection(db, 'banAppeals');
        
        console.log('Executing parallel Firestore queries...');
        const [
          totalUsersSnapshot,
          activeUsersSnapshot,
          bannedUsersSnapshot,
          totalMessagesSnapshot,
          pendingReportsSnapshot,
          pendingAppealsSnapshot,
          recentReportsSnapshot
        ] = await Promise.all([
          retryFirestoreOperation(() => getDocs(usersRef)),
          retryFirestoreOperation(() => getDocs(query(usersRef, where('status', '==', 'active')))),
          retryFirestoreOperation(() => getDocs(query(usersRef, where('status', '==', 'banned')))),
          retryFirestoreOperation(() => getDocs(messagesRef)),
          retryFirestoreOperation(() => getDocs(query(reportsRef, where('status', '==', 'pending')))),
          retryFirestoreOperation(() => getDocs(query(appealsRef, where('status', '==', 'pending')))),
          retryFirestoreOperation(() => getDocs(query(
            reportsRef,
            orderBy('timestamp', 'desc'),
            limit(5)
          )))
        ]);
        
        console.log('All queries completed successfully');
        
        const totalUsers = totalUsersSnapshot.size;
        const activeUsers = activeUsersSnapshot.size;
        const bannedUsers = bannedUsersSnapshot.size;
        const totalMessages = totalMessagesSnapshot.size;
        const pendingReports = pendingReportsSnapshot.size;
        const pendingAppeals = pendingAppealsSnapshot.size;
        
        const recentReportsData = [];
        recentReportsSnapshot.forEach((doc) => {
          recentReportsData.push({ ...doc.data(), id: doc.id });
        });
        
        setStats({
          totalUsers,
          activeUsers,
          bannedUsers,
          totalMessages,
          todayMessages: 0, // Will be calculated separately
          pendingReports,
          pendingAppeals,
          chatStatus
        });
        
        setRecentReports(recentReportsData);
        setError(null);
        
        calculateTodayMessages();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        handleFirestoreError(error, t('admin.dashboardLoadError'));
        setError(error);
        
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          bannedUsers: 0,
          totalMessages: 0,
          todayMessages: 0,
          pendingReports: 0,
          pendingAppeals: 0,
          chatStatus: 'open'
        });
        setRecentReports([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [t]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString();
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }
  
  const safeFormatDate = (timestamp) => {
    try {
      if (!timestamp) return '';
      if (typeof timestamp.toDate !== 'function') {
        console.error('Invalid timestamp format:', timestamp);
        return '';
      }
      return timestamp.toDate().toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className="dashboard">
      <div className="section-header">
        <h2>{t('admin.dashboard')}</h2>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>{t('admin.users')}</h3>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="label">{t('admin.active')}:</span>
                <span className="value">{stats.activeUsers}</span>
              </div>
              <div className="stat-detail">
                <span className="label">{t('admin.banned')}:</span>
                <span className="value">{stats.bannedUsers}</span>
              </div>
            </div>
            <Link to="/admin/users" className="stat-link">
              {t('admin.manageUsers')}
            </Link>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon messages">
            <FiMessageSquare />
          </div>
          <div className="stat-content">
            <h3>{t('admin.messages')}</h3>
            <div className="stat-value">{stats.totalMessages}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="label">{t('admin.today')}:</span>
                <span className="value">{stats.todayMessages}</span>
              </div>
            </div>
            <Link to="/chat" className="stat-link">
              {t('admin.viewChat')}
            </Link>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon reports">
            <FiFlag />
          </div>
          <div className="stat-content">
            <h3>{t('admin.reports')}</h3>
            <div className="stat-value">{stats.pendingReports}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="label">{t('admin.pending')}:</span>
                <span className="value">{stats.pendingReports}</span>
              </div>
            </div>
            <Link to="/admin/reports" className="stat-link">
              {t('admin.manageReports')}
            </Link>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon appeals">
            <FiAlertTriangle />
          </div>
          <div className="stat-content">
            <h3>{t('admin.appeals')}</h3>
            <div className="stat-value">{stats.pendingAppeals}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="label">{t('admin.pending')}:</span>
                <span className="value">{stats.pendingAppeals}</span>
              </div>
            </div>
            <Link to="/admin/appeals/ban" className="stat-link">
              {t('admin.manageAppeals')}
            </Link>
          </div>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>{t('admin.chatStatus')}</h3>
          </div>
          <div className="admin-card-body">
            <div className="chat-status">
              <div className="status-indicator">
                <span className={`status-badge ${stats.chatStatus}`}>
                  {t(`settings.${stats.chatStatus}`)}
                </span>
              </div>
              <Link to="/admin/chat-settings" className="btn btn-primary">
                {t('admin.manageChatSettings')}
              </Link>
            </div>
          </div>
        </div>
        
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>{t('admin.recentReports')}</h3>
          </div>
          <div className="admin-card-body">
            {recentReports.length === 0 ? (
              <p className="no-data">{t('report.noReports')}</p>
            ) : (
              <div className="recent-reports">
                {recentReports.map(report => (
                  <div key={report.id} className="recent-report-item">
                    <div className="report-type">
                      {report.messageId 
                        ? t('report.messageReport') 
                        : t('report.userReport')}
                    </div>
                    <div className="report-info">
                      <div className="report-reason">
                        {t(`report.${report.reason}`, report.reason)}
                      </div>
                      <div className="report-time">
                        {safeFormatDate(report.timestamp)}
                      </div>
                    </div>
                    <div className="report-status">
                      <span className={`status-badge ${report.status}`}>
                        {t(`admin.${report.status}`)}
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/admin/reports" className="view-all-link">
                  {t('admin.viewAllReports')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
