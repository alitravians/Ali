import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, collection, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

const ReportModal = ({ target, onClose }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error(t('common.required'));
      return;
    }
    
    setLoading(true);
    
    try {
      let reportData = {
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName,
        reason,
        description,
        timestamp: serverTimestamp(),
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        aiVerdict: null,
        action: null
      };
      
      if (target.type === 'message') {
        const messageDoc = await getDoc(doc(db, 'messages', target.id));
        if (messageDoc.exists()) {
          const messageData = messageDoc.data();
          reportData = {
            ...reportData,
            targetId: messageData.sender,
            targetName: messageData.senderName,
            messageId: target.id,
            messageContent: messageData.content
          };
        }
      } else if (target.type === 'user') {
        const userDoc = await getDoc(doc(db, 'users', target.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          reportData = {
            ...reportData,
            targetId: target.id,
            targetName: userData.username
          };
        }
      }
      
      await addDoc(collection(db, 'reports'), reportData);
      
      toast.success(t('report.success'));
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(t('report.error'));
    }
    
    setLoading(false);
  };
  
  return (
    <div className="popup-overlay">
      <div className="popup">
        <div className="popup-header">
          <h2 className="popup-title">{t('report.title')}</h2>
          <button className="popup-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="popup-body">
            <div className="form-group">
              <label htmlFor="reason">{t('report.reason')}</label>
              <select
                id="reason"
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">{t('common.select')}</option>
                <option value="spam">{t('report.spam')}</option>
                <option value="harassment">{t('report.harassment')}</option>
                <option value="inappropriate">{t('report.inappropriateContent')}</option>
                <option value="hate">{t('report.hateSpeech')}</option>
                <option value="violence">{t('report.violence')}</option>
                <option value="other">{t('report.other')}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">{t('report.description')}</label>
              <textarea
                id="description"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
              />
            </div>
          </div>
          
          <div className="popup-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? t('common.loading') : t('report.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
