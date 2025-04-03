import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const MaintenancePage = ({ reason, endTime }) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = endTime.toDate();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        window.location.reload();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="maintenance-page">
      <div className="maintenance-container">
        <h1>{t('maintenance.title')}</h1>
        <div className="maintenance-icon">🛠️</div>
        <p className="maintenance-message">{t('maintenance.message')}</p>
        
        {reason && (
          <div className="maintenance-reason">
            <h3>{t('maintenance.reason')}:</h3>
            <p>{reason}</p>
          </div>
        )}
        
        {timeRemaining && (
          <div className="maintenance-timer">
            <h3>{t('maintenance.estimatedTime')}:</h3>
            <div className="countdown">{timeRemaining}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenancePage;
