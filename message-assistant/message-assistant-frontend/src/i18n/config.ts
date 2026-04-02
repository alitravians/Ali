import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

const savedLang = localStorage.getItem('app_language') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    ar: { translation: arTranslations }
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

// Set initial document direction
document.documentElement.lang = savedLang;
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

export default i18n;
