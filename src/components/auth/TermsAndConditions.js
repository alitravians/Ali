import React from 'react';
import { useTranslation } from 'react-i18next';

const TermsAndConditions = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="popup-overlay">
      <div className="popup">
        <div className="popup-header">
          <h2 className="popup-title">{t('auth.termsAndConditions')}</h2>
          <button className="popup-close" onClick={onClose}>&times;</button>
        </div>
        <div className="popup-body">
          <h3>{t('terms.title')}</h3>
          <p>{t('terms.welcome')}</p>
          
          <h4>{t('terms.section1Title')}</h4>
          <p>{t('terms.section1Content')}</p>
          
          <h4>{t('terms.section2Title')}</h4>
          <p>{t('terms.section2Content')}</p>
          
          <h4>{t('terms.section3Title')}</h4>
          <p>{t('terms.section3Content')}</p>
          
          <h4>{t('terms.section4Title')}</h4>
          <p>{t('terms.section4Content')}</p>
          
          <h4>{t('terms.section5Title')}</h4>
          <p>{t('terms.section5Content')}</p>
          
          <h4>{t('terms.section6Title')}</h4>
          <p>{t('terms.section6Content')}</p>
          
          <h4>{t('terms.section7Title')}</h4>
          <p>{t('terms.section7Content')}</p>
          
          <h4>{t('terms.section8Title')}</h4>
          <p>{t('terms.section8Content')}</p>
          
          <h4>{t('terms.section9Title')}</h4>
          <p>{t('terms.section9Content')}</p>
          
          <h4>{t('terms.section10Title')}</h4>
          <p>{t('terms.section10Content')}</p>
        </div>
        <div className="popup-footer">
          <button className="btn btn-primary" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
