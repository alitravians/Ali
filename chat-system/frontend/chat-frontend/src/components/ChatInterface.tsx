import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface ChatInterfaceProps {
  user: any;
  token: string;
  language: 'ar' | 'en';
  apiUrl: string;
  onLogout: () => void;
  onGoToAdmin?: () => void;
}

const ChatInterface = ({ user, language, apiUrl, onLogout, onGoToAdmin }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [chatSettings, setChatSettings] = useState<any>({ is_open: true, close_message: '' });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [reportCategory, setReportCategory] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const texts = {
    ar: {
      chat: 'الدردشة',
      typeMessage: 'اكتب رسالتك...',
      send: 'إرسال',
      logout: 'تسجيل الخروج',
      adminPanel: 'لوحة الإدارة',
      announcements: 'الإعلانات',
      chatClosed: 'الدردشة مغلقة',
      reportMessage: 'الإبلاغ عن الرسالة',
      offensive: 'رسالة مسيئة',
      inappropriate: 'رسالة تحتوي على عبارات غير لائقة',
      religionPolitics: 'دين/سياسة',
      submit: 'إرسال',
      cancel: 'إلغاء',
      youAreMuted: 'أنت مكتوم',
      admin: 'مسؤول',
      moderator: 'مشرف',
    },
    en: {
      chat: 'Chat',
      typeMessage: 'Type your message...',
      send: 'Send',
      logout: 'Logout',
      adminPanel: 'Admin Panel',
      announcements: 'Announcements',
      chatClosed: 'Chat is Closed',
      reportMessage: 'Report Message',
      offensive: 'Offensive message',
      inappropriate: 'Message containing inappropriate phrases',
      religionPolitics: 'Religion/Politics',
      submit: 'Submit',
      cancel: 'Cancel',
      youAreMuted: 'You are muted',
      admin: 'Admin',
      moderator: 'Moderator',
    }
  };

  const t = texts[language];

  useEffect(() => {
    loadMessages();
    loadAnnouncements();
    loadChatSettings();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    const wsUrl = apiUrl.replace('http', 'ws') + '/ws';
    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'message_deleted') {
        setMessages(prev => prev.filter(m => m.id !== data.message_id));
      } else if (data.type === 'messages_cleared') {
        setMessages([]);
      } else if (data.type === 'new_announcement') {
        setAnnouncements(prev => [...prev, data.announcement]);
      } else if (data.type === 'chat_settings_updated') {
        setChatSettings(data.settings);
      } else if (data.type === 'user_muted' && data.user_id === user.user_id) {
        setIsMuted(true);
      } else if (data.type === 'user_banned' && data.user_id === user.user_id) {
        alert(`You have been banned. Reason: ${data.reason}`);
        onLogout();
      }
    };

    setWs(websocket);
  };

  const loadMessages = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/messages`);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/announcements`);
      setAnnouncements(response.data.announcements);
    } catch (err) {
      console.error('Failed to load announcements', err);
    }
  };

  const loadChatSettings = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/chat/settings`);
      setChatSettings(response.data.settings);
    } catch (err) {
      console.error('Failed to load chat settings', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${apiUrl}/api/messages`, {
        content: newMessage,
        user_id: user.user_id,
        username: user.username,
        role: user.role
      });

      setNewMessage('');
    } catch (err: any) {
      if (err.response?.data?.detail?.type === 'muted') {
        setIsMuted(true);
        alert(`${t.youAreMuted}: ${err.response.data.detail.reason}`);
      } else {
        alert('Failed to send message');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReportMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportCategory) return;

    try {
      await axios.post(`${apiUrl}/api/reports`, {
        message_id: selectedMessageId,
        reporter_id: user.user_id,
        category: reportCategory,
        reason: reportCategory
      });

      alert('Report submitted successfully');
      setShowReportModal(false);
      setReportCategory('');
    } catch (err) {
      alert('Failed to submit report');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderMessage = (msg: any) => {
    const contentClass = msg.is_admin_bold ? 'admin-bold-text' : '';

    return (
      <div key={msg.id} className="message" onClick={() => handleReportMessage(msg.id)}>
        <div className="message-header">
          <span className="username">
            {msg.username}
            {msg.role === 'admin' && <span className="badge admin-badge">{t.admin}</span>}
            {msg.role === 'moderator' && <span className="badge mod-badge">{t.moderator}</span>}
            <span className="user-id">({msg.user_id})</span>
          </span>
          <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className={`message-content ${contentClass}`}>{msg.content}</div>
      </div>
    );
  };

  if (!chatSettings.is_open && user.role !== 'admin') {
    return (
      <div className="chat-closed">
        <h2>{t.chatClosed}</h2>
        <p>{chatSettings.close_message}</p>
        <button onClick={onLogout} className="logout-btn">{t.logout}</button>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>{t.chat}</h2>
        <div className="header-actions">
          {onGoToAdmin && (
            <button onClick={onGoToAdmin} className="admin-btn">{t.adminPanel}</button>
          )}
          <button onClick={onLogout} className="logout-btn">{t.logout}</button>
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="announcements-section">
          <h3>{t.announcements}</h3>
          {announcements.map(ann => (
            <div key={ann.id} className="announcement">
              {ann.content}
            </div>
          ))}
        </div>
      )}

      <div className="messages-container">
        {messages.map(msg => renderMessage(msg))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        {isMuted ? (
          <div className="muted-notice">{t.youAreMuted}</div>
        ) : (
          <>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.typeMessage}
              className="message-input"
            />
            <button onClick={sendMessage} className="send-btn">{t.send}</button>
          </>
        )}
      </div>

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t.reportMessage}</h3>
            <div className="report-categories">
              <button
                className={`category-btn offensive ${reportCategory === 'offensive' ? 'selected' : ''}`}
                onClick={() => setReportCategory('offensive')}
              >
                {t.offensive}
              </button>
              <button
                className={`category-btn inappropriate ${reportCategory === 'inappropriate' ? 'selected' : ''}`}
                onClick={() => setReportCategory('inappropriate')}
              >
                {t.inappropriate}
              </button>
              <button
                className={`category-btn religion ${reportCategory === 'religion' ? 'selected' : ''}`}
                onClick={() => setReportCategory('religion')}
              >
                {t.religionPolitics}
              </button>
            </div>
            <div className="modal-actions">
              <button onClick={submitReport} className="submit-btn">{t.submit}</button>
              <button onClick={() => setShowReportModal(false)} className="cancel-btn">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
