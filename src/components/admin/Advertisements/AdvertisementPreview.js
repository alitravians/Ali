import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdvertisementPreview = ({ advertisement, onClose }) => {
  const [timeRemaining, setTimeRemaining] = useState(advertisement.duration);
  const [isPaused, setIsPaused] = useState(false);
  const { t } = useTranslation();
  
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPaused]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleExtend = () => {
    setTimeRemaining(prev => prev + 60);
  };
  
  const handlePauseResume = () => {
    setIsPaused(prev => !prev);
  };
  
  return (
    <div className="advertisement-preview">
      <div className="preview-header">
        <div className="ad-type-badge">
          {t(`ad.${advertisement.type}`)}
        </div>
        <div className="timer">
          {formatTime(timeRemaining)}
        </div>
      </div>
      
      <div className="preview-content">
        <h3 className="ad-title">{advertisement.name}</h3>
        
        {advertisement.imageUrl && (
          <div className="ad-image-container">
            <img 
              src={advertisement.imageUrl} 
              alt={advertisement.name} 
              className="ad-image" 
            />
          </div>
        )}
        
        <div className="ad-content">
          {advertisement.content}
        </div>
      </div>
      
      <div className="preview-footer">
        <div className="preview-controls">
          <button 
            className="btn btn-secondary"
            onClick={handlePauseResume}
          >
            {isPaused ? t('ad.resume') : t('ad.pause')}
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={handleExtend}
          >
            {t('ad.extend')}
          </button>
          
          <button 
            className="btn btn-danger"
            onClick={onClose}
          >
            {t('ad.close')}
          </button>
        </div>
      </div>
      
      <div className="preview-info">
        <p>{t('ad.previewNote')}</p>
      </div>
    </div>
  );
};

export default AdvertisementPreview;
