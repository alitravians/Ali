import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  where,
  getDocs
} from 'firebase/firestore';
import AIModeration from '../../../services/AIModeration';

const AIModeratedReports = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData = [];
      querySnapshot.forEach((doc) => {
        reportsData.push({ ...doc.data(), id: doc.id });
      });
      setReports(reportsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const validateReport = async (report) => {
    setValidating(true);
    
    try {
      let aiVerdict;
      
      if (report.messageId) {
        const messageDoc = await getDoc(doc(db, 'messages', report.messageId));
        if (messageDoc.exists()) {
          const messageData = messageDoc.data();
          
          const result = await AIModeration.checkContent(messageData.content, messageData.sender);
          
          aiVerdict = {
            isValid: !result.isAllowed,
            confidence: result.isAllowed ? 0.2 : 0.8,
            reason: result.reason || 'Content analysis'
          };
        }
      } else {
        const q = query(
          collection(db, 'messages'),
          where('sender', '==', report.targetId),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        const messages = [];
        
        querySnapshot.forEach((doc) => {
          messages.push(doc.data().content);
        });
        
        let inappropriateCount = 0;
        
        for (const message of messages) {
          const result = await AIModeration.checkContent(message, report.targetId);
          if (!result.isAllowed) {
            inappropriateCount++;
          }
        }
        
        aiVerdict = {
          isValid: inappropriateCount >= 3,
          confidence: inappropriateCount >= 3 ? 0.8 : 0.4,
          reason: `User has ${inappropriateCount} inappropriate messages out of ${messages.length}`
        };
      }
      
      await updateDoc(doc(db, 'reports', report.id), {
        aiVerdict,
        status: 'ai-reviewed'
      });
      
      setSelectedReport({
        ...report,
        aiVerdict,
        status: 'ai-reviewed'
      });
    } catch (error) {
      console.error('Error validating report:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleReportAction = async (action) => {
    if (!selectedReport) return;
    
    try {
      await updateDoc(doc(db, 'reports', selectedReport.id), {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: 'admin', // In a real app, this would be the current admin's ID
        reviewedAt: new Date()
      });
      
      if (action === 'approve' && selectedReport.messageId) {
        await updateDoc(doc(db, 'messages', selectedReport.messageId), {
          isDeleted: true,
          deletedBy: 'admin',
          deletedReason: selectedReport.reason
        });
      }
      
      if (action === 'approve' && selectedReport.targetId) {
        const banExpiresAt = new Date();
        banExpiresAt.setMinutes(banExpiresAt.getMinutes() + 60); // 1 hour ban
        
        const banInfo = {
          reason: selectedReport.reason,
          duration: 60,
          bannedBy: 'admin',
          bannedAt: new Date(),
          expiresAt: banExpiresAt
        };
        
        await updateDoc(doc(db, 'users', selectedReport.targetId), {
          status: 'banned',
          banInfo
        });
      }
      
      setSelectedReport(null);
    } catch (error) {
      console.error('Error handling report action:', error);
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="ai-moderated-reports">
      <h2>{t('admin.aiModeration')}</h2>
      
      <div className="reports-container">
        <div className="reports-list">
          <h3>{t('admin.reports')}</h3>
          
          {reports.length === 0 ? (
            <p className="no-reports">{t('admin.noReports')}</p>
          ) : (
            <ul>
              {reports.map(report => (
                <li 
                  key={report.id} 
                  className={`report-item ${report.status} ${selectedReport?.id === report.id ? 'selected' : ''}`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="report-header">
                    <span className="report-type">
                      {report.messageId ? t('report.messageReport') : t('report.userReport')}
                    </span>
                    <span className="report-date">
                      {report.timestamp?.toDate().toLocaleString()}
                    </span>
                  </div>
                  <div className="report-reason">
                    {t(`report.${report.reason}`, report.reason)}
                  </div>
                  <div className="report-status">
                    {t(`admin.${report.status}`)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="report-details">
          {selectedReport ? (
            <>
              <h3>{t('admin.reportDetails')}</h3>
              
              <div className="report-info">
                <div className="info-group">
                  <label>{t('report.reporter')}:</label>
                  <span>{selectedReport.reporterName}</span>
                </div>
                
                <div className="info-group">
                  <label>{t('report.target')}:</label>
                  <span>{selectedReport.targetName}</span>
                </div>
                
                <div className="info-group">
                  <label>{t('report.reason')}:</label>
                  <span>{t(`report.${selectedReport.reason}`, selectedReport.reason)}</span>
                </div>
                
                {selectedReport.description && (
                  <div className="info-group">
                    <label>{t('report.description')}:</label>
                    <p>{selectedReport.description}</p>
                  </div>
                )}
                
                {selectedReport.messageContent && (
                  <div className="info-group">
                    <label>{t('report.messageContent')}:</label>
                    <p className="message-content">{selectedReport.messageContent}</p>
                  </div>
                )}
                
                <div className="info-group">
                  <label>{t('report.status')}:</label>
                  <span className={`status-badge ${selectedReport.status}`}>
                    {t(`admin.${selectedReport.status}`)}
                  </span>
                </div>
                
                {selectedReport.aiVerdict ? (
                  <div className="ai-verdict">
                    <h4>{t('admin.aiVerdict')}</h4>
                    
                    <div className="verdict-result">
                      <span className={`verdict-badge ${selectedReport.aiVerdict.isValid ? 'valid' : 'invalid'}`}>
                        {selectedReport.aiVerdict.isValid 
                          ? t('admin.reportValid') 
                          : t('admin.reportInvalid')}
                      </span>
                      <span className="confidence">
                        {t('admin.confidence')}: {Math.round(selectedReport.aiVerdict.confidence * 100)}%
                      </span>
                    </div>
                    
                    <div className="verdict-reason">
                      <label>{t('admin.verdictReason')}:</label>
                      <p>{selectedReport.aiVerdict.reason}</p>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={() => validateReport(selectedReport)}
                    disabled={validating}
                  >
                    {validating ? t('common.loading') : t('admin.validateWithAI')}
                  </button>
                )}
                
                <div className="report-actions">
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleReportAction('approve')}
                    disabled={selectedReport.status === 'approved' || selectedReport.status === 'rejected'}
                  >
                    {t('admin.approveReport')}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleReportAction('reject')}
                    disabled={selectedReport.status === 'approved' || selectedReport.status === 'rejected'}
                  >
                    {t('admin.rejectReport')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              {t('admin.selectReport')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIModeratedReports;
