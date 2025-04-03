import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AnnouncementPopup = ({ announcement, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(announcement.duration || 130);
  const { t } = useTranslation();
  
  useEffect(() => {
    if (!announcement) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [announcement, onClose]);
  
  if (!announcement) return null;
  
  const getTypeClass = () => {
    switch (announcement.type) {
      case 'alert':
        return 'announcement-alert';
      case 'news':
        return 'announcement-news';
      case 'update':
        return 'announcement-update';
      case 'maintenance':
        return 'announcement-maintenance';
      default:
        return '';
    }
  };
  
  return (
    <div className="popup-overlay">
      <div className={`popup announcement-popup ${getTypeClass()}`}>
        <div className="popup-header">
          <h2 className="popup-title">
            {announcement.title || t(`announcement.${announcement.type}`)}
          </h2>
          <div className="announcement-timer">{timeLeft}s</div>
          <button className="popup-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="popup-body">
          <div className="announcement-content">
            {announcement.content}
          </div>
          
          {announcement.createdBy && (
            <div className="announcement-author">
              {t('announcement.by')}: {announcement.createdBy}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
