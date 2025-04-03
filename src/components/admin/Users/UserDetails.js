import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs
} from 'firebase/firestore';

const UserDetails = ({ user, onClose }) => {
  const [userReports, setUserReports] = useState([]);
  const [userMessages, setUserMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const reportsQuery = query(
          collection(db, 'reports'),
          where('targetId', '==', user.id),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        
        const reportsSnapshot = await getDocs(reportsQuery);
        const reportsData = [];
        reportsSnapshot.forEach((doc) => {
          reportsData.push({ ...doc.data(), id: doc.id });
        });
        
        const messagesQuery = query(
          collection(db, 'messages'),
          where('senderId', '==', user.id),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        const messagesData = [];
        messagesSnapshot.forEach((doc) => {
          messagesData.push({ ...doc.data(), id: doc.id });
        });
        
        setUserReports(reportsData);
        setUserMessages(messagesData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user.id]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate ? timestamp.toDate().toLocaleString() : '';
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="user-details">
      <div className="user-profile">
        <h3>{t('user.profile')}</h3>
        
        <div className="profile-info">
          <div className="info-item">
            <label>{t('user.username')}:</label>
            <span>{user.username}</span>
          </div>
          
          <div className="info-item">
            <label>{t('user.email')}:</label>
            <span>{user.email}</span>
          </div>
          
          <div className="info-item">
            <label>{t('user.role')}:</label>
            <span>{t(`user.${user.role}`)}</span>
          </div>
          
          <div className="info-item">
            <label>{t('user.status')}:</label>
            <span className={`status-badge ${user.status}`}>
              {t(`user.${user.status}`)}
            </span>
          </div>
          
          <div className="info-item">
            <label>{t('user.country')}:</label>
            <span>{user.country || '-'}</span>
          </div>
          
          <div className="info-item">
            <label>{t('user.createdAt')}:</label>
            <span>{formatDate(user.createdAt)}</span>
          </div>
          
          <div className="info-item">
            <label>{t('user.lastLogin')}:</label>
            <span>{formatDate(user.lastLogin)}</span>
          </div>
        </div>
      </div>
      
      {user.status === 'banned' && user.banInfo && (
        <div className="ban-info-section">
          <h3>{t('ban.details')}</h3>
          
          <div className="ban-details">
            <div className="info-item">
              <label>{t('ban.reason')}:</label>
              <span>{user.banInfo.reason}</span>
            </div>
            
            <div className="info-item">
              <label>{t('ban.duration')}:</label>
              <span>
                {user.banInfo.duration === 'permanent' 
                  ? t('ban.permanent') 
                  : `${user.banInfo.duration} ${t('ban.minutes')}`}
              </span>
            </div>
            
            {user.banInfo.expiresAt && (
              <div className="info-item">
                <label>{t('ban.expiresAt')}:</label>
                <span>{formatDate(user.banInfo.expiresAt)}</span>
              </div>
            )}
            
            <div className="info-item">
              <label>{t('ban.bannedBy')}:</label>
              <span>{user.banInfo.bannedBy}</span>
            </div>
            
            <div className="info-item">
              <label>{t('ban.bannedAt')}:</label>
              <span>{formatDate(user.banInfo.bannedAt)}</span>
            </div>
          </div>
        </div>
      )}
      
      {user.status === 'frozen' && user.freezeInfo && (
        <div className="freeze-info-section">
          <h3>{t('freeze.details')}</h3>
          
          <div className="freeze-details">
            <div className="info-item">
              <label>{t('freeze.reason')}:</label>
              <span>{user.freezeInfo.reason}</span>
            </div>
            
            <div className="info-item">
              <label>{t('freeze.frozenBy')}:</label>
              <span>{user.freezeInfo.frozenBy}</span>
            </div>
            
            <div className="info-item">
              <label>{t('freeze.frozenAt')}:</label>
              <span>{formatDate(user.freezeInfo.frozenAt)}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="user-reports">
        <h3>{t('report.reportsAgainstUser')}</h3>
        
        {userReports.length === 0 ? (
          <p className="no-data">{t('report.noReports')}</p>
        ) : (
          <div className="reports-list">
            {userReports.map(report => (
              <div key={report.id} className="report-item">
                <div className="report-header">
                  <span className="report-reason">
                    {t(`report.${report.reason}`, report.reason)}
                  </span>
                  <span className="report-date">
                    {formatDate(report.timestamp)}
                  </span>
                </div>
                
                <div className="report-content">
                  <div className="reporter">
                    {t('report.reportedBy')}: {report.reporterName}
                  </div>
                  
                  {report.description && (
                    <div className="description">
                      {report.description}
                    </div>
                  )}
                </div>
                
                <div className="report-status">
                  <span className={`status-badge ${report.status}`}>
                    {t(`admin.${report.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="user-messages">
        <h3>{t('user.recentMessages')}</h3>
        
        {userMessages.length === 0 ? (
          <p className="no-data">{t('user.noMessages')}</p>
        ) : (
          <div className="messages-list">
            {userMessages.map(message => (
              <div key={message.id} className={`message-item ${message.isDeleted ? 'deleted' : ''}`}>
                <div className="message-time">
                  {formatDate(message.timestamp)}
                </div>
                
                <div className="message-content">
                  {message.isDeleted ? (
                    <span className="deleted-message">
                      {t('chat.messageDeleted')}
                      {message.deletedReason && ` (${t(`report.${message.deletedReason}`, message.deletedReason)})`}
                    </span>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="admin-modal-footer">
        <button 
          className="btn btn-primary"
          onClick={onClose}
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
};

export default UserDetails;
