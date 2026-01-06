import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, Search, Send, Users, User, Mail, MessageSquare, Bell, 
  Clock, CheckCircle, AlertTriangle, Megaphone, Gift,
  FileText, Trash2, Eye, Plus, Check,
  Calendar, RefreshCw
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';
import {
  addAdminMessage,
  updateAdminMessage,
  deleteAdminMessage,
  sendMessageToAllCustomers,
  sendMessageToSelectedCustomers,
  sendMessageToCustomer,
  getMessageTemplates,
  addMessageTemplate,
  deleteMessageTemplate
} from '../../services/firebase';
import type { AdminMessage, MessageType, MessagePriority, Customer, MessageTemplate } from '../../types';

interface MessageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessageManagementModal: React.FC<MessageManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  // State
  const [activeTab, setActiveTab] = useState<'compose' | 'sent' | 'templates'>('compose');
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Compose form state
  const [targetType, setTargetType] = useState<'all' | 'single' | 'selected'>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [singleCustomerId, setSingleCustomerId] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('general');
  const [priority, setPriority] = useState<MessagePriority>('normal');
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  
  // Template form state
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateNameEn, setTemplateNameEn] = useState('');
  const [templateNameAr, setTemplateNameAr] = useState('');
  
  // Selected message for viewing
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  // Load data
  useEffect(() => {
    const messagesRef = ref(database, 'adminMessages');
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([id, msg]) => ({
          id,
          ...(msg as Omit<AdminMessage, 'id'>)
        }));
        messagesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    const customersRef = ref(database, 'customers');
    const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const customersList = Object.entries(data).map(([id, customer]) => ({
          id,
          ...(customer as Omit<Customer, 'id'>)
        }));
        setCustomers(customersList.filter(c => !c.isBanned));
      } else {
        setCustomers([]);
      }
    });

    // Load templates
    getMessageTemplates().then(setTemplates);

    return () => {
      unsubscribeMessages();
      unsubscribeCustomers();
    };
  }, []);

  // Message type options
  const messageTypes: { id: MessageType; icon: React.ReactNode; label_ar: string; label_en: string; color: string }[] = [
    { id: 'general', icon: <MessageSquare size={16} />, label_ar: 'عام', label_en: 'General', color: 'bg-blue-100 text-blue-700' },
    { id: 'promotion', icon: <Gift size={16} />, label_ar: 'عرض ترويجي', label_en: 'Promotion', color: 'bg-purple-100 text-purple-700' },
    { id: 'order_update', icon: <RefreshCw size={16} />, label_ar: 'تحديث طلب', label_en: 'Order Update', color: 'bg-green-100 text-green-700' },
    { id: 'welcome', icon: <Bell size={16} />, label_ar: 'ترحيب', label_en: 'Welcome', color: 'bg-teal-100 text-teal-700' },
    { id: 'urgent', icon: <AlertTriangle size={16} />, label_ar: 'عاجل', label_en: 'Urgent', color: 'bg-red-100 text-red-700' },
    { id: 'announcement', icon: <Megaphone size={16} />, label_ar: 'إعلان', label_en: 'Announcement', color: 'bg-orange-100 text-orange-700' }
  ];

  // Priority options
  const priorityOptions: { id: MessagePriority; label_ar: string; label_en: string; color: string }[] = [
    { id: 'normal', label_ar: 'عادي', label_en: 'Normal', color: 'bg-gray-100 text-gray-700' },
    { id: 'high', label_ar: 'مهم', label_en: 'High', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'urgent', label_ar: 'عاجل', label_en: 'Urgent', color: 'bg-red-100 text-red-700' }
  ];

  // Filter customers by search
  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.robloxUsername?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  });

  // Get message type info
  const getMessageTypeInfo = (type: MessageType) => {
    return messageTypes.find(t => t.id === type) || messageTypes[0];
  };

  // Get priority info
  const getPriorityInfo = (p: MessagePriority) => {
    return priorityOptions.find(opt => opt.id === p) || priorityOptions[0];
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!titleAr || !contentAr) {
      alert(isArabic ? 'يرجى ملء العنوان والمحتوى بالعربية على الأقل' : 'Please fill in Arabic title and content at least');
      return;
    }

    if (targetType === 'single' && !singleCustomerId) {
      alert(isArabic ? 'يرجى اختيار عميل' : 'Please select a customer');
      return;
    }

    if (targetType === 'selected' && selectedCustomers.length === 0) {
      alert(isArabic ? 'يرجى اختيار عميل واحد على الأقل' : 'Please select at least one customer');
      return;
    }

    setSending(true);
    try {
      // Create admin message
      const adminMessage: Omit<AdminMessage, 'id'> = {
        title_en: titleEn || titleAr,
        title_ar: titleAr,
        content_en: contentEn || contentAr,
        content_ar: contentAr,
        type: messageType,
        priority,
        status: 'sent',
        targetType,
        targetCustomerIds: targetType === 'single' ? [singleCustomerId] : targetType === 'selected' ? selectedCustomers : undefined,
        sentAt: new Date().toISOString(),
        sentBy: 'admin',
        totalRecipients: 0,
        readCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const messageId = await addAdminMessage(adminMessage);
      const messageWithId = { ...adminMessage, id: messageId };

      // Send to recipients
      let sentCount = 0;
      if (targetType === 'all') {
        sentCount = await sendMessageToAllCustomers(messageWithId);
      } else if (targetType === 'single') {
        await sendMessageToCustomer(messageWithId, singleCustomerId);
        sentCount = 1;
      } else if (targetType === 'selected') {
        sentCount = await sendMessageToSelectedCustomers(messageWithId, selectedCustomers);
      }

      // Update message with recipient count
      await updateAdminMessage(messageId, { totalRecipients: sentCount });

      // Reset form
      setTitleEn('');
      setTitleAr('');
      setContentEn('');
      setContentAr('');
      setSelectedCustomers([]);
      setSingleCustomerId('');
      setTargetType('all');
      setMessageType('general');
      setPriority('normal');

      alert(isArabic ? `تم إرسال الرسالة إلى ${sentCount} عميل بنجاح!` : `Message sent to ${sentCount} customers successfully!`);
      setActiveTab('sent');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(isArabic ? 'حدث خطأ أثناء إرسال الرسالة' : 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  // Handle save template
  const handleSaveTemplate = async () => {
    if (!templateNameAr || !titleAr || !contentAr) {
      alert(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      await addMessageTemplate({
        name_en: templateNameEn || templateNameAr,
        name_ar: templateNameAr,
        title_en: titleEn || titleAr,
        title_ar: titleAr,
        content_en: contentEn || contentAr,
        content_ar: contentAr,
        type: messageType,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      setShowTemplateForm(false);
      setTemplateNameEn('');
      setTemplateNameAr('');
      
      // Refresh templates
      const updatedTemplates = await getMessageTemplates();
      setTemplates(updatedTemplates);

      alert(isArabic ? 'تم حفظ القالب بنجاح!' : 'Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  // Handle use template
  const handleUseTemplate = (template: MessageTemplate) => {
    setTitleEn(template.title_en);
    setTitleAr(template.title_ar);
    setContentEn(template.content_en);
    setContentAr(template.content_ar);
    setMessageType(template.type);
    setActiveTab('compose');
  };

  // Handle delete template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا القالب؟' : 'Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await deleteMessageTemplate(templateId);
      const updatedTemplates = await getMessageTemplates();
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await deleteAdminMessage(messageId);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Toggle customer selection
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Mail size={24} />
            {isArabic ? 'إدارة الرسائل' : 'Message Management'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { id: 'compose', icon: <Send size={18} />, label_ar: 'إرسال رسالة', label_en: 'Compose' },
            { id: 'sent', icon: <CheckCircle size={18} />, label_ar: 'الرسائل المرسلة', label_en: 'Sent Messages' },
            { id: 'templates', icon: <FileText size={18} />, label_ar: 'القوالب', label_en: 'Templates' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {isArabic ? tab.label_ar : tab.label_en}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Compose Tab */}
          {activeTab === 'compose' && (
            <div className="space-y-6">
              {/* Target Selection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Users size={18} />
                  {isArabic ? 'المستلمون' : 'Recipients'}
                </h3>
                <div className="flex gap-3 mb-4">
                  {[
                    { id: 'all', icon: <Users size={16} />, label_ar: 'جميع العملاء', label_en: 'All Customers' },
                    { id: 'single', icon: <User size={16} />, label_ar: 'عميل واحد', label_en: 'Single Customer' },
                    { id: 'selected', icon: <Check size={16} />, label_ar: 'عملاء محددين', label_en: 'Selected Customers' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setTargetType(option.id as typeof targetType)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        targetType === option.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {option.icon}
                      {isArabic ? option.label_ar : option.label_en}
                    </button>
                  ))}
                </div>

                {/* Single Customer Selector */}
                {targetType === 'single' && (
                  <div className="relative">
                    <select
                      value={singleCustomerId}
                      onChange={(e) => setSingleCustomerId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">{isArabic ? 'اختر عميل...' : 'Select customer...'}</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.robloxUsername} - {customer.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Multiple Customer Selector */}
                {targetType === 'selected' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600">
                        {isArabic ? `تم اختيار ${selectedCustomers.length} عميل` : `${selectedCustomers.length} customers selected`}
                      </span>
                      <button
                        onClick={() => setShowCustomerSelector(!showCustomerSelector)}
                        className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                      >
                        {showCustomerSelector 
                          ? (isArabic ? 'إخفاء' : 'Hide') 
                          : (isArabic ? 'اختيار العملاء' : 'Select Customers')}
                      </button>
                    </div>
                    
                    {showCustomerSelector && (
                      <div className="border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                        <div className="sticky top-0 bg-white p-2 border-b">
                          <div className="relative">
                            <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isArabic ? 'right-3' : 'left-3'}`} />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={isArabic ? 'بحث...' : 'Search...'}
                              className={`w-full py-1.5 border border-gray-200 rounded text-sm ${isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                            />
                          </div>
                        </div>
                        {filteredCustomers.map(customer => (
                          <label
                            key={customer.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(customer.id)}
                              onChange={() => toggleCustomerSelection(customer.id)}
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span className="text-sm">{customer.robloxUsername}</span>
                            <span className="text-xs text-gray-500">{customer.email}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {targetType === 'all' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-sm text-emerald-700">
                      {isArabic 
                        ? `سيتم إرسال الرسالة إلى ${customers.length} عميل نشط`
                        : `Message will be sent to ${customers.length} active customers`}
                    </p>
                  </div>
                )}
              </div>

              {/* Message Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isArabic ? 'نوع الرسالة' : 'Message Type'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {messageTypes.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setMessageType(type.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          messageType === type.id
                            ? type.color + ' ring-2 ring-offset-1 ring-current'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {type.icon}
                        {isArabic ? type.label_ar : type.label_en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isArabic ? 'الأولوية' : 'Priority'}
                  </label>
                  <div className="flex gap-2">
                    {priorityOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setPriority(opt.id)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          priority === opt.id
                            ? opt.color + ' ring-2 ring-offset-1 ring-current'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isArabic ? opt.label_ar : opt.label_en}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="grid grid-cols-2 gap-4">
                {/* Arabic Content */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">{isArabic ? 'المحتوى بالعربية' : 'Arabic Content'} *</h4>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder={isArabic ? 'عنوان الرسالة...' : 'Message title...'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    dir="rtl"
                  />
                  <textarea
                    value={contentAr}
                    onChange={(e) => setContentAr(e.target.value)}
                    placeholder={isArabic ? 'محتوى الرسالة...' : 'Message content...'}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                    dir="rtl"
                  />
                </div>

                {/* English Content */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">{isArabic ? 'المحتوى بالإنجليزية' : 'English Content'}</h4>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="Message title..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                  <textarea
                    value={contentEn}
                    onChange={(e) => setContentEn(e.target.value)}
                    placeholder="Message content..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => setShowTemplateForm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FileText size={18} />
                  {isArabic ? 'حفظ كقالب' : 'Save as Template'}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !titleAr || !contentAr}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {sending 
                    ? (isArabic ? 'جاري الإرسال...' : 'Sending...') 
                    : (isArabic ? 'إرسال الرسالة' : 'Send Message')}
                </button>
              </div>
            </div>
          )}

          {/* Sent Messages Tab */}
          {activeTab === 'sent' && (
            <div className="flex gap-6">
              {/* Messages List */}
              <div className="w-1/2 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800">
                    {isArabic ? 'الرسائل المرسلة' : 'Sent Messages'} ({messages.length})
                  </h3>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Mail size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{isArabic ? 'لا توجد رسائل مرسلة' : 'No sent messages'}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {messages.map(message => {
                      const typeInfo = getMessageTypeInfo(message.type);
                      const priorityInfo = getPriorityInfo(message.priority);
                      return (
                        <div
                          key={message.id}
                          onClick={() => setSelectedMessage(message)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedMessage?.id === message.id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded ${typeInfo.color}`}>
                                {typeInfo.icon}
                              </span>
                              <h4 className="font-medium text-gray-800 line-clamp-1">
                                {isArabic ? message.title_ar : message.title_en}
                              </h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs ${priorityInfo.color}`}>
                              {isArabic ? priorityInfo.label_ar : priorityInfo.label_en}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {isArabic ? message.content_ar : message.content_en}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {message.totalRecipients} {isArabic ? 'مستلم' : 'recipients'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(message.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message Details */}
              <div className="w-1/2 bg-gray-50 rounded-lg p-6">
                {selectedMessage ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`p-2 rounded-lg ${getMessageTypeInfo(selectedMessage.type).color}`}>
                          {getMessageTypeInfo(selectedMessage.type).icon}
                        </span>
                        <div>
                          <h3 className="font-bold text-gray-800">
                            {isArabic ? selectedMessage.title_ar : selectedMessage.title_en}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {isArabic ? getMessageTypeInfo(selectedMessage.type).label_ar : getMessageTypeInfo(selectedMessage.type).label_en}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="bg-white rounded-lg p-4 mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {isArabic ? selectedMessage.content_ar : selectedMessage.content_en}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 mb-1">{isArabic ? 'المستلمون' : 'Recipients'}</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <Users size={16} />
                          {selectedMessage.totalRecipients}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 mb-1">{isArabic ? 'نوع الإرسال' : 'Target Type'}</p>
                        <p className="font-medium text-gray-800">
                          {selectedMessage.targetType === 'all' 
                            ? (isArabic ? 'جميع العملاء' : 'All Customers')
                            : selectedMessage.targetType === 'single'
                            ? (isArabic ? 'عميل واحد' : 'Single Customer')
                            : (isArabic ? 'عملاء محددين' : 'Selected Customers')}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 mb-1">{isArabic ? 'الأولوية' : 'Priority'}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${getPriorityInfo(selectedMessage.priority).color}`}>
                          {isArabic ? getPriorityInfo(selectedMessage.priority).label_ar : getPriorityInfo(selectedMessage.priority).label_en}
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 mb-1">{isArabic ? 'تاريخ الإرسال' : 'Sent Date'}</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <Calendar size={16} />
                          {new Date(selectedMessage.createdAt).toLocaleString(isArabic ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Eye size={48} className="mx-auto mb-4 opacity-50" />
                      <p>{isArabic ? 'اختر رسالة لعرض التفاصيل' : 'Select a message to view details'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-gray-800">
                  {isArabic ? 'قوالب الرسائل' : 'Message Templates'} ({templates.length})
                </h3>
                <button
                  onClick={() => {
                    setTitleAr('');
                    setTitleEn('');
                    setContentAr('');
                    setContentEn('');
                    setActiveTab('compose');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={18} />
                  {isArabic ? 'إنشاء قالب جديد' : 'Create New Template'}
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{isArabic ? 'لا توجد قوالب' : 'No templates'}</p>
                  <p className="text-sm mt-2">
                    {isArabic ? 'أنشئ رسالة واحفظها كقالب لاستخدامها لاحقاً' : 'Create a message and save it as a template for later use'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {templates.map(template => {
                    const typeInfo = getMessageTypeInfo(template.type);
                    return (
                      <div
                        key={template.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded ${typeInfo.color}`}>
                              {typeInfo.icon}
                            </span>
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {isArabic ? template.name_ar : template.name_en}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {isArabic ? typeInfo.label_ar : typeInfo.label_en}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {isArabic ? template.title_ar : template.title_en}
                        </p>
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          {isArabic ? 'استخدام القالب' : 'Use Template'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Template Modal */}
        {showTemplateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <div className={`bg-white rounded-lg p-6 w-full max-w-md ${isArabic ? 'rtl' : 'ltr'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {isArabic ? 'حفظ كقالب' : 'Save as Template'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'اسم القالب (عربي)' : 'Template Name (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    value={templateNameAr}
                    onChange={(e) => setTemplateNameAr(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'اسم القالب (إنجليزي)' : 'Template Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={templateNameEn}
                    onChange={(e) => setTemplateNameEn(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTemplateForm(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {isArabic ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageManagementModal;
