import React, { useState, useEffect } from 'react';
import { useTeam } from '../context/TeamContext';

const TeamPage = () => {
  const [language, setLanguage] = useState('ar');
  const { teamSections } = useTeam();
  
  console.log('TeamPage received teamSections:', teamSections);
  
  useEffect(() => {
    console.log('TeamPage - teamSections updated:', teamSections);
  }, [teamSections]);

  const translations = {
    ar: {
      teamRoster: 'لائحة فريق العمل',
      sections: 'الأقسام',
      sectionName: 'اسم القسم',
      name: 'الاسم',
      role: 'الصلاحية',
      avatar: 'الأفاتار',
      backToHome: 'العودة للرئيسية'
    },
    en: {
      teamRoster: 'Team Roster',
      sections: 'Sections',
      sectionName: 'Section Name',
      name: 'Name',
      role: 'Role',
      avatar: 'Avatar',
      backToHome: 'Back to Home'
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

  return (
    <div className="container">
      <div className="language-toggle">
        <button onClick={toggleLanguage} className="btn btn-primary">
          {language === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <header className="card">
        <h1>{t.teamRoster}</h1>
        <a href="/" className="btn btn-primary">
          {t.backToHome}
        </a>
      </header>

      <div className="card">
        <h2>{t.sections}</h2>
        
        {teamSections.map(section => (
          <div key={section.id} style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '15px',
              color: '#495057',
              border: '1px solid #dee2e6'
            }}>
              {section.name}
            </h3>
            
            <table className="table">
              <thead>
                <tr>
                  <th>{t.name}</th>
                  <th>{t.role}</th>
                  <th>{t.avatar}</th>
                </tr>
              </thead>
              <tbody>
                {section.members.map(member => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.role}</td>
                    <td>
                      <img src={member.avatar} alt={member.name} className="avatar" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPage;
