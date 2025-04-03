import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="popup-overlay">
      <div className="popup">
        <div className="popup-header">
          <h2 className="popup-title">{t('auth.privacyPolicy')}</h2>
          <button className="popup-close" onClick={onClose}>&times;</button>
        </div>
        <div className="popup-body">
          <h3>{t('privacy.title')}</h3>
          <p>{t('privacy.introduction')}</p>
          
          <h4>{t('privacy.section1Title')}</h4>
          <p>{t('privacy.section1Content')}</p>
          
          <h4>{t('privacy.section2Title')}</h4>
          <p>{t('privacy.section2Content')}</p>
          
          <h4>{t('privacy.section3Title')}</h4>
          <p>{t('privacy.section3Content')}</p>
          
          <h4>{t('privacy.section4Title')}</h4>
          <p>{t('privacy.section4Content')}</p>
          
          <h4>{t('privacy.section5Title')}</h4>
          <p>{t('privacy.section5Content')}</p>
          
          <h4>{t('privacy.section6Title')}</h4>
          <p>{t('privacy.section6Content')}</p>
          
          <h4>{t('privacy.section7Title')}</h4>
          <p>{t('privacy.section7Content')}</p>
          
          <h4>{t('privacy.section8Title')}</h4>
          <p>{t('privacy.section8Content')}</p>
          
          <h4>{t('privacy.section9Title')}</h4>
          <p>{t('privacy.section9Content')}</p>
        </div>
        <div className="popup-footer">
          <button className="btn btn-primary" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
