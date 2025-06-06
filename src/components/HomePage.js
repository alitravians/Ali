import React, { useState, useEffect } from 'react';
import { useSite } from '../context/SiteContext';

const HomePage = () => {
  const [language, setLanguage] = useState('ar');
  const { siteData } = useSite();

  const translations = {
    ar: {
      welcome: 'مرحباً بكم في الوكالة',
      joining: 'كيفية الانضمام للوكالة',
      trends: 'كيفية طلب ترند',
      benefits: 'كيفية الاستفادة من البرنامج',
      team: 'لائحة فريق العمل',
      admin: 'لوحة التحكم',
      announcements: 'الإعلانات',
      siteClosed: 'تم إغلاق الموقع',
      language: 'اللغة'
    },
    en: {
      welcome: 'Welcome to the Agency',
      joining: 'How to Join the Agency',
      trends: 'How to Request Trends',
      benefits: 'How to Benefit from the Program',
      team: 'Team Roster',
      admin: 'Admin Panel',
      announcements: 'Announcements',
      siteClosed: 'Site Closed',
      language: 'Language'
    }
  };

  const t = translations[language];

  useEffect(() => {
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  if (siteData.isClosed) {
    return (
      <div className="site-closed">
        <div className="language-toggle">
          <button onClick={toggleLanguage} className="btn btn-primary">
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
        <h1>{t.siteClosed}</h1>
        <p>{siteData.closureReason}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="language-toggle">
        <button onClick={toggleLanguage} className="btn btn-primary">
          {language === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <header className="card">
        <h1>{t.welcome}</h1>
        <div className="button-grid" style={{ 
          marginTop: '30px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          maxWidth: '600px',
          margin: '30px auto 0'
        }}>
          <a href="/admin" className="btn btn-primary" style={{ 
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            textAlign: 'center',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {t.admin}
          </a>
          <a href="/team" className="btn btn-success" style={{ 
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            textAlign: 'center',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {t.team}
          </a>
        </div>
      </header>

      {siteData.announcements.length > 0 && (
        <div className="card">
          <h2>{t.announcements}</h2>
          {siteData.announcements.map((announcement, index) => (
            <div key={index} className="announcement">
              <h3>{announcement.title}</h3>
              <p>{announcement.content}</p>
              <small>{announcement.date}</small>
            </div>
          ))}
        </div>
      )}

      <div className="section-grid">
        <div className="card">
          <h2>{t.joining}</h2>
          <p>{siteData.sections.joining}</p>
        </div>

        <div className="card">
          <h2>{t.trends}</h2>
          <p>{siteData.sections.trends}</p>
        </div>

        <div className="card">
          <h2>{t.benefits}</h2>
          <p>{siteData.sections.benefits}</p>
        </div>


      </div>
    </div>
  );
};

export default HomePage;
