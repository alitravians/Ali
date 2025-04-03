import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import AIModeration from '../../../services/AIModeration';

const ReportDetails = ({ report, onApprove, onReject }) => {
  const [messageData, setMessageData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [aiVerdict, setAiVerdict] = useState(report.aiVerdict);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        if (report.messageId) {
          const messageDoc = await getDoc(doc(db, 'messages', report.messageId));
          if (messageDoc.exists()) {
            setMessageData(messageDoc.data());
          }
        }
        
        if (report.targetId) {
          const userDoc = await getDoc(doc(db, 'users', report.targetId));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error('Error fetching report details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [report]);

  const validateWithAI = async () => {
    setValidating(true);
    
    try {
      let result;
      
      if (report.messageId && messageData) {
        result = await AIModeration.checkContent(messageData.content, messageData.sender);
        
        setAiVerdict({
          isValid: !result.isAllowed,
          confidence: result.isAllowed ? 0.2 : 0.8,
          reason: result.reason || 'Content analysis'
        });
      } else if (report.targetId) {
        result = {
          isValid: Math.random() > 0.3, // Simplified for demo
          confidence: 0.7,
          reason: 'User behavior analysis'
        };
        
        setAiVerdict(result);
      }
    } catch (error) {
      console.error('Error validating with AI:', error);
    } finally {
      setValidating(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString();
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  const isReviewed = ['approved', 'rejected'].includes(report.status);

  return (
    <div className="report-details">
      <h3>{t('report.details')}</h3>
      
      <div className="details-section">
        <div className="detail-item">
          <label>{t('report.type')}:</label>
          <span>
            {report.messageId 
              ? t('report.messageReport') 
              : t('report.userReport')}
          </span>
        </div>
        
        <div className="detail-item">
          <label>{t('report.reporter')}:</label>
          <span>{report.reporterName}</span>
        </div>
        
        <div className="detail-item">
          <label>{t('report.target')}:</label>
          <span>{report.targetName}</span>
        </div>
        
        <div className="detail-item">
          <label>{t('report.reason')}:</label>
          <span>{t(`report.${report.reason}`, report.reason)}</span>
        </div>
        
        <div className="detail-item">
          <label>{t('report.timestamp')}:</label>
          <span>{formatDate(report.timestamp)}</span>
        </div>
        
        <div className="detail-item">
          <label>{t('report.status')}:</label>
          <span className={`status-badge ${report.status}`}>
            {t(`admin.${report.status}`)}
          </span>
        </div>
        
        {report.reviewedBy && (
          <div className="detail-item">
            <label>{t('report.reviewedBy')}:</label>
            <span>{report.reviewedBy}</span>
          </div>
        )}
        
        {report.reviewedAt && (
          <div className="detail-item">
            <label>{t('report.reviewedAt')}:</label>
            <span>{formatDate(report.reviewedAt)}</span>
          </div>
        )}
      </div>
      
      {report.description && (
        <div className="details-section">
          <h4>{t('report.description')}</h4>
          <p className="report-description">{report.description}</p>
        </div>
      )}
      
      {messageData && (
        <div className="details-section">
          <h4>{t('report.messageContent')}</h4>
          <div className="message-preview">
            <div className="message-sender">{messageData.senderName}</div>
            <div className="message-content">{messageData.content}</div>
            <div className="message-time">{formatDate(messageData.timestamp)}</div>
          </div>
        </div>
      )}
      
      {userData && (
        <div className="details-section">
          <h4>{t('report.userInfo')}</h4>
          <div className="user-info">
            <div className="detail-item">
              <label>{t('user.username')}:</label>
              <span>{userData.username}</span>
            </div>
            <div className="detail-item">
              <label>{t('user.role')}:</label>
              <span>{t(`user.${userData.role}`)}</span>
            </div>
            <div className="detail-item">
              <label>{t('user.status')}:</label>
              <span className={`status-badge ${userData.status}`}>
                {t(`user.${userData.status}`)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {aiVerdict ? (
        <div className="details-section ai-verdict">
          <h4>{t('admin.aiVerdict')}</h4>
          <div className="verdict-result">
            <span className={`verdict-badge ${aiVerdict.isValid ? 'valid' : 'invalid'}`}>
              {aiVerdict.isValid 
                ? t('admin.reportValid') 
                : t('admin.reportInvalid')}
            </span>
            <span className="confidence">
              {t('admin.confidence')}: {Math.round(aiVerdict.confidence * 100)}%
            </span>
          </div>
          {aiVerdict.reason && (
            <div className="verdict-reason">
              <label>{t('admin.verdictReason')}:</label>
              <p>{aiVerdict.reason}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="details-section">
          <button 
            className="btn btn-outline-primary"
            onClick={validateWithAI}
            disabled={validating}
          >
            {validating ? t('common.loading') : t('admin.validateWithAI')}
          </button>
        </div>
      )}
      
      {!isReviewed && (
        <div className="details-section actions">
          <button 
            className="btn btn-danger"
            onClick={onApprove}
          >
            {t('admin.approveReport')}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={onReject}
          >
            {t('admin.rejectReport')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportDetails;
