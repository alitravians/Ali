import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@chakra-ui/react';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Apply the stored language preference on component mount
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage) {
      i18n.changeLanguage(storedLanguage);
      document.documentElement.dir = storedLanguage === 'ar' ? 'rtl' : 'ltr';
    }
  }, [i18n]);

  const changeLanguage = (event) => {
    const newLanguage = event.target.value;
    localStorage.setItem('language', newLanguage);
    i18n.changeLanguage(newLanguage);
    // Update the document direction based on the selected language
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <Select 
      onChange={changeLanguage} 
      value={i18n.language} 
      size="sm" 
      width="100px"
      aria-label="اختر اللغة / Select Language"
    >
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </Select>
  );
};

export default LanguageToggle;
