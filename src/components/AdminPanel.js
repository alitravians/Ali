import React, { useState, useEffect } from 'react';
import { useTeam } from '../context/TeamContext';

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
  const { teamSections, setTeamSections } = useTeam();
  
  console.log('AdminPanel - Current teamSections:', teamSections);
  const [newSection, setNewSection] = useState({ name: '' });
  const [selectedSectionId, setSelectedSectionId] = useState(1);
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
      sectionManagement: 'إدارة الأقسام',
      addSection: 'إضافة قسم',
      sectionName: 'اسم القسم',
      selectSection: 'اختيار القسم',
      deleteSection: 'حذف القسم',
      announcements: 'إدارة الإعلانات',
      addAnnouncement: 'إضافة إعلان',
      title: 'العنوان',
      content: 'المحتوى',
      save: 'حفظ',
      add: 'إضافة',
      name: 'الاسم',
      role: 'الصلاحية',
      avatar: 'صورة الأفاتار',
      backToHome: 'العودة للرئيسية',
      invalidCode: 'كود خاطئ',
      deleteSection: 'حذف القسم'
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
      sectionManagement: 'Section Management',
      addSection: 'Add Section',
      sectionName: 'Section Name',
      selectSection: 'Select Section',
      deleteSection: 'Delete Section',
      announcements: 'Announcements Management',
      addAnnouncement: 'Add Announcement',
      title: 'Title',
      content: 'Content',
      save: 'Save',
      add: 'Add',
      name: 'Name',
      role: 'Role',
      avatar: 'Avatar Image',
      backToHome: 'Back to Home',
      invalidCode: 'Invalid Code',
      deleteSection: 'Delete Section'
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

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = 100;
          canvas.height = 100;
          
          ctx.drawImage(img, 0, 0, 100, 100);
          
          const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
          setNewMember(prev => ({...prev, avatar: resizedImageUrl}));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSection = () => {
    if (newSection.name) {
      const newSectionId = Date.now();
      setTeamSections(prev => [
        ...prev,
        {
          id: newSectionId,
          name: newSection.name,
          members: []
        }
      ]);
      setSelectedSectionId(newSectionId);
      setNewSection({ name: '' });
      console.log('AdminPanel - Created new section with ID:', newSectionId, 'and auto-selected it');
    }
  };

  const handleDeleteSection = (sectionId) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this section?')) {
      setTeamSections(prev => {
        const updatedSections = prev.filter(section => section.id !== sectionId);
        console.log('AdminPanel - Deleted section, remaining sections:', updatedSections);
        
        if (selectedSectionId === sectionId && updatedSections.length > 0) {
          setSelectedSectionId(updatedSections[0].id);
        }
        
        return updatedSections;
      });
    }
  };

  const handleAddMember = () => {
    if (newMember.name && newMember.role && selectedSectionId) {
      console.log('AdminPanel - Adding member to section ID:', selectedSectionId);
      const newTeamMember = {
        ...newMember,
        id: Date.now(),
        avatar: newMember.avatar || `https://via.placeholder.com/100x100/007bff/ffffff?text=${newMember.name.charAt(0)}`
      };
      
      setTeamSections(prevSections => {
        const updatedSections = prevSections.map(section => 
          section.id === parseInt(selectedSectionId)
            ? {
                ...section,
                members: [...section.members, newTeamMember]
              }
            : section
        );
        console.log('AdminPanel - Updated sections after adding member:', updatedSections);
        return updatedSections;
      });
      
      const sectionName = teamSections.find(s => s.id === parseInt(selectedSectionId))?.name;
      
      const verifySync = () => {
        try {
          const savedData = localStorage.getItem('teamSections');
          const parsedData = JSON.parse(savedData);
          const targetSection = parsedData.find(s => s.id === parseInt(selectedSectionId));
          const memberExists = targetSection?.members.some(m => m.name === newMember.name);
          
          if (memberExists) {
            console.log('✅ تم التحقق من المزامنة بنجاح');
            return true;
          } else {
            console.warn('⚠️ فشل في التحقق من المزامنة');
            return false;
          }
        } catch (error) {
          console.error('❌ خطأ في التحقق من المزامنة:', error);
          return false;
        }
      };
      
      setTimeout(() => {
        const syncSuccess = verifySync();
        
        if (syncSuccess) {
          const shouldOpenTeamPage = confirm(language === 'ar' ? 
            `✅ تم إضافة العضو "${newMember.name}" بنجاح إلى قسم "${sectionName}"\n\n🔄 هل تريد فتح صفحة الفريق للتحقق من التغييرات؟\n\n💡 نصيحة: إذا لم تظهر التغييرات، قم بتحديث الصفحة أو مسح كاش المتصفح` : 
            `✅ Member "${newMember.name}" added successfully to section "${sectionName}"\n\n🔄 Do you want to open the team page to verify the changes?\n\n💡 Tip: If changes don't appear, refresh the page or clear browser cache`);
          
          if (shouldOpenTeamPage) {
            window.open('/team', '_blank');
          }
        } else {
          const shouldRefresh = confirm(language === 'ar' ? 
            `⚠️ تم إضافة العضو "${newMember.name}" ولكن قد تحتاج لتحديث الصفحة\n\n🔄 هل تريد تحديث الصفحة الآن لضمان ظهور التغييرات؟` : 
            `⚠️ Member "${newMember.name}" was added but you may need to refresh\n\n🔄 Do you want to refresh the page now to ensure changes appear?`);
          
          if (shouldRefresh) {
            window.location.reload();
          }
        }
      }, 500);

      setNewMember({ name: '', role: '', avatar: '' });
      
      setTimeout(() => {
        const memberElements = document.querySelectorAll('.team-member');
        const lastMember = memberElements[memberElements.length - 1];
        if (lastMember) {
          lastMember.scrollIntoView({ behavior: 'smooth', block: 'center' });
          lastMember.style.backgroundColor = '#e3f2fd';
          lastMember.style.border = '2px solid #2196f3';
          lastMember.style.transition = 'all 0.3s ease';
          
          setTimeout(() => {
            lastMember.style.backgroundColor = '';
            lastMember.style.border = '';
          }, 3000);
        }
      }, 100);
    } else {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
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
              placeholder=""
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
        <h2>{t.sectionManagement}</h2>
        
        <div className="form-group">
          <label className="form-label">{t.sectionName}</label>
          <input
            type="text"
            className="form-input"
            value={newSection.name}
            onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <button onClick={handleAddSection} className="btn btn-primary">
          {t.addSection}
        </button>
      </div>

      <div className="card">
        <h2>{t.teamManagement}</h2>
        
        <div style={{ 
          backgroundColor: '#d1ecf1', 
          border: '1px solid #bee5eb', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '20px',
          color: '#0c5460'
        }}>
          <strong>
            {language === 'ar' ? '📋 معلومات مهمة حول إدارة الفريق:' : '📋 Important Team Management Information:'}
          </strong>
          <ul style={{ 
            margin: '10px 0', 
            paddingLeft: language === 'ar' ? '0' : '20px', 
            paddingRight: language === 'ar' ? '20px' : '0',
            listStyle: 'none'
          }}>
            <li style={{ marginBottom: '8px' }}>
              {language === 'ar' ? 
                '💾 البيانات محفوظة محلياً في هذا المتصفح فقط' :
                '💾 Data is saved locally in this browser only'
              }
            </li>
            <li style={{ marginBottom: '8px' }}>
              {language === 'ar' ? 
                '🔄 إذا لم تظهر التغييرات فوراً، قم بتحديث الصفحة أو مسح كاش المتصفح' :
                '🔄 If changes don\'t appear immediately, refresh the page or clear browser cache'
              }
            </li>
            <li style={{ marginBottom: '8px' }}>
              {language === 'ar' ? 
                '👥 تحقق من صفحة الفريق بعد إضافة أعضاء جدد للتأكد من ظهورهم' :
                '👥 Check the team page after adding new members to verify they appear'
              }
            </li>
            <li style={{ marginBottom: '8px' }}>
              {language === 'ar' ? 
                '⚡ استخدم أزرار التحديث والعرض أدناه للتحقق السريع من التغييرات' :
                '⚡ Use the refresh and view buttons below for quick verification of changes'
              }
            </li>
          </ul>
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.open('/team', '_blank')}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {language === 'ar' ? '🔗 فتح صفحة الفريق' : '🔗 Open Team Page'}
            </button>
            <button 
              onClick={() => {
                if (confirm(language === 'ar' ? 
                  'هل تريد تحديث هذه الصفحة لإعادة تحميل البيانات؟' : 
                  'Do you want to refresh this page to reload data?')) {
                  window.location.reload();
                }
              }}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {language === 'ar' ? '🔄 تحديث الصفحة' : '🔄 Refresh Page'}
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">{t.selectSection}</label>
          <select 
            className="form-input"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(parseInt(e.target.value))}
          >
            {teamSections.map(section => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>
        
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
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="form-input"
          />
          {newMember.avatar && (
            <div style={{ marginTop: '10px' }}>
              <img 
                src={newMember.avatar} 
                alt="Avatar Preview" 
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ddd' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={handleAddMember} className="btn btn-primary">
            {t.add}
          </button>
          
          <button 
            onClick={() => window.open('/team', '_blank')} 
            className="btn btn-success"
          >
            {language === 'ar' ? 'عرض في لائحة الفريق' : 'View in Team Roster'}
          </button>
          
          <button 
            onClick={() => {
              const savedSections = localStorage.getItem('teamSections');
              if (savedSections) {
                try {
                  const parsed = JSON.parse(savedSections);
                  setTeamSections(parsed);
                  alert(language === 'ar' ? 
                    '✅ تم تحديث البيانات بنجاح من التخزين المحلي' : 
                    '✅ Data refreshed successfully from local storage');
                } catch (error) {
                  alert(language === 'ar' ? 
                    '❌ خطأ في تحديث البيانات من التخزين المحلي' : 
                    '❌ Error refreshing data from local storage');
                }
              } else {
                alert(language === 'ar' ? 
                  '⚠️ لا توجد بيانات محفوظة في التخزين المحلي' : 
                  '⚠️ No saved data found in local storage');
              }
            }}
            className="btn"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {language === 'ar' ? '🔄 تحديث البيانات' : '🔄 Refresh Data'}
          </button>
          
          <button 
            onClick={() => {
              try {
                const savedData = localStorage.getItem('teamSections');
                const parsedData = JSON.parse(savedData);
                const totalMembers = parsedData.reduce((total, section) => total + section.members.length, 0);
                const totalSections = parsedData.length;
                
                alert(language === 'ar' ? 
                  `📊 حالة البيانات:\n• عدد الأقسام: ${totalSections}\n• إجمالي الأعضاء: ${totalMembers}\n• آخر تحديث: ${new Date().toLocaleString('ar-SA')}` : 
                  `📊 Data Status:\n• Sections: ${totalSections}\n• Total Members: ${totalMembers}\n• Last Update: ${new Date().toLocaleString()}`);
              } catch (error) {
                alert(language === 'ar' ? 
                  '❌ خطأ في فحص حالة البيانات' : 
                  '❌ Error checking data status');
              }
            }}
            className="btn"
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {language === 'ar' ? '📊 فحص البيانات' : '📊 Check Data'}
          </button>
        </div>

        <div style={{ marginTop: '20px' }}>
          {teamSections.map(section => (
            <div key={section.id} style={{ marginBottom: '20px' }}>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '10px', 
                borderRadius: '5px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h4 style={{ margin: 0 }}>
                  {section.name}
                </h4>
                <button 
                  onClick={() => handleDeleteSection(section.id)}
                  className="btn btn-danger"
                  style={{ 
                    fontSize: '12px', 
                    padding: '5px 10px',
                    minWidth: 'auto'
                  }}
                >
                  {t.deleteSection}
                </button>
              </div>
              <div className="team-grid">
                {section.members.map(member => (
                  <div key={member.id} className="team-member">
                    <img src={member.avatar} alt={member.name} className="avatar" />
                    <h5>{member.name}</h5>
                    <p>{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
