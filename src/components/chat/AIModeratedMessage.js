import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AIModeration from '../../services/AIModeration';

const AIModeratedMessage = ({ message, onSend, onCancel }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [moderationResult, setModerationResult] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const checkContent = async () => {
      if (!message.trim()) return;
      
      setIsChecking(true);
      
      try {
        const result = await AIModeration.checkContent(message, message.sender);
        setModerationResult(result);
        
        if (result.isAllowed) {
          onSend();
        }
      } catch (error) {
        console.error('Error checking content:', error);
        onSend();
      } finally {
        setIsChecking(false);
      }
    };
    
    checkContent();
  }, [message, onSend]);
  
  if (isChecking || (moderationResult && moderationResult.isAllowed)) {
    return null;
  }
  
  if (moderationResult && !moderationResult.isAllowed) {
    return (
      <div className="ai-moderation-warning">
        <div className="warning-icon">⚠️</div>
        <div className="warning-message">
          <h3>{t('moderation.contentBlocked')}</h3>
          <p>
            {moderationResult.reason === 'repeated' 
              ? t('moderation.repeatedMessage')
              : t(`moderation.${moderationResult.reason}`, t('moderation.inappropriateContent'))}
          </p>
          
          {moderationResult.action === 'ban' && (
            <p className="ban-warning">
              {t('moderation.banWarning', { duration: '10' })}
            </p>
          )}
        </div>
        <div className="warning-actions">
          <button 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    );
  }
  
  return null;
};

export default AIModeratedMessage;
