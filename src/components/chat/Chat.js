import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/LocalAuthContext';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import ChatMessage from './ChatMessage';
import ReportModal from './ReportModal';
import AnnouncementPopup from './AnnouncementPopup';
import EmojiPicker from './EmojiPicker';
import { FiSend, FiSmile } from 'react-icons/fi';
import { toast } from 'react-toastify';
import advertisementService from '../../services/AdvertisementService';

const Chat = ({ chatSettings }) => {
  const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [lastAdShown, setLastAdShown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const { currentUser, userRole, userStatus, userCountry } = useAuth();
  const { t } = useTranslation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const messagesData = [];
          querySnapshot.forEach((doc) => {
            messagesData.push({ ...doc.data(), id: doc.id });
          });
          setMessages(messagesData.reverse());
          setLoading(false);
          setError(null);
          scrollToBottom();
        },
        (error) => {
          console.error("Error fetching messages:", error);
          setLoading(false);
          setError(error);
          toast.error(t('chat.errorLoadingMessages') + ' (' + t('common.offlineMode') + ')');
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up messages listener:", error);
      setLoading(false);
      setError(error);
      return () => {};
    }
  }, [currentUser, t]);

  useEffect(() => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const announcementsData = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isActive) {
              announcementsData.push({ ...data, id: doc.id });
            }
          });
          setAnnouncements(announcementsData);
          
          if (announcementsData.length > 0 && !showAnnouncement && !currentAnnouncement) {
            setCurrentAnnouncement(announcementsData[0]);
            setShowAnnouncement(true);
          }
        },
        (error) => {
          console.error("Error fetching announcements:", error);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up announcements listener:", error);
      return () => {};
    }
  }, [currentUser, showAnnouncement, currentAnnouncement, t]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    try {
      const handleAdsUpdate = (ads) => {
        setAdvertisements(ads);
        
        if (!showAnnouncement && advertisementService.shouldShowAdvertisement(lastAdShown)) {
          const randomAd = advertisementService.getRandomAdvertisement();
          if (randomAd) {
            setCurrentAnnouncement(randomAd);
            setShowAnnouncement(true);
            setLastAdShown(Timestamp.now());
          }
        }
      };
      
      const unsubscribe = advertisementService.startListening(handleAdsUpdate);
      
      return () => {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from advertisements:", error);
        }
      };
    } catch (error) {
      console.error("Error setting up advertisements listener:", error);
      return () => {};
    }
  }, [currentUser, showAnnouncement, lastAdShown, t]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!formValue.trim()) return;

    if (!chatSettings?.isOpen) {
      toast.error(t('chat.chatClosed'));
      return;
    }

    if (userStatus !== 'active') {
      toast.error(t('chat.cannotSendMessage'));
      return;
    }

    try {
      const isInappropriate = await checkContentWithAI(formValue);
      if (isInappropriate) {
        toast.error(t('chat.inappropriateContent'));
        return;
      }

      let formattedMessage = formValue;
      let isFormatted = false;

      if ((userRole === 'admin' || userRole === 'moderator') && formValue.startsWith('$')) {
        formattedMessage = formValue.substring(1);
        isFormatted = true;
      }

      const retryOptions = { maxRetries: 3, delayMs: 1000 };
      
      const sendMessageOperation = async () => {
        return await addDoc(collection(db, 'messages'), {
          content: formattedMessage,
          sender: currentUser.uid,
          senderName: currentUser.username || currentUser.displayName,
          senderRole: userRole,
          senderCountry: userCountry,
          timestamp: serverTimestamp(),
          isDeleted: false,
          isFormatted: isFormatted
        });
      };
      
      for (let attempt = 0; attempt < retryOptions.maxRetries; attempt++) {
        try {
          await sendMessageOperation();
          setFormValue('');
          setShowEmojiPicker(false);
          break; // نجاح العملية
        } catch (err) {
          console.error(`محاولة إرسال الرسالة رقم ${attempt + 1} فشلت:`, err);
          if (attempt === retryOptions.maxRetries - 1) {
            throw err;
          }
          await new Promise(resolve => setTimeout(resolve, retryOptions.delayMs));
        }
      }
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      
      if (error.code === 'unavailable') {
        toast.error(t('chat.errorSendingMessage') + ' - ' + t('common.serviceUnavailable'));
      } else if (error.code === 'permission-denied') {
        toast.error(t('chat.errorSendingMessage') + ' - ' + t('common.permissionDenied'));
      } else if (error.code === 'unauthenticated') {
        toast.error(t('chat.errorSendingMessage') + ' - ' + t('common.loginRequired'));
      } else {
        toast.error(t('chat.errorSendingMessage'));
      }
    }
  };

  const checkContentWithAI = async (content) => {
    const inappropriateWords = ['badword1', 'badword2', 'badword3'];
    return inappropriateWords.some(word => content.toLowerCase().includes(word));
  };

  const handleEmojiSelect = (emoji) => {
    setFormValue(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const openReportModal = (target) => {
    setReportTarget(target);
    setReportModalOpen(true);
  };

  const closeAnnouncement = () => {
    setShowAnnouncement(false);
    
    if (currentAnnouncement && !currentAnnouncement.isAdvertisement) {
      const currentIndex = announcements.findIndex(a => a.id === currentAnnouncement.id);
      if (currentIndex < announcements.length - 1) {
        setCurrentAnnouncement(announcements[currentIndex + 1]);
        setShowAnnouncement(true);
      }
    } else {
      if (announcements.length > 0) {
        setCurrentAnnouncement(announcements[0]);
        setShowAnnouncement(true);
      }
    }
  };

  if (loading) {
    return <div className="loading-container">{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>{t('chat.errorLoadingChat')}</h3>
        <p>{t('common.tryAgainLater')}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          {t('common.refresh')}
        </button>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Chat header */}
      <div className="chat-header">
        <h2>{t('app.title')}</h2>
        <div className="user-info">
          <span className="username">
            {currentUser?.displayName || currentUser?.username}
            {userRole === 'admin' && (
              <span className="admin-badge">{t('chat.admin')}</span>
            )}
            {userRole === 'moderator' && (
              <span className="moderator-badge">{t('chat.moderator')}</span>
            )}
          </span>
          <span className="country">{userCountry}</span>
        </div>
      </div>

      {/* Chat messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">{t('chat.emptyChat')}</div>
        ) : (
          messages.map(msg => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              currentUser={currentUser}
              onReportMessage={() => openReportModal({ type: 'message', id: msg.id })}
              onReportUser={() => openReportModal({ type: 'user', id: msg.sender })}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      {chatSettings?.isOpen ? (
        <form onSubmit={sendMessage} className="chat-form">
          <div className="chat-input-container">
            <button 
              type="button" 
              className="emoji-button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <FiSmile />
            </button>
            <textarea
              className="chat-input"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('chat.typeMessage')}
            />
            <button type="submit" className="send-button" disabled={!formValue.trim()}>
              <FiSend />
            </button>
          </div>
          
          {showEmojiPicker && (
            <div className="emoji-picker-container">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
        </form>
      ) : (
        <div className="chat-closed-message">
          <p>{chatSettings?.maintenanceMode ? t('chat.chatMaintenance') : t('chat.chatClosed')}</p>
          {chatSettings?.closedReason && <p>{chatSettings.closedReason}</p>}
        </div>
      )}

      {/* Report modal */}
      {reportModalOpen && (
        <ReportModal 
          target={reportTarget} 
          onClose={() => setReportModalOpen(false)} 
        />
      )}

      {/* Announcement popup */}
      {showAnnouncement && currentAnnouncement && (
        <AnnouncementPopup 
          announcement={currentAnnouncement} 
          onClose={closeAnnouncement} 
        />
      )}
    </div>
  );
};

export default Chat;
