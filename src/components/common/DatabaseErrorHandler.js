import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const DatabaseErrorHandler = ({ error, children, fallback }) => {
  const { t } = useTranslation();
  
  if (error) {
    console.error('Database connection error:', error);
    
    React.useEffect(() => {
      if (error.code === 'permission-denied') {
        toast.error(t('errors.permissionDenied'));
      } else if (error.code === 'unavailable') {
        toast.error(t('errors.serviceUnavailable'));
      } else if (error.code === 'resource-exhausted') {
        toast.error(t('errors.quotaExceeded'));
      } else {
        toast.error(t('errors.databaseConnection'));
      }
    }, [error, t]);
    
    if (fallback) {
      return fallback;
    }
    
    return (
      <div className="database-error">
        <h3>{t('errors.connectionError')}</h3>
        <p>{t('errors.tryAgainLater')}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          {t('common.refresh')}
        </button>
      </div>
    );
  }
  
  return children;
};

export default DatabaseErrorHandler;
