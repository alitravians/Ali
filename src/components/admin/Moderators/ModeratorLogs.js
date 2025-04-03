import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit
} from 'firebase/firestore';

const ModeratorLogs = ({ moderatorId, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const logsQuery = query(
      collection(db, 'moderatorLogs'),
      where('moderatorId', '==', moderatorId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(logsQuery, (querySnapshot) => {
      const logsData = [];
      querySnapshot.forEach((doc) => {
        logsData.push({ ...doc.data(), id: doc.id });
      });
      setLogs(logsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [moderatorId]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString();
  };

  const getLogTypeLabel = (type) => {
    switch (type) {
      case 'promotion':
        return t('moderator.logPromotion');
      case 'demotion':
        return t('moderator.logDemotion');
      case 'penalty':
        return t('moderator.logPenalty');
      case 'action':
        return t('moderator.logAction');
      default:
        return type;
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'minor':
        return t('moderator.minor');
      case 'moderate':
        return t('moderator.moderate');
      case 'severe':
        return t('moderator.severe');
      default:
        return severity;
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="moderator-logs">
      <h4>{t('moderator.activityLog')}</h4>
      
      {logs.length === 0 ? (
        <p className="no-data">{t('moderator.noLogs')}</p>
      ) : (
        <div className="logs-list">
          {logs.map(log => (
            <div key={log.id} className={`log-item ${log.type}`}>
              <div className="log-header">
                <span className="log-type">{getLogTypeLabel(log.type)}</span>
                <span className="log-date">{formatDate(log.timestamp)}</span>
              </div>
              
              <div className="log-details">
                <div className="log-detail">
                  <label>{t('moderator.performedBy')}:</label>
                  <span>{log.performedBy}</span>
                </div>
                
                {log.reason && (
                  <div className="log-detail">
                    <label>{t('common.reason')}:</label>
                    <span>{log.reason}</span>
                  </div>
                )}
                
                {log.severity && (
                  <div className="log-detail">
                    <label>{t('moderator.severity')}:</label>
                    <span className={`severity-badge ${log.severity}`}>
                      {getSeverityLabel(log.severity)}
                    </span>
                  </div>
                )}
                
                {log.action && (
                  <div className="log-detail">
                    <label>{t('common.action')}:</label>
                    <span>{log.action}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
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

export default ModeratorLogs;
