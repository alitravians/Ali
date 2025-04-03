import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const AppealDetails = ({ appeal, appealType, onApprove, onReject }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { t } = useTranslation();

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate ? timestamp.toDate().toLocaleString() : '';
  };

  const handleReject = (e) => {
    e.preventDefault();
    onReject(rejectReason);
    setShowRejectForm(false);
    setRejectReason('');
  };

  return (
    <div className="appeal-details">
      <div className="appeal-header">
        <h3>
          {appealType === 'ban' 
            ? t('appeal.banAppealDetails') 
            : t('appeal.freezeAppealDetails')}
        </h3>
        <span className={`status-badge ${appeal.status}`}>
          {t(`admin.${appeal.status}`)}
        </span>
      </div>
      
      <div className="appeal-info">
        <div className="info-item">
          <label>{t('user.username')}:</label>
          <span>{appeal.username}</span>
        </div>
        
        <div className="info-item">
          <label>{t('appeal.submittedAt')}:</label>
          <span>{formatDate(appeal.timestamp)}</span>
        </div>
        
        {appeal.reviewedBy && (
          <>
            <div className="info-item">
              <label>{t('appeal.reviewedBy')}:</label>
              <span>{appeal.reviewedBy}</span>
            </div>
            
            <div className="info-item">
              <label>{t('appeal.reviewedAt')}:</label>
              <span>{formatDate(appeal.reviewedAt)}</span>
            </div>
          </>
        )}
      </div>
      
      <div className="appeal-content">
        <h4>{t('appeal.reason')}:</h4>
        <div className="appeal-reason">
          {appeal.reason}
        </div>
        
        {appeal.response && (
          <>
            <h4>{t('appeal.response')}:</h4>
            <div className="appeal-response">
              {appeal.response}
            </div>
          </>
        )}
      </div>
      
      {appeal.status === 'pending' && (
        <div className="appeal-actions">
          {!showRejectForm ? (
            <>
              <button 
                className="btn btn-success"
                onClick={onApprove}
              >
                {t('appeal.approve')}
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => setShowRejectForm(true)}
              >
                {t('appeal.reject')}
              </button>
            </>
          ) : (
            <form onSubmit={handleReject} className="reject-form">
              <div className="form-group">
                <label htmlFor="rejectReason">{t('appeal.rejectReason')}</label>
                <textarea
                  id="rejectReason"
                  className="form-control"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="3"
                  placeholder={t('appeal.rejectReasonPlaceholder')}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowRejectForm(false)}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-danger"
                  disabled={!rejectReason.trim()}
                >
                  {t('appeal.confirmReject')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default AppealDetails;
