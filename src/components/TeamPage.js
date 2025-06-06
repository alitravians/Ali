import React, { useState, useEffect } from 'react';

const TeamPage = () => {
  const [language, setLanguage] = useState('ar');
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: 'أحمد محمد',
      role: 'مدير عام',
      avatar: 'https://via.placeholder.com/80x80/007bff/ffffff?text=AM'
    },
    {
      id: 2,
      name: 'فاطمة علي',
      role: 'مديرة المحتوى',
      avatar: 'https://via.placeholder.com/80x80/28a745/ffffff?text=FA'
    },
    {
      id: 3,
      name: 'محمد سالم',
      role: 'مطور تقني',
      avatar: 'https://via.placeholder.com/80x80/dc3545/ffffff?text=MS'
    },
    {
      id: 4,
      name: 'نورا حسن',
      role: 'مصممة جرافيك',
      avatar: 'https://via.placeholder.com/80x80/ffc107/ffffff?text=NH'
    }
  ]);

  const translations = {
    ar: {
      teamRoster: 'لائحة فريق العمل',
      generalManagement: 'الإدارة العامة',
      name: 'الاسم',
      role: 'الصلاحية',
      avatar: 'الأفاتار',
      backToHome: 'العودة للرئيسية'
    },
    en: {
      teamRoster: 'Team Roster',
      generalManagement: 'General Management',
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
        <h2>{t.generalManagement}</h2>
        
        <table className="table">
          <thead>
            <tr>
              <th>{t.avatar}</th>
              <th>{t.name}</th>
              <th>{t.role}</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map(member => (
              <tr key={member.id}>
                <td>
                  <img src={member.avatar} alt={member.name} className="avatar" />
                </td>
                <td>{member.name}</td>
                <td>{member.role}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="team-grid">
          {teamMembers.map(member => (
            <div key={member.id} className="team-member">
              <img src={member.avatar} alt={member.name} className="avatar" />
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
