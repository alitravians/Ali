import { useState, useEffect } from 'react';
import axios from 'axios';
import AIScanner from './AIScanner';

interface AdminPanelProps {
  user: any;
  token: string;
  language: 'ar' | 'en';
  apiUrl: string;
  onLogout: () => void;
  onGoToChat: () => void;
}

const AdminPanel = ({ user, language, apiUrl, onLogout, onGoToChat }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [mutes, setMutes] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [banUserId, setBanUserId] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [banReason, setBanReason] = useState('');
  
  const [muteUserId, setMuteUserId] = useState('');
  const [muteDuration, setMuteDuration] = useState('');
  const [muteReason, setMuteReason] = useState('');
  
  const [announcementText, setAnnouncementText] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [closeMessage, setCloseMessage] = useState('');
  
  const [reportStats, setReportStats] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportFilter, setReportFilter] = useState('all');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [banDurationForReport, setBanDurationForReport] = useState('30');
  
  const [loginSettings, setLoginSettings] = useState({
    allow_registration: true,
    app_name: 'Entertainment Chat',
    background_type: 'color',
    background_color: '#1a1a2e',
    background_image_url: '',
    background_size: 'cover',
    background_position: 'center',
    background_repeat: 'no-repeat',
    overlay_color: '',
    overlay_opacity: 0
  });

  const texts = {
    ar: {
      adminPanel: 'لوحة الإدارة',
      users: 'المستخدمون',
      bans: 'المحظورون',
      mutes: 'المكتومون',
      reports: 'البلاغات',
      appeals: 'طلبات الاعتراض',
      files: 'الملفات المعلقة',
      messages: 'الرسائل',
      chatSettings: 'إعدادات الدردشة',
      announcements: 'الإعلانات',
      aiScanner: 'الماسح الذكي',
      loginPageSettings: 'إعدادات صفحة الدخول',
      backToChat: 'العودة للدردشة',
      logout: 'تسجيل الخروج',
      banUser: 'حظر مستخدم',
      userId: 'معرف المستخدم',
      duration: 'المدة (بالدقائق)',
      reason: 'السبب',
      ban: 'حظر',
      unban: 'إلغاء الحظر',
      muteUser: 'كتم مستخدم',
      mute: 'كتم',
      resolve: 'حل',
      approve: 'قبول',
      reject: 'رفض',
      clearAll: 'مسح الكل',
      delete: 'حذف',
      createAnnouncement: 'إنشاء إعلان',
      announcementText: 'نص الإعلان',
      create: 'إنشاء',
      existingAnnouncements: 'الإعلانات الحالية',
      edit: 'تعديل',
      editAnnouncement: 'تعديل الإعلان',
      save: 'حفظ',
      cancel: 'إلغاء',
      confirmDelete: 'تأكيد الحذف',
      confirmDeleteMessage: 'هل أنت متأكد من حذف هذا الإعلان؟',
      noAnnouncements: 'لا توجد إعلانات',
      chatStatus: 'حالة الدردشة',
      open: 'مفتوحة',
      closed: 'مغلقة',
      closeMessageLabel: 'رسالة الإغلاق',
      updateSettings: 'تحديث الإعدادات',
      remainingTime: 'الوقت المتبقي',
      minutes: 'دقيقة',
      pending: 'قيد المراجعة',
      resolved: 'تم الحل',
      response: 'الرد',
      send: 'إرسال',
      statistics: 'الإحصائيات',
      totalReports: 'إجمالي البلاغات',
      pendingReports: 'البلاغات المعلقة',
      resolvedReports: 'البلاغات المحلولة',
      rejectedReports: 'البلاغات المرفوضة',
      filterByStatus: 'تصفية حسب الحالة',
      filterByCategory: 'تصفية حسب الفئة',
      all: 'الكل',
      rejected: 'مرفوض',
      searchReports: 'بحث في البلاغات...',
      reportDetails: 'تفاصيل البلاغ',
      reporter: 'المبلغ',
      reportedMessage: 'الرسالة المبلغ عنها',
      category: 'الفئة',
      status: 'الحالة',
      reportReason: 'سبب البلاغ',
      reportedAt: 'تاريخ البلاغ',
      quickActions: 'إجراءات سريعة',
      banUserAction: 'حظر المستخدم',
      deleteMessageAction: 'حذف الرسالة',
      dismissReport: 'رفض البلاغ',
      resolveReport: 'حل البلاغ',
      close: 'إغلاق',
      noReports: 'لا توجد بلاغات',
      viewDetails: 'عرض التفاصيل',
      offensive: 'محتوى مسيء',
      inappropriate: 'محتوى غير لائق',
      spam: 'رسائل مزعجة',
      harassment: 'تحرش',
      religionPolitics: 'دين/سياسة',
      other: 'أخرى',
      reportedUser: 'المستخدم المبلغ عنه',
      messageContent: 'محتوى الرسالة',
      actionTaken: 'الإجراء المتخذ',
      userBanned: 'تم حظر المستخدم',
      messageDeleted: 'تم حذف الرسالة',
      noAction: 'لا يوجد إجراء',
    },
    en: {
      adminPanel: 'Admin Panel',
      users: 'Users',
      bans: 'Bans',
      mutes: 'Mutes',
      reports: 'Reports',
      appeals: 'Appeals',
      files: 'Pending Files',
      messages: 'Messages',
      chatSettings: 'Chat Settings',
      announcements: 'Announcements',
      aiScanner: 'AI Scanner',
      loginPageSettings: 'Login Page Settings',
      backToChat: 'Back to Chat',
      logout: 'Logout',
      banUser: 'Ban User',
      userId: 'User ID',
      duration: 'Duration (minutes)',
      reason: 'Reason',
      ban: 'Ban',
      unban: 'Unban',
      muteUser: 'Mute User',
      mute: 'Mute',
      resolve: 'Resolve',
      approve: 'Approve',
      reject: 'Reject',
      clearAll: 'Clear All',
      delete: 'Delete',
      createAnnouncement: 'Create Announcement',
      announcementText: 'Announcement Text',
      create: 'Create',
      existingAnnouncements: 'Existing Announcements',
      edit: 'Edit',
      editAnnouncement: 'Edit Announcement',
      save: 'Save',
      cancel: 'Cancel',
      confirmDelete: 'Confirm Delete',
      confirmDeleteMessage: 'Are you sure you want to delete this announcement?',
      noAnnouncements: 'No announcements',
      chatStatus: 'Chat Status',
      open: 'Open',
      closed: 'Closed',
      closeMessageLabel: 'Close Message',
      updateSettings: 'Update Settings',
      remainingTime: 'Remaining Time',
      minutes: 'minutes',
      pending: 'Pending',
      resolved: 'Resolved',
      response: 'Response',
      send: 'Send',
      statistics: 'Statistics',
      totalReports: 'Total Reports',
      pendingReports: 'Pending Reports',
      resolvedReports: 'Resolved Reports',
      rejectedReports: 'Rejected Reports',
      filterByStatus: 'Filter by Status',
      filterByCategory: 'Filter by Category',
      all: 'All',
      rejected: 'Rejected',
      searchReports: 'Search reports...',
      reportDetails: 'Report Details',
      reporter: 'Reporter',
      reportedMessage: 'Reported Message',
      category: 'Category',
      status: 'Status',
      reportReason: 'Report Reason',
      reportedAt: 'Reported At',
      quickActions: 'Quick Actions',
      banUserAction: 'Ban User',
      deleteMessageAction: 'Delete Message',
      dismissReport: 'Dismiss Report',
      resolveReport: 'Resolve Report',
      close: 'Close',
      noReports: 'No reports found',
      viewDetails: 'View Details',
      offensive: 'Offensive Content',
      inappropriate: 'Inappropriate Content',
      spam: 'Spam',
      harassment: 'Harassment',
      religionPolitics: 'Religion/Politics',
      other: 'Other',
      reportedUser: 'Reported User',
      messageContent: 'Message Content',
      actionTaken: 'Action Taken',
      userBanned: 'User Banned',
      messageDeleted: 'Message Deleted',
      noAction: 'No Action',
    }
  };

  const t = texts[language];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'users') {
        const response = await axios.get(`${apiUrl}/api/users`);
        setUsers(response.data.users);
      } else if (activeTab === 'bans') {
        const response = await axios.get(`${apiUrl}/api/admin/bans`);
        setBans(response.data.bans);
      } else if (activeTab === 'mutes') {
        const response = await axios.get(`${apiUrl}/api/admin/mutes`);
        setMutes(response.data.mutes);
      } else if (activeTab === 'reports') {
        const response = await axios.get(`${apiUrl}/api/admin/reports`);
        setReports(response.data.reports);
        const statsResponse = await axios.get(`${apiUrl}/api/admin/reports/statistics`);
        setReportStats(statsResponse.data);
      } else if (activeTab === 'appeals') {
        const response = await axios.get(`${apiUrl}/api/admin/appeals`);
        setAppeals(response.data.appeals);
      } else if (activeTab === 'files') {
        const response = await axios.get(`${apiUrl}/api/admin/files`);
        setPendingFiles(response.data.files);
      } else if (activeTab === 'messages') {
        const response = await axios.get(`${apiUrl}/api/messages`);
        setMessages(response.data.messages);
      } else if (activeTab === 'chatSettings') {
        const response = await axios.get(`${apiUrl}/api/chat/settings`);
        setChatOpen(response.data.settings.is_open);
        setCloseMessage(response.data.settings.close_message);
      } else if (activeTab === 'announcements') {
        const response = await axios.get(`${apiUrl}/api/announcements`);
        setAnnouncements(response.data.announcements);
      } else if (activeTab === 'loginPageSettings') {
        const response = await axios.get(`${apiUrl}/api/login/settings`);
        setLoginSettings(response.data.settings);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  const handleBanUser = async () => {
    if (!banUserId || !banDuration || !banReason) return;

    try {
      await axios.post(`${apiUrl}/api/admin/ban`, {
        user_id: banUserId,
        duration_minutes: parseInt(banDuration),
        reason: banReason
      });

      alert('User banned successfully');
      setBanUserId('');
      setBanDuration('');
      setBanReason('');
      loadData();
    } catch (err) {
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await axios.post(`${apiUrl}/api/admin/unban/${userId}`);
      alert('User unbanned successfully');
      loadData();
    } catch (err) {
      alert('Failed to unban user');
    }
  };

  const handleMuteUser = async () => {
    if (!muteUserId || !muteDuration || !muteReason) return;

    try {
      await axios.post(`${apiUrl}/api/admin/mute`, {
        user_id: muteUserId,
        duration_minutes: parseInt(muteDuration),
        reason: muteReason
      });

      alert('User muted successfully');
      setMuteUserId('');
      setMuteDuration('');
      setMuteReason('');
      loadData();
    } catch (err) {
      alert('Failed to mute user');
    }
  };

  const handleUnmuteUser = async (userId: string) => {
    try {
      await axios.post(`${apiUrl}/api/admin/unmute/${userId}`);
      alert('User unmuted successfully');
      loadData();
    } catch (err) {
      alert('Failed to unmute user');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await axios.post(`${apiUrl}/api/admin/reports/${reportId}/resolve`);
      alert('Report resolved');
      setShowReportDetails(false);
      setSelectedReport(null);
      loadData();
    } catch (err) {
      alert('Failed to resolve report');
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      await axios.post(`${apiUrl}/api/admin/reports/${reportId}/reject`);
      alert('Report rejected');
      setShowReportDetails(false);
      setSelectedReport(null);
      loadData();
    } catch (err) {
      alert('Failed to reject report');
    }
  };

  const handleBanUserFromReport = async (reportId: string, duration: number) => {
    try {
      await axios.post(`${apiUrl}/api/admin/reports/${reportId}/ban-user?duration=${duration}`);
      alert(`User banned for ${duration} minutes`);
      setShowReportDetails(false);
      setSelectedReport(null);
      loadData();
    } catch (err) {
      alert('Failed to ban user');
    }
  };

  const handleDeleteMessageFromReport = async (reportId: string) => {
    try {
      await axios.post(`${apiUrl}/api/admin/reports/${reportId}/delete-message`);
      alert('Message deleted');
      setShowReportDetails(false);
      setSelectedReport(null);
      loadData();
    } catch (err) {
      alert('Failed to delete message');
    }
  };

  const openReportDetails = (report: any) => {
    setSelectedReport(report);
    setShowReportDetails(true);
  };

  const handleRespondToAppeal = async (appealId: string, action: 'accept' | 'reject', response: string) => {
    try {
      await axios.post(`${apiUrl}/api/admin/appeals/respond`, {
        appeal_id: appealId,
        response,
        action
      });

      alert(`Appeal ${action}ed successfully`);
      loadData();
    } catch (err) {
      alert('Failed to respond to appeal');
    }
  };

  const handleApproveFile = async (fileId: string) => {
    try {
      await axios.post(`${apiUrl}/api/admin/files/${fileId}/approve`);
      alert('File approved');
      loadData();
    } catch (err) {
      alert('Failed to approve file');
    }
  };

  const handleRejectFile = async (fileId: string) => {
    try {
      await axios.post(`${apiUrl}/api/admin/files/${fileId}/reject`);
      alert('File rejected');
      loadData();
    } catch (err) {
      alert('Failed to reject file');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await axios.delete(`${apiUrl}/api/messages/${messageId}`);
      alert('Message deleted');
      loadData();
    } catch (err) {
      alert('Failed to delete message');
    }
  };

  const handleClearMessages = async () => {
    if (!confirm('Are you sure you want to clear all messages?')) return;

    try {
      await axios.delete(`${apiUrl}/api/messages`);
      alert('All messages cleared');
      loadData();
    } catch (err) {
      alert('Failed to clear messages');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementText) return;

    try {
      await axios.post(`${apiUrl}/api/admin/announcements`, {
        content: announcementText,
        created_by: user.username
      });

      alert('Announcement created');
      setAnnouncementText('');
      loadData();
    } catch (err) {
      alert('Failed to create announcement');
    }
  };

  const handleEditAnnouncement = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAnnouncement || !editingAnnouncement.content) return;

    try {
      await axios.put(`${apiUrl}/api/admin/announcements/${editingAnnouncement.id}`, {
        content: editingAnnouncement.content,
        created_by: user.username
      });

      alert('Announcement updated');
      setShowEditModal(false);
      setEditingAnnouncement(null);
      loadData();
    } catch (err) {
      alert('Failed to update announcement');
    }
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    setAnnouncementToDelete(announcementId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      await axios.delete(`${apiUrl}/api/admin/announcements/${announcementToDelete}`);

      alert('Announcement deleted');
      setShowDeleteConfirm(false);
      setAnnouncementToDelete(null);
      loadData();
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAnnouncementToDelete(null);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingAnnouncement(null);
  };

  const handleUpdateChatSettings = async () => {
    try {
      await axios.post(`${apiUrl}/api/admin/chat/settings`, {
        is_open: chatOpen,
        close_message: closeMessage
      });

      alert('Chat settings updated');
    } catch (err) {
      alert('Failed to update chat settings');
    }
  };

  const handleUpdateLoginSettings = async () => {
    try {
      await axios.post(`${apiUrl}/api/admin/login/settings`, loginSettings);
      alert(language === 'ar' ? 'تم تحديث إعدادات صفحة الدخول بنجاح' : 'Login page settings updated successfully');
    } catch (err) {
      alert(language === 'ar' ? 'فشل تحديث إعدادات صفحة الدخول' : 'Failed to update login page settings');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>{t.adminPanel}</h2>
        <div className="header-actions">
          <button onClick={onGoToChat} className="chat-btn">{t.backToChat}</button>
          <button onClick={onLogout} className="logout-btn">{t.logout}</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>{t.users}</button>
        <button className={activeTab === 'bans' ? 'active' : ''} onClick={() => setActiveTab('bans')}>{t.bans}</button>
        <button className={activeTab === 'mutes' ? 'active' : ''} onClick={() => setActiveTab('mutes')}>{t.mutes}</button>
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>{t.reports}</button>
        <button className={activeTab === 'appeals' ? 'active' : ''} onClick={() => setActiveTab('appeals')}>{t.appeals}</button>
        <button className={activeTab === 'files' ? 'active' : ''} onClick={() => setActiveTab('files')}>{t.files}</button>
        <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>{t.messages}</button>
        <button className={activeTab === 'chatSettings' ? 'active' : ''} onClick={() => setActiveTab('chatSettings')}>{t.chatSettings}</button>
        <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => setActiveTab('announcements')}>{t.announcements}</button>
        <button className={activeTab === 'loginPageSettings' ? 'active' : ''} onClick={() => setActiveTab('loginPageSettings')}>{t.loginPageSettings}</button>
        <button className={activeTab === 'aiScanner' ? 'active' : ''} onClick={() => setActiveTab('aiScanner')}>{t.aiScanner}</button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="users-section">
            <h3>{t.users}</h3>
            <div className="users-list">
              {users.map(u => (
                <div key={u.user_id} className="user-item">
                  <span>{u.username} ({u.user_id}) - {u.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bans' && (
          <div className="bans-section-enhanced">
            <div className="bans-header">
              <h3>🚫 {t.banUser}</h3>
              <p className="bans-subtitle">إدارة المستخدمين المحظورين ومدة الحظر</p>
            </div>

            <div className="ban-form-card">
              <div className="form-card-header">
                <span className="form-icon">➕</span>
                <h4>حظر مستخدم جديد</h4>
              </div>
              <div className="form-card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>معرف المستخدم</label>
                    <input
                      type="text"
                      placeholder="أدخل معرف المستخدم..."
                      value={banUserId}
                      onChange={(e) => setBanUserId(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>المدة (بالدقائق)</label>
                    <input
                      type="number"
                      placeholder="مثال: 30"
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      className="form-input"
                      min="1"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>سبب الحظر</label>
                    <input
                      type="text"
                      placeholder="مثال: مخالفة قواعد الدردشة..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
                <button className="btn-submit-ban" onClick={handleBanUser}>
                  <span className="btn-icon">🚫</span>
                  {t.ban}
                </button>
              </div>
            </div>

            <div className="bans-list-section">
              <h4 className="section-title">
                <span className="title-icon">📋</span>
                المستخدمون المحظورون ({bans.length})
              </h4>
              
              {bans.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <p>لا يوجد مستخدمون محظورون حالياً</p>
                </div>
              ) : (
                <div className="bans-grid">
                  {bans.map(ban => (
                    <div key={ban.user_id} className="ban-card">
                      <div className="ban-card-header">
                        <div className="ban-user-info">
                          <span className="ban-icon">🚫</span>
                          <div>
                            <strong>{ban.user_id}</strong>
                            <span className="ban-time">
                              ⏱️ {ban.remaining_minutes} {t.minutes} متبقية
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ban-card-body">
                        <div className="ban-reason-section">
                          <label>السبب:</label>
                          <p>{ban.reason}</p>
                        </div>
                        <div className="ban-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{
                                width: `${Math.max(0, Math.min(100, (ban.remaining_minutes / 60) * 100))}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="ban-card-footer">
                        <button 
                          className="btn-unban"
                          onClick={() => handleUnbanUser(ban.user_id)}
                        >
                          <span className="btn-icon">✅</span>
                          {t.unban}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mutes' && (
          <div className="mutes-section-enhanced">
            <div className="mutes-header">
              <h3>🔇 {t.muteUser}</h3>
              <p className="mutes-subtitle">إدارة المستخدمين المكتومين ومنعهم من الإرسال</p>
            </div>

            <div className="mute-form-card">
              <div className="form-card-header">
                <span className="form-icon">➕</span>
                <h4>كتم مستخدم جديد</h4>
              </div>
              <div className="form-card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>معرف المستخدم</label>
                    <input
                      type="text"
                      placeholder="أدخل معرف المستخدم..."
                      value={muteUserId}
                      onChange={(e) => setMuteUserId(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>المدة (بالدقائق)</label>
                    <input
                      type="number"
                      placeholder="مثال: 15"
                      value={muteDuration}
                      onChange={(e) => setMuteDuration(e.target.value)}
                      className="form-input"
                      min="1"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>سبب الكتم</label>
                    <input
                      type="text"
                      placeholder="مثال: إرسال رسائل مزعجة..."
                      value={muteReason}
                      onChange={(e) => setMuteReason(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
                <button className="btn-submit-mute" onClick={handleMuteUser}>
                  <span className="btn-icon">🔇</span>
                  {t.mute}
                </button>
              </div>
            </div>

            <div className="mutes-list-section">
              <h4 className="section-title">
                <span className="title-icon">📋</span>
                المستخدمون المكتومون ({mutes.length})
              </h4>
              
              {mutes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <p>لا يوجد مستخدمون مكتومون حالياً</p>
                </div>
              ) : (
                <div className="mutes-grid">
                  {mutes.map(mute => (
                    <div key={mute.user_id} className="mute-card">
                      <div className="mute-card-header">
                        <div className="mute-user-info">
                          <span className="mute-icon">🔇</span>
                          <div>
                            <strong>{mute.user_id}</strong>
                            <span className="mute-time">
                              ⏱️ {mute.remaining_minutes} {t.minutes} متبقية
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mute-card-body">
                        <div className="mute-reason-section">
                          <label>السبب:</label>
                          <p>{mute.reason}</p>
                        </div>
                        <div className="mute-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill mute"
                              style={{
                                width: `${Math.max(0, Math.min(100, (mute.remaining_minutes / 30) * 100))}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="mute-card-footer">
                        <button 
                          className="btn-unmute"
                          onClick={() => handleUnmuteUser(mute.user_id)}
                        >
                          <span className="btn-icon">🔊</span>
                          إلغاء الكتم
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section-enhanced">
            <div className="reports-header">
              <h3>{t.reports}</h3>
            </div>

            {reportStats && (
              <div className="reports-statistics">
                <div className="stat-card total">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-value">{reportStats.total}</div>
                    <div className="stat-label">{t.totalReports}</div>
                  </div>
                </div>
                <div className="stat-card pending">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <div className="stat-value">{reportStats.pending}</div>
                    <div className="stat-label">{t.pendingReports}</div>
                  </div>
                </div>
                <div className="stat-card resolved">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-value">{reportStats.resolved}</div>
                    <div className="stat-label">{t.resolvedReports}</div>
                  </div>
                </div>
                <div className="stat-card rejected">
                  <div className="stat-icon">❌</div>
                  <div className="stat-content">
                    <div className="stat-value">{reportStats.rejected}</div>
                    <div className="stat-label">{t.rejectedReports}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="reports-filters">
              <div className="filter-group">
                <label>{t.filterByStatus}</label>
                <select value={reportFilter} onChange={(e) => setReportFilter(e.target.value)}>
                  <option value="all">{t.all}</option>
                  <option value="pending">{t.pending}</option>
                  <option value="resolved">{t.resolved}</option>
                  <option value="rejected">{t.rejected}</option>
                </select>
              </div>
              <div className="filter-group">
                <label>{t.filterByCategory}</label>
                <select value={reportCategoryFilter} onChange={(e) => setReportCategoryFilter(e.target.value)}>
                  <option value="all">{t.all}</option>
                  <option value="offensive">{t.offensive}</option>
                  <option value="inappropriate">{t.inappropriate}</option>
                  <option value="spam">{t.spam}</option>
                  <option value="harassment">{t.harassment}</option>
                  <option value="religion/politics">{t.religionPolitics}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>
              <div className="filter-group search-group">
                <input
                  type="text"
                  placeholder={t.searchReports}
                  value={reportSearchTerm}
                  onChange={(e) => setReportSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="reports-list-enhanced">
              {reports
                .filter(report => {
                  if (reportFilter !== 'all' && report.status !== reportFilter) return false;
                  if (reportCategoryFilter !== 'all' && report.category !== reportCategoryFilter) return false;
                  if (reportSearchTerm && !report.reason?.toLowerCase().includes(reportSearchTerm.toLowerCase()) && 
                      !report.reporter_id?.toLowerCase().includes(reportSearchTerm.toLowerCase())) return false;
                  return true;
                })
                .map(report => (
                  <div key={report.id} className={`report-card ${report.status}`}>
                    <div className="report-card-header">
                      <span className={`category-badge ${report.category}`}>
                        {(t as any)[report.category] || report.category}
                      </span>
                      <span className={`status-badge ${report.status}`}>
                        {(t as any)[report.status] || report.status}
                      </span>
                    </div>
                    <div className="report-card-body">
                      <div className="report-info">
                        <div className="report-field">
                          <strong>{t.reporter}:</strong> {report.reporter_id}
                        </div>
                        <div className="report-field">
                          <strong>{t.reportReason}:</strong> {report.reason}
                        </div>
                        <div className="report-field">
                          <strong>{t.reportedAt}:</strong> {new Date(report.created_at).toLocaleString()}
                        </div>
                        {report.action_taken && (
                          <div className="report-field action-taken">
                            <strong>{t.actionTaken}:</strong> {
                              report.action_taken === 'user_banned' ? t.userBanned :
                              report.action_taken === 'message_deleted' ? t.messageDeleted :
                              t.noAction
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="report-card-footer">
                      <button 
                        className="btn-view-details"
                        onClick={() => openReportDetails(report)}
                      >
                        {t.viewDetails}
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button 
                            className="btn-resolve"
                            onClick={() => handleResolveReport(report.id)}
                          >
                            {t.resolveReport}
                          </button>
                          <button 
                            className="btn-reject"
                            onClick={() => handleRejectReport(report.id)}
                          >
                            {t.dismissReport}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              {reports.filter(report => {
                if (reportFilter !== 'all' && report.status !== reportFilter) return false;
                if (reportCategoryFilter !== 'all' && report.category !== reportCategoryFilter) return false;
                if (reportSearchTerm && !report.reason?.toLowerCase().includes(reportSearchTerm.toLowerCase()) && 
                    !report.reporter_id?.toLowerCase().includes(reportSearchTerm.toLowerCase())) return false;
                return true;
              }).length === 0 && (
                <div className="no-reports">
                  <div className="no-reports-icon">📭</div>
                  <p>{t.noReports}</p>
                </div>
              )}
            </div>

            {showReportDetails && selectedReport && (
              <div className="modal-overlay" onClick={() => setShowReportDetails(false)}>
                <div className="modal-content report-details-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{t.reportDetails}</h3>
                    <button className="close-btn" onClick={() => setShowReportDetails(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <div className="detail-row">
                      <span className="detail-label">{t.category}:</span>
                      <span className={`category-badge ${selectedReport.category}`}>
                        {(t as any)[selectedReport.category] || selectedReport.category}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.status}:</span>
                      <span className={`status-badge ${selectedReport.status}`}>
                        {(t as any)[selectedReport.status] || selectedReport.status}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.reporter}:</span>
                      <span>{selectedReport.reporter_id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.reportReason}:</span>
                      <span>{selectedReport.reason}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.reportedAt}:</span>
                      <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
                    </div>
                    {selectedReport.action_taken && (
                      <div className="detail-row">
                        <span className="detail-label">{t.actionTaken}:</span>
                        <span className="action-badge">
                          {selectedReport.action_taken === 'user_banned' ? t.userBanned :
                           selectedReport.action_taken === 'message_deleted' ? t.messageDeleted :
                           t.noAction}
                        </span>
                      </div>
                    )}
                    
                    {selectedReport.status === 'pending' && (
                      <>
                        <div className="divider"></div>
                        <div className="quick-actions-section">
                          <h4>{t.quickActions}</h4>
                          <div className="quick-actions-grid">
                            <div className="action-card">
                              <label>{t.banUserAction}</label>
                              <div className="action-controls">
                                <input
                                  type="number"
                                  value={banDurationForReport}
                                  onChange={(e) => setBanDurationForReport(e.target.value)}
                                  placeholder={t.duration}
                                  min="1"
                                />
                                <button 
                                  className="btn-action ban"
                                  onClick={() => handleBanUserFromReport(selectedReport.id, parseInt(banDurationForReport))}
                                >
                                  {t.ban}
                                </button>
                              </div>
                            </div>
                            <div className="action-card">
                              <label>{t.deleteMessageAction}</label>
                              <button 
                                className="btn-action delete"
                                onClick={() => handleDeleteMessageFromReport(selectedReport.id)}
                              >
                                {t.delete}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="modal-footer">
                    {selectedReport.status === 'pending' && (
                      <>
                        <button 
                          className="btn-modal-resolve"
                          onClick={() => handleResolveReport(selectedReport.id)}
                        >
                          {t.resolveReport}
                        </button>
                        <button 
                          className="btn-modal-reject"
                          onClick={() => handleRejectReport(selectedReport.id)}
                        >
                          {t.dismissReport}
                        </button>
                      </>
                    )}
                    <button 
                      className="btn-modal-close"
                      onClick={() => setShowReportDetails(false)}
                    >
                      {t.close}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appeals' && (
          <div className="appeals-section-enhanced">
            <div className="appeals-header">
              <h3>📋 {t.appeals}</h3>
              <p className="appeals-subtitle">مراجعة والرد على طلبات الاعتراض على الحظر</p>
            </div>

            {appeals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>لا توجد طلبات اعتراض</p>
              </div>
            ) : (
              <div className="appeals-grid">
                {appeals.map(appeal => (
                  <div key={appeal.id} className={`appeal-card ${appeal.status}`}>
                    <div className="appeal-card-header">
                      <div className="appeal-user-info">
                        <span className="user-icon">👤</span>
                        <div>
                          <strong>{appeal.user_id}</strong>
                          <span className="appeal-date">
                            {new Date(appeal.created_at || Date.now()).toLocaleString('ar-SA')}
                          </span>
                        </div>
                      </div>
                      <span className={`appeal-status-badge ${appeal.status}`}>
                        {appeal.status === 'pending' ? '⏳ قيد المراجعة' :
                         appeal.status === 'accepted' ? '✅ مقبول' : '❌ مرفوض'}
                      </span>
                    </div>

                    <div className="appeal-card-body">
                      <div className="appeal-text-section">
                        <label>نص الاعتراض:</label>
                        <p className="appeal-text">{appeal.appeal_text}</p>
                      </div>

                      {appeal.admin_response && (
                        <div className="admin-response-section">
                          <label>رد المشرف:</label>
                          <p className="admin-response">{appeal.admin_response}</p>
                        </div>
                      )}
                    </div>

                    {appeal.status === 'pending' && (
                      <div className="appeal-card-footer">
                        <div className="response-input-group">
                          <textarea
                            placeholder="اكتب ردك على الطلب..."
                            id={`response-${appeal.id}`}
                            rows={2}
                            className="appeal-response-input"
                          />
                        </div>
                        <div className="appeal-actions-group">
                          <button 
                            className="btn-accept-appeal"
                            onClick={() => {
                              const input = document.getElementById(`response-${appeal.id}`) as HTMLInputElement;
                              if (!input.value.trim()) {
                                alert('الرجاء كتابة رد قبل القبول');
                                return;
                              }
                              handleRespondToAppeal(appeal.id, 'accept', input.value);
                            }}
                          >
                            <span className="btn-icon">✅</span>
                            {t.approve}
                          </button>
                          <button 
                            className="btn-reject-appeal"
                            onClick={() => {
                              const input = document.getElementById(`response-${appeal.id}`) as HTMLInputElement;
                              if (!input.value.trim()) {
                                alert('الرجاء كتابة سبب الرفض');
                                return;
                              }
                              handleRespondToAppeal(appeal.id, 'reject', input.value);
                            }}
                          >
                            <span className="btn-icon">❌</span>
                            {t.reject}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="files-section">
            <h3>{t.files}</h3>
            <div className="files-list">
              {pendingFiles.map(file => (
                <div key={file.id} className="file-item">
                  <div>
                    <strong>Filename:</strong> {file.filename}<br />
                    <strong>User:</strong> {file.user_id}
                  </div>
                  <div className="file-actions">
                    <button onClick={() => handleApproveFile(file.id)}>{t.approve}</button>
                    <button onClick={() => handleRejectFile(file.id)}>{t.reject}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="messages-section">
            <h3>{t.messages}</h3>
            <button onClick={handleClearMessages} className="clear-btn">{t.clearAll}</button>
            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className="message-item">
                  <div>
                    <strong>{msg.username}:</strong> {msg.content}
                  </div>
                  <button onClick={() => handleDeleteMessage(msg.id)}>{t.delete}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chatSettings' && (
          <div className="chat-settings-section-enhanced">
            <div className="settings-header">
              <h3>⚙️ {t.chatSettings}</h3>
              <p className="settings-subtitle">إدارة حالة الدردشة والإعدادات العامة</p>
            </div>

            <div className="settings-cards">
              <div className="setting-card status-card">
                <div className="card-header">
                  <div className="card-icon">
                    {chatOpen ? '🟢' : '🔴'}
                  </div>
                  <div className="card-title">
                    <h4>{t.chatStatus}</h4>
                    <span className={`status-badge ${chatOpen ? 'open' : 'closed'}`}>
                      {chatOpen ? t.open : t.closed}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="toggle-container">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={chatOpen}
                        onChange={(e) => setChatOpen(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-label">
                      {chatOpen ? 'الدردشة مفتوحة للجميع' : 'الدردشة مغلقة حالياً'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="setting-card message-card">
                <div className="card-header">
                  <div className="card-icon">💬</div>
                  <div className="card-title">
                    <h4>{t.closeMessageLabel}</h4>
                    <span className="card-subtitle">الرسالة التي تظهر عند إغلاق الدردشة</span>
                  </div>
                </div>
                <div className="card-body">
                  <textarea
                    className="close-message-input"
                    placeholder="مثال: الدردشة مغلقة مؤقتاً للصيانة..."
                    value={closeMessage}
                    onChange={(e) => setCloseMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-save-settings" onClick={handleUpdateChatSettings}>
                <span className="btn-icon">💾</span>
                {t.updateSettings}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'loginPageSettings' && (
          <div className="chat-settings-section-enhanced">
            <div className="settings-header">
              <h3>🔐 {t.loginPageSettings}</h3>
              <p className="settings-subtitle">{language === 'ar' ? 'إدارة إعدادات صفحة تسجيل الدخول والخلفية' : 'Manage login page and background settings'}</p>
            </div>

            <div className="settings-cards">
              <div className="setting-card status-card">
                <div className="card-header">
                  <div className="card-icon">
                    {loginSettings.allow_registration ? '✅' : '🚫'}
                  </div>
                  <div className="card-title">
                    <h4>{language === 'ar' ? 'التسجيل للمستخدمين الجدد' : 'New User Registration'}</h4>
                    <span className={`status-badge ${loginSettings.allow_registration ? 'open' : 'closed'}`}>
                      {loginSettings.allow_registration ? (language === 'ar' ? 'مفتوح' : 'Open') : (language === 'ar' ? 'مغلق' : 'Closed')}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="toggle-container">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={loginSettings.allow_registration}
                        onChange={(e) => setLoginSettings({...loginSettings, allow_registration: e.target.checked})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-label">
                      {loginSettings.allow_registration ? (language === 'ar' ? 'السماح بتسجيل مستخدمين جدد' : 'Allow new user registration') : (language === 'ar' ? 'التسجيل مغلق حالياً' : 'Registration is closed')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="setting-card message-card">
                <div className="card-header">
                  <div className="card-icon">📱</div>
                  <div className="card-title">
                    <h4>{language === 'ar' ? 'اسم التطبيق' : 'App Name'}</h4>
                    <span className="card-subtitle">{language === 'ar' ? 'الاسم الذي يظهر في صفحة الدخول' : 'Name displayed on login page'}</span>
                  </div>
                </div>
                <div className="card-body">
                  <input
                    type="text"
                    className="close-message-input"
                    placeholder={language === 'ar' ? 'مثال: Entertainment Chat' : 'Example: Entertainment Chat'}
                    value={loginSettings.app_name}
                    onChange={(e) => setLoginSettings({...loginSettings, app_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="setting-card message-card">
                <div className="card-header">
                  <div className="card-icon">🎨</div>
                  <div className="card-title">
                    <h4>{language === 'ar' ? 'نوع الخلفية' : 'Background Type'}</h4>
                  </div>
                </div>
                <div className="card-body">
                  <select
                    className="close-message-input"
                    value={loginSettings.background_type}
                    onChange={(e) => setLoginSettings({...loginSettings, background_type: e.target.value})}
                  >
                    <option value="color">{language === 'ar' ? 'لون' : 'Color'}</option>
                    <option value="image">{language === 'ar' ? 'صورة' : 'Image'}</option>
                  </select>
                </div>
              </div>

              {loginSettings.background_type === 'color' && (
                <div className="setting-card message-card">
                  <div className="card-header">
                    <div className="card-icon">🎨</div>
                    <div className="card-title">
                      <h4>{language === 'ar' ? 'لون الخلفية' : 'Background Color'}</h4>
                    </div>
                  </div>
                  <div className="card-body">
                    <input
                      type="color"
                      className="close-message-input"
                      value={loginSettings.background_color}
                      onChange={(e) => setLoginSettings({...loginSettings, background_color: e.target.value})}
                    />
                    <input
                      type="text"
                      className="close-message-input"
                      style={{marginTop: '10px'}}
                      value={loginSettings.background_color}
                      onChange={(e) => setLoginSettings({...loginSettings, background_color: e.target.value})}
                      placeholder="#1a1a2e"
                    />
                  </div>
                </div>
              )}

              {loginSettings.background_type === 'image' && (
                <>
                  <div className="setting-card message-card">
                    <div className="card-header">
                      <div className="card-icon">🖼️</div>
                      <div className="card-title">
                        <h4>{language === 'ar' ? 'رابط صورة الخلفية' : 'Background Image URL'}</h4>
                      </div>
                    </div>
                    <div className="card-body">
                      <input
                        type="text"
                        className="close-message-input"
                        placeholder="https://example.com/image.jpg"
                        value={loginSettings.background_image_url}
                        onChange={(e) => setLoginSettings({...loginSettings, background_image_url: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="setting-card message-card">
                    <div className="card-header">
                      <div className="card-icon">📐</div>
                      <div className="card-title">
                        <h4>{language === 'ar' ? 'حجم الخلفية' : 'Background Size'}</h4>
                      </div>
                    </div>
                    <div className="card-body">
                      <select
                        className="close-message-input"
                        value={loginSettings.background_size}
                        onChange={(e) => setLoginSettings({...loginSettings, background_size: e.target.value})}
                      >
                        <option value="cover">{language === 'ar' ? 'تغطية كاملة' : 'Cover'}</option>
                        <option value="contain">{language === 'ar' ? 'احتواء' : 'Contain'}</option>
                        <option value="auto">{language === 'ar' ? 'تلقائي' : 'Auto'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="setting-card message-card">
                    <div className="card-header">
                      <div className="card-icon">📍</div>
                      <div className="card-title">
                        <h4>{language === 'ar' ? 'موضع الخلفية' : 'Background Position'}</h4>
                      </div>
                    </div>
                    <div className="card-body">
                      <select
                        className="close-message-input"
                        value={loginSettings.background_position}
                        onChange={(e) => setLoginSettings({...loginSettings, background_position: e.target.value})}
                      >
                        <option value="center">{language === 'ar' ? 'وسط' : 'Center'}</option>
                        <option value="top">{language === 'ar' ? 'أعلى' : 'Top'}</option>
                        <option value="bottom">{language === 'ar' ? 'أسفل' : 'Bottom'}</option>
                        <option value="left">{language === 'ar' ? 'يسار' : 'Left'}</option>
                        <option value="right">{language === 'ar' ? 'يمين' : 'Right'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="setting-card message-card">
                    <div className="card-header">
                      <div className="card-icon">🔁</div>
                      <div className="card-title">
                        <h4>{language === 'ar' ? 'تكرار الخلفية' : 'Background Repeat'}</h4>
                      </div>
                    </div>
                    <div className="card-body">
                      <select
                        className="close-message-input"
                        value={loginSettings.background_repeat}
                        onChange={(e) => setLoginSettings({...loginSettings, background_repeat: e.target.value})}
                      >
                        <option value="no-repeat">{language === 'ar' ? 'بدون تكرار' : 'No Repeat'}</option>
                        <option value="repeat">{language === 'ar' ? 'تكرار' : 'Repeat'}</option>
                        <option value="repeat-x">{language === 'ar' ? 'تكرار أفقي' : 'Repeat X'}</option>
                        <option value="repeat-y">{language === 'ar' ? 'تكرار عمودي' : 'Repeat Y'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="setting-card message-card">
                    <div className="card-header">
                      <div className="card-icon">🌫️</div>
                      <div className="card-title">
                        <h4>{language === 'ar' ? 'طبقة شفافة' : 'Overlay'}</h4>
                      </div>
                    </div>
                    <div className="card-body">
                      <input
                        type="color"
                        className="close-message-input"
                        value={loginSettings.overlay_color || '#000000'}
                        onChange={(e) => setLoginSettings({...loginSettings, overlay_color: e.target.value})}
                      />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        style={{marginTop: '10px', width: '100%'}}
                        value={loginSettings.overlay_opacity || 0}
                        onChange={(e) => setLoginSettings({...loginSettings, overlay_opacity: parseFloat(e.target.value)})}
                      />
                      <span style={{fontSize: '12px', color: '#888'}}>
                        {language === 'ar' ? 'الشفافية' : 'Opacity'}: {loginSettings.overlay_opacity || 0}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="settings-actions">
              <button className="btn-save-settings" onClick={handleUpdateLoginSettings}>
                <span className="btn-icon">💾</span>
                {language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="announcements-section">
            <h3>{t.createAnnouncement}</h3>
            <div className="announcement-form">
              <textarea
                placeholder={t.announcementText}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={4}
              />
              <button onClick={handleCreateAnnouncement}>{t.create}</button>
            </div>

            <h3 style={{ marginTop: '30px' }}>{t.existingAnnouncements}</h3>
            <div className="announcements-list">
              {announcements.length === 0 ? (
                <p>{t.noAnnouncements}</p>
              ) : (
                announcements.map(announcement => (
                  <div key={announcement.id} className="announcement-item">
                    <div className="announcement-content">
                      <p>{announcement.content}</p>
                      <small>
                        {t.create}: {announcement.created_by} - {new Date(announcement.created_at).toLocaleString()}
                      </small>
                    </div>
                    <div className="announcement-actions">
                      <button onClick={() => handleEditAnnouncement(announcement)} className="edit-btn">
                        {t.edit}
                      </button>
                      <button onClick={() => handleDeleteAnnouncement(announcement.id)} className="delete-btn">
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {showEditModal && editingAnnouncement && (
              <div className="modal-overlay" onClick={cancelEdit}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>{t.editAnnouncement}</h3>
                  <textarea
                    value={editingAnnouncement.content}
                    onChange={(e) => setEditingAnnouncement({...editingAnnouncement, content: e.target.value})}
                    rows={4}
                  />
                  <div className="modal-actions">
                    <button onClick={handleSaveEdit} className="save-btn">{t.save}</button>
                    <button onClick={cancelEdit} className="cancel-btn">{t.cancel}</button>
                  </div>
                </div>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="modal-overlay" onClick={cancelDelete}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>{t.confirmDelete}</h3>
                  <p>{t.confirmDeleteMessage}</p>
                  <div className="modal-actions">
                    <button onClick={confirmDelete} className="delete-btn">{t.delete}</button>
                    <button onClick={cancelDelete} className="cancel-btn">{t.cancel}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'aiScanner' && (
          <AIScanner 
            language={language} 
            apiUrl={apiUrl}
            onBack={() => setActiveTab('users')}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
