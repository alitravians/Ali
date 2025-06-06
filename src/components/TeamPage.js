import React, { useState, useEffect } from 'react';

const TeamPage = () => {
  const [language, setLanguage] = useState('ar');
  const [teamSections, setTeamSections] = useState([
    {
      id: 1,
      name: 'الإدارة العامة',
      members: [
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
        }
      ]
    },
    {
      id: 2,
      name: 'القسم التقني',
      members: [
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
      ]
    },
    {
      id: 3,
      name: 'قسم التسويق',
      members: [
        {
          id: 5,
          name: 'سارة أحمد',
          role: 'مديرة التسويق',
          avatar: 'https://via.placeholder.com/80x80/6f42c1/ffffff?text=SA'
        }
      ]
    },
    {
      id: 4,
      name: 'قسم خدمة العملاء',
      members: [
        {
          id: 6,
          name: 'عمر خالد',
          role: 'مسؤول خدمة العملاء',
          avatar: 'https://via.placeholder.com/80x80/fd7e14/ffffff?text=OK'
        }
      ]
    }
  ]);

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
                  <th>{t.avatar}</th>
                  <th>{t.name}</th>
                  <th>{t.role}</th>
                </tr>
              </thead>
              <tbody>
                {section.members.map(member => (
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPage;
