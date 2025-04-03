import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };
  
  return (
    <button 
      className="language-switcher" 
      onClick={toggleLanguage}
      title={i18n.language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <FiGlobe />
      <span className="language-code">{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
    </button>
  );
};

export default LanguageSwitcher;
