import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Mail, Inbox, Clock, CheckCircle, Trash2, 
  Bell, Gift, AlertTriangle, Megaphone, MessageSquare, RefreshCw,
  User, ShoppingBag, LogOut, Eye, X
} from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { 
  subscribeCustomerMessages, 
  markMessageAsRead, 
  deleteCustomerMessage 
} from '../../services/firebase';
import type { CustomerMessage, MessageType, MessagePriority } from '../../types';

const CustomerInbox: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { customer, isLoggedIn, isLoading, logout } = useCustomerAuth();
  
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const isArabic = i18n.language === 'ar';

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/customer/auth');
    }
  }, [isLoading, isLoggedIn, navigate]);

  // Load customer messages
  useEffect(() => {
    if (!customer?.id) return;

    const unsubscribe = subscribeCustomerMessages(customer.id, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [customer?.id]);

  // Message type info
  const getMessageTypeInfo = (type: MessageType) => {
    const types: Record<MessageType, { icon: React.ReactNode; color: string; label_ar: string; label_en: string }> = {
      general: { icon: <MessageSquare size={18} />, color: 'bg-blue-100 text-blue-600', label_ar: 'عام', label_en: 'General' },
      promotion: { icon: <Gift size={18} />, color: 'bg-purple-100 text-purple-600', label_ar: 'عرض', label_en: 'Promotion' },
      order_update: { icon: <RefreshCw size={18} />, color: 'bg-green-100 text-green-600', label_ar: 'تحديث طلب', label_en: 'Order Update' },
      welcome: { icon: <Bell size={18} />, color: 'bg-teal-100 text-teal-600', label_ar: 'ترحيب', label_en: 'Welcome' },
      urgent: { icon: <AlertTriangle size={18} />, color: 'bg-red-100 text-red-600', label_ar: 'عاجل', label_en: 'Urgent' },
      announcement: { icon: <Megaphone size={18} />, color: 'bg-orange-100 text-orange-600', label_ar: 'إعلان', label_en: 'Announcement' }
    };
    return types[type] || types.general;
  };

  // Priority info
  const getPriorityInfo = (priority: MessagePriority) => {
    const priorities: Record<MessagePriority, { color: string; label_ar: string; label_en: string }> = {
      normal: { color: 'bg-gray-100 text-gray-600', label_ar: 'عادي', label_en: 'Normal' },
      high: { color: 'bg-yellow-100 text-yellow-600', label_ar: 'مهم', label_en: 'High' },
      urgent: { color: 'bg-red-100 text-red-600', label_ar: 'عاجل', label_en: 'Urgent' }
    };
    return priorities[priority] || priorities.normal;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isArabic ? 'الآن' : 'Just now';
    if (diffMins < 60) return isArabic ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isArabic ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return isArabic ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    
    return date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle open message
  const handleOpenMessage = async (message: CustomerMessage) => {
    setSelectedMessage(message);
    if (!message.isRead && customer?.id) {
      await markMessageAsRead(customer.id, message.id);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!customer?.id) return;
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?')) {
      return;
    }
    await deleteCustomerMessage(customer.id, messageId);
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Filter messages
  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return !m.isRead;
    return true;
  });

  // Count unread
  const unreadCount = messages.filter(m => !m.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {isArabic ? `مرحباً، ${customer?.robloxUsername || customer?.username}` : `Welcome, ${customer?.robloxUsername || customer?.username}`}
                </h1>
                <p className="text-emerald-200 text-sm">{customer?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ShoppingBag size={18} />
                <span>{isArabic ? 'المتجر' : 'Store'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <LogOut size={18} />
                <span>{isArabic ? 'خروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Inbox size={28} className="text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {isArabic ? 'صندوق الوارد' : 'Inbox'}
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} {isArabic ? 'جديد' : 'new'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isArabic ? 'الكل' : 'All'} ({messages.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isArabic ? 'غير مقروء' : 'Unread'} ({unreadCount})
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Messages List */}
          <div className="w-1/2">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Mail size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">
                  {filter === 'unread' 
                    ? (isArabic ? 'لا توجد رسائل غير مقروءة' : 'No Unread Messages')
                    : (isArabic ? 'صندوق الوارد فارغ' : 'Inbox is Empty')}
                </h3>
                <p className="text-gray-500">
                  {isArabic ? 'ستظهر الرسائل الجديدة هنا' : 'New messages will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map((message) => {
                  const typeInfo = getMessageTypeInfo(message.type);
                  const priorityInfo = getPriorityInfo(message.priority);
                  const isSelected = selectedMessage?.id === message.id;

                  return (
                    <div
                      key={message.id}
                      onClick={() => handleOpenMessage(message)}
                      className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-emerald-500' : ''
                      } ${!message.isRead ? 'border-l-4 border-emerald-500' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                          {typeInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-medium truncate ${!message.isRead ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                              {isArabic ? message.title_ar : message.title_en}
                            </h4>
                            <div className="flex items-center gap-2">
                              {message.priority !== 'normal' && (
                                <span className={`px-2 py-0.5 rounded text-xs ${priorityInfo.color}`}>
                                  {isArabic ? priorityInfo.label_ar : priorityInfo.label_en}
                                </span>
                              )}
                              {!message.isRead && (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                            {isArabic ? message.content_ar : message.content_en}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatDate(message.createdAt)}
                            </span>
                            <span className={`px-2 py-0.5 rounded ${typeInfo.color}`}>
                              {isArabic ? typeInfo.label_ar : typeInfo.label_en}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Detail */}
          <div className="w-1/2">
            {selectedMessage ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Message Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        {getMessageTypeInfo(selectedMessage.type).icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {isArabic ? selectedMessage.title_ar : selectedMessage.title_en}
                        </h3>
                        <p className="text-emerald-100 text-sm">
                          {isArabic ? getMessageTypeInfo(selectedMessage.type).label_ar : getMessageTypeInfo(selectedMessage.type).label_en}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-emerald-100">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(selectedMessage.createdAt)}
                    </span>
                    {selectedMessage.priority !== 'normal' && (
                      <span className={`px-2 py-0.5 rounded ${getPriorityInfo(selectedMessage.priority).color}`}>
                        {isArabic ? getPriorityInfo(selectedMessage.priority).label_ar : getPriorityInfo(selectedMessage.priority).label_en}
                      </span>
                    )}
                    {selectedMessage.isRead && (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={14} />
                        {isArabic ? 'مقروءة' : 'Read'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {isArabic ? selectedMessage.content_ar : selectedMessage.content_en}
                    </p>
                  </div>
                </div>

                {/* Message Actions */}
                <div className="border-t p-4 flex justify-end">
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                    {isArabic ? 'حذف الرسالة' : 'Delete Message'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center h-full flex items-center justify-center">
                <div>
                  <Eye size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">
                    {isArabic ? 'اختر رسالة' : 'Select a Message'}
                  </h3>
                  <p className="text-gray-500">
                    {isArabic ? 'اضغط على رسالة لقراءتها' : 'Click on a message to read it'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => navigate('/my-orders')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag size={20} className="text-purple-600" />
            <span className="font-medium text-gray-700">{isArabic ? 'طلباتي' : 'My Orders'}</span>
          </button>
          <button
            onClick={() => navigate('/my-tickets')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare size={20} className="text-blue-600" />
            <span className="font-medium text-gray-700">{isArabic ? 'تذاكر الدعم' : 'Support Tickets'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerInbox;
