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
      loadData();
    } catch (err) {
      alert('Failed to resolve report');
    }
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
          <div className="bans-section">
            <h3>{t.banUser}</h3>
            <div className="ban-form">
              <input
                type="text"
                placeholder={t.userId}
                value={banUserId}
                onChange={(e) => setBanUserId(e.target.value)}
              />
              <input
                type="number"
                placeholder={t.duration}
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
              />
              <input
                type="text"
                placeholder={t.reason}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
              <button onClick={handleBanUser}>{t.ban}</button>
            </div>

            <h3>{t.bans}</h3>
            <div className="bans-list">
              {bans.map(ban => (
                <div key={ban.user_id} className="ban-item">
                  <div>
                    <strong>{t.userId}:</strong> {ban.user_id}<br />
                    <strong>{t.reason}:</strong> {ban.reason}<br />
                    <strong>{t.remainingTime}:</strong> {ban.remaining_minutes} {t.minutes}
                  </div>
                  <button onClick={() => handleUnbanUser(ban.user_id)}>{t.unban}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'mutes' && (
          <div className="mutes-section">
            <h3>{t.muteUser}</h3>
            <div className="mute-form">
              <input
                type="text"
                placeholder={t.userId}
                value={muteUserId}
                onChange={(e) => setMuteUserId(e.target.value)}
              />
              <input
                type="number"
                placeholder={t.duration}
                value={muteDuration}
                onChange={(e) => setMuteDuration(e.target.value)}
              />
              <input
                type="text"
                placeholder={t.reason}
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
              />
              <button onClick={handleMuteUser}>{t.mute}</button>
            </div>

            <h3>{t.mutes}</h3>
            <div className="mutes-list">
              {mutes.map(mute => (
                <div key={mute.user_id} className="mute-item">
                  <div>
                    <strong>{t.userId}:</strong> {mute.user_id}<br />
                    <strong>{t.reason}:</strong> {mute.reason}<br />
                    <strong>{t.remainingTime}:</strong> {mute.remaining_minutes} {t.minutes}
                  </div>
                  <button onClick={() => handleUnmuteUser(mute.user_id)}>{t.unban}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <h3>{t.reports}</h3>
            <div className="reports-list">
              {reports.map(report => (
                <div key={report.id} className="report-item">
                  <div>
                    <strong>Category:</strong> {report.category}<br />
                    <strong>Status:</strong> {report.status}<br />
                    <strong>Reporter:</strong> {report.reporter_id}
                  </div>
                  {report.status === 'pending' && (
                    <button onClick={() => handleResolveReport(report.id)}>{t.resolve}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'appeals' && (
          <div className="appeals-section">
            <h3>{t.appeals}</h3>
            <div className="appeals-list">
              {appeals.map(appeal => (
                <div key={appeal.id} className="appeal-item">
                  <div>
                    <strong>{t.userId}:</strong> {appeal.user_id}<br />
                    <strong>Appeal:</strong> {appeal.appeal_text}<br />
                    <strong>Status:</strong> {appeal.status}
                  </div>
                  {appeal.status === 'pending' && (
                    <div className="appeal-actions">
                      <input
                        type="text"
                        placeholder={t.response}
                        id={`response-${appeal.id}`}
                      />
                      <button onClick={() => {
                        const input = document.getElementById(`response-${appeal.id}`) as HTMLInputElement;
                        handleRespondToAppeal(appeal.id, 'accept', input.value);
                      }}>{t.approve}</button>
                      <button onClick={() => {
                        const input = document.getElementById(`response-${appeal.id}`) as HTMLInputElement;
                        handleRespondToAppeal(appeal.id, 'reject', input.value);
                      }}>{t.reject}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
          <div className="chat-settings-section">
            <h3>{t.chatSettings}</h3>
            <div className="settings-form">
              <label>
                <input
                  type="checkbox"
                  checked={chatOpen}
                  onChange={(e) => setChatOpen(e.target.checked)}
                />
                {t.chatStatus}: {chatOpen ? t.open : t.closed}
              </label>
              <input
                type="text"
                placeholder={t.closeMessageLabel}
                value={closeMessage}
                onChange={(e) => setCloseMessage(e.target.value)}
              />
              <button onClick={handleUpdateChatSettings}>{t.updateSettings}</button>
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
