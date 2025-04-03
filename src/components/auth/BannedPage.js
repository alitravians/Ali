import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

const BannedPage = ({ banInfo }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [appealReason, setAppealReason] = useState('');
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const calculateTimeRemaining = () => {
    if (!banInfo || !banInfo.expiresAt) return null;
    
    const now = new Date();
    const expiresAt = banInfo.expiresAt.toDate();
    const timeRemaining = expiresAt - now;
    
    if (timeRemaining <= 0) return null;
    
    const minutes = Math.floor(timeRemaining / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ${t('ban.days')}`;
    } else if (hours > 0) {
      return `${hours} ${t('ban.hours')}`;
    } else {
      return `${minutes} ${t('ban.minutes')}`;
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    
    if (!appealReason.trim()) {
      setError(t('common.required'));
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const appealRef = doc(db, 'banAppeals', `${currentUser.uid}_${Date.now()}`);
      await setDoc(appealRef, {
        userId: currentUser.uid,
        username: currentUser.displayName,
        banId: banInfo.id,
        reason: appealReason,
        timestamp: serverTimestamp(),
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        response: null
      });
      
      setSuccess(t('ban.appealSuccess'));
      setAppealReason('');
      setShowAppealForm(false);
    } catch (error) {
      console.error('Appeal submission error:', error);
      setError(t('ban.appealError') + ': ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="banned-page">
      <div className="banned-container">
        <h1>{t('ban.banned')}</h1>
        
        <div className="ban-details">
          <div className="ban-info">
            <h3>{t('ban.reason')}:</h3>
            <p>{banInfo?.reason || t('common.none')}</p>
          </div>
          
          <div className="ban-info">
            <h3>{t('ban.duration')}:</h3>
            <p>
              {banInfo?.duration === 'permanent' 
                ? t('ban.permanent') 
                : calculateTimeRemaining() || t('common.expired')}
            </p>
          </div>
          
          {banInfo?.expiresAt && (
            <div className="ban-info">
              <h3>{t('ban.expiresAt')}:</h3>
              <p>{banInfo.expiresAt.toDate().toLocaleString()}</p>
            </div>
          )}
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {!showAppealForm ? (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAppealForm(true)}
          >
            {t('ban.appeal')}
          </button>
        ) : (
          <form onSubmit={handleAppealSubmit} className="appeal-form">
            <div className="form-group">
              <label htmlFor="appealReason">{t('ban.appealReason')}</label>
              <textarea
                id="appealReason"
                className="form-control"
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows="5"
                required
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowAppealForm(false)}
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? t('common.loading') : t('ban.appealSubmit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BannedPage;
