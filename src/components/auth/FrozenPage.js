import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

const FrozenPage = ({ freezeInfo }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [appealReason, setAppealReason] = useState('');
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const appealRef = doc(db, 'freezeAppeals', `${currentUser.uid}_${Date.now()}`);
      await setDoc(appealRef, {
        userId: currentUser.uid,
        username: currentUser.displayName,
        freezeId: freezeInfo.id,
        reason: appealReason,
        timestamp: serverTimestamp(),
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        response: null
      });
      
      setSuccess(t('freeze.appealSuccess'));
      setAppealReason('');
      setShowAppealForm(false);
    } catch (error) {
      console.error('Appeal submission error:', error);
      setError(t('freeze.appealError') + ': ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="frozen-page">
      <div className="frozen-container">
        <h1>{t('freeze.frozen')}</h1>
        
        <div className="freeze-details">
          <div className="freeze-info">
            <h3>{t('freeze.reason')}:</h3>
            <p>{freezeInfo?.reason || t('common.none')}</p>
          </div>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {!showAppealForm ? (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAppealForm(true)}
          >
            {t('freeze.appeal')}
          </button>
        ) : (
          <form onSubmit={handleAppealSubmit} className="appeal-form">
            <div className="form-group">
              <label htmlFor="appealReason">{t('freeze.appealReason')}</label>
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
                {loading ? t('common.loading') : t('freeze.appealSubmit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FrozenPage;
