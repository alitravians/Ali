import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [language, setLanguage] = useState('ar');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [siteData, setSiteData] = useState({
    isClosed: false,
    closureReason: '',
    announcements: [],
    sections: {
      joining: 'محتوى كيفية الانضمام للوكالة',
      trends: 'محتوى كيفية طلب ترند',
      benefits: 'محتوى كيفية الاستفادة من البرنامج'
    }
  });
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: 'أحمد محمد',
      role: 'مدير عام',
      avatar: 'https://via.placeholder.com/80x80/007bff/ffffff?text=AM'
    }
  ]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newMember, setNewMember] = useState({ name: '', role: '', avatar: '' });

  const translations = {
    ar: {
      adminPanel: 'لوحة التحكم الإدارية',
      accessCode: 'كود الدخول',
      login: 'دخول',
      logout: 'خروج',
      siteControl: 'التحكم في الموقع',
      openSite: 'فتح الموقع',
      closeSite: 'إغلاق الموقع',
      closureReason: 'سبب الإغلاق',
      contentManagement: 'إدارة المحتوى',
      joining: 'كيفية الانضمام للوكالة',
      trends: 'كيفية طلب ترند',
      benefits: 'كيفية الاستفادة من البرنامج',
      teamManagement: 'إدارة الفريق',
      announcements: 'إدارة الإعلانات',
      addAnnouncement: 'إضافة إعلان',
      title: 'العنوان',
      content: 'المحتوى',
      save: 'حفظ',
      add: 'إضافة',
      name: 'الاسم',
      role: 'الصلاحية',
      avatar: 'رابط الأفاتار',
      backToHome: 'العودة للرئيسية',
      invalidCode: 'كود خاطئ'
    },
    en: {
      adminPanel: 'Admin Control Panel',
      accessCode: 'Access Code',
      login: 'Login',
      logout: 'Logout',
      siteControl: 'Site Control',
      openSite: 'Open Site',
      closeSite: 'Close Site',
      closureReason: 'Closure Reason',
      contentManagement: 'Content Management',
      joining: 'How to Join the Agency',
      trends: 'How to Request Trends',
      benefits: 'How to Benefit from the Program',
      teamManagement: 'Team Management',
      announcements: 'Announcements Management',
      addAnnouncement: 'Add Announcement',
      title: 'Title',
      content: 'Content',
      save: 'Save',
      add: 'Add',
      name: 'Name',
      role: 'Role',
      avatar: 'Avatar URL',
      backToHome: 'Back to Home',
      invalidCode: 'Invalid Code'
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

  const handleLogin = () => {
    if (accessCode === '3131') {
      setIsAuthenticated(true);
      setAccessCode('');
    } else {
      alert(t.invalidCode);
    }
  };

  const handleSiteToggle = () => {
    setSiteData(prev => ({
      ...prev,
      isClosed: !prev.isClosed
    }));
  };

  const handleSectionUpdate = (section, value) => {
    setSiteData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: value
      }
    }));
  };

  const handleAddAnnouncement = () => {
    if (newAnnouncement.title && newAnnouncement.content) {
      setSiteData(prev => ({
        ...prev,
        announcements: [
          ...prev.announcements,
          {
            ...newAnnouncement,
            date: new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US'),
            id: Date.now()
          }
        ]
      }));
      setNewAnnouncement({ title: '', content: '' });
    }
  };

  const handleAddMember = () => {
    if (newMember.name && newMember.role) {
      setTeamMembers(prev => [
        ...prev,
        {
          ...newMember,
          id: Date.now(),
          avatar: newMember.avatar || `https://via.placeholder.com/80x80/007bff/ffffff?text=${newMember.name.charAt(0)}`
        }
      ]);
      setNewMember({ name: '', role: '', avatar: '' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="language-toggle">
          <button onClick={toggleLanguage} className="btn btn-primary">
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        <div className="card" style={{ maxWidth: '400px', margin: '100px auto' }}>
          <h1>{t.adminPanel}</h1>
          <div className="form-group">
            <label className="form-label">{t.accessCode}</label>
            <input
              type="password"
              className="form-input"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="3131"
            />
          </div>
          <button onClick={handleLogin} className="btn btn-primary">
            {t.login}
          </button>
          <div style={{ marginTop: '20px' }}>
            <a href="/" className="btn btn-success">
              {t.backToHome}
            </a>
          </div>
        </div>
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
        <h1>{t.adminPanel}</h1>
        <div>
          <button onClick={() => setIsAuthenticated(false)} className="btn btn-danger" style={{ marginRight: '10px' }}>
            {t.logout}
          </button>
          <a href="/" className="btn btn-success">
            {t.backToHome}
          </a>
        </div>
      </header>

      <div className="card">
        <h2>{t.siteControl}</h2>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleSiteToggle}
            className={`btn ${siteData.isClosed ? 'btn-success' : 'btn-danger'}`}
          >
            {siteData.isClosed ? t.openSite : t.closeSite}
          </button>
        </div>
        {siteData.isClosed && (
          <div className="form-group">
            <label className="form-label">{t.closureReason}</label>
            <textarea
              className="form-textarea"
              value={siteData.closureReason}
              onChange={(e) => setSiteData(prev => ({ ...prev, closureReason: e.target.value }))}
            />
          </div>
        )}
      </div>

      <div className="card">
        <h2>{t.contentManagement}</h2>
        
        <div className="form-group">
          <label className="form-label">{t.joining}</label>
          <textarea
            className="form-textarea"
            value={siteData.sections.joining}
            onChange={(e) => handleSectionUpdate('joining', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.trends}</label>
          <textarea
            className="form-textarea"
            value={siteData.sections.trends}
            onChange={(e) => handleSectionUpdate('trends', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.benefits}</label>
          <textarea
            className="form-textarea"
            value={siteData.sections.benefits}
            onChange={(e) => handleSectionUpdate('benefits', e.target.value)}
          />
        </div>

        <button onClick={() => alert('تم حفظ التغييرات')} className="btn btn-success">
          {t.save}
        </button>
      </div>

      <div className="card">
        <h2>{t.announcements}</h2>
        
        <div className="form-group">
          <label className="form-label">{t.title}</label>
          <input
            type="text"
            className="form-input"
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.content}</label>
          <textarea
            className="form-textarea"
            value={newAnnouncement.content}
            onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
          />
        </div>

        <button onClick={handleAddAnnouncement} className="btn btn-primary">
          {t.addAnnouncement}
        </button>
      </div>

      <div className="card">
        <h2>{t.teamManagement}</h2>
        
        <div className="form-group">
          <label className="form-label">{t.name}</label>
          <input
            type="text"
            className="form-input"
            value={newMember.name}
            onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.role}</label>
          <input
            type="text"
            className="form-input"
            value={newMember.role}
            onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.avatar}</label>
          <input
            type="url"
            className="form-input"
            value={newMember.avatar}
            onChange={(e) => setNewMember(prev => ({ ...prev, avatar: e.target.value }))}
          />
        </div>

        <button onClick={handleAddMember} className="btn btn-primary">
          {t.add}
        </button>

        <div className="team-grid" style={{ marginTop: '20px' }}>
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

export default AdminPanel;
