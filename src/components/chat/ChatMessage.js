import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { FiMoreVertical, FiFlag } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const ChatMessage = ({ message, currentUser, onReportMessage, onReportUser }) => {
  const [showOptions, setShowOptions] = useState(false);
  const { t, i18n } = useTranslation();
  const { isModerator } = useAuth();
  
  const isCurrentUser = message.sender === currentUser.uid;
  const dateLocale = i18n.language === 'ar' ? ar : enUS;
  
  const formattedTime = message.timestamp ? 
    formatDistanceToNow(message.timestamp.toDate(), { 
      addSuffix: true,
      locale: dateLocale
    }) : '';
  
  if (message.isDeleted) {
    return (
      <div className={`message deleted ${isCurrentUser ? 'sent' : 'received'}`}>
        <div className="message-content">
          <p className="deleted-message">
            {message.deletedBy === 'admin' 
              ? t('chat.messageDeletedByAdmin') 
              : message.deletedBy === 'system'
                ? t('chat.messageDeletedBySystem')
                : t('chat.messageDeleted')
            }
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
      <div className="message-header">
        <div className="message-sender">
          <span className="sender-name">
            {message.senderName}
            {message.senderRole === 'admin' && (
              <span className="admin-badge">{t('chat.admin')}</span>
            )}
            {message.senderRole === 'moderator' && (
              <span className="moderator-badge">{t('chat.moderator')}</span>
            )}
          </span>
          <span className="sender-country">{message.senderCountry}</span>
        </div>
        <div className="message-time">{formattedTime}</div>
      </div>
      
      <div className="message-content">
        <p className={message.isFormatted ? 'formatted-message' : ''}>
          {message.content}
        </p>
      </div>
      
      {!isCurrentUser && (
        <div className="message-actions">
          <button 
            className="message-options-button"
            onClick={() => setShowOptions(!showOptions)}
          >
            <FiMoreVertical />
          </button>
          
          {showOptions && (
            <div className="message-options">
              <button 
                className="report-button"
                onClick={() => {
                  onReportMessage();
                  setShowOptions(false);
                }}
              >
                <FiFlag /> {t('chat.reportMessage')}
              </button>
              <button 
                className="report-button"
                onClick={() => {
                  onReportUser();
                  setShowOptions(false);
                }}
              >
                <FiFlag /> {t('chat.reportUser')}
              </button>
              
              {isModerator() && (
                <>
                  <button 
                    className="delete-button"
                    onClick={() => {
                      setShowOptions(false);
                    }}
                  >
                    {t('common.delete')}
                  </button>
                  <button 
                    className="ban-button"
                    onClick={() => {
                      setShowOptions(false);
                    }}
                  >
                    {t('user.ban')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
