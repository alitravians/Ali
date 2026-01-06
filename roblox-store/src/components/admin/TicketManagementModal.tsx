import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Ticket, 
  Search, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Send,
  User,
  RefreshCw,
  Eye,
  Power,
  PowerOff,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Save,
  Copy,
  Filter
} from 'lucide-react';
import { ref, onValue, update, set, remove } from 'firebase/database';
import { database } from '../../firebase/config';
import { sendNotification, findCustomerIdByEmail } from '../../services/firebase';

interface TicketMessage {
  id: string;
  senderType: 'customer' | 'staff';
  senderId: string;
  senderName: string;
  message: string;
  attachments?: any[];
  createdAt: string;
  isInternal?: boolean;
}

interface Ticket {
  id: string;
  ticketCode: string;
  customerId: string;
  customerEmail: string;
  customerUsername: string;
  robloxUsername: string;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: string;
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: string;
  resolutionSummary?: string;
  customerCanReply: boolean;
}

interface TicketManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TicketSystemSettings {
  isEnabled: boolean;
  closureMessage_ar: string;
  closureMessage_en: string;
  closedAt?: string;
  closedBy?: string;
  scheduledClosureAt?: string;
  scheduledBy?: string;
  pendingTicketsCount?: number;
}

interface TicketStatus {
  id: string;
  key: string;
  label_ar: string;
  label_en: string;
  color: string;
  order: number;
}

interface TicketCategory {
  id: string;
  key: string;
  label_ar: string;
  label_en: string;
  color: string;
  order: number;
}

const defaultStatuses: TicketStatus[] = [
  { id: '1', key: 'open', label_ar: 'جديدة', label_en: 'Open', color: 'blue', order: 1 },
  { id: '2', key: 'under_review', label_ar: 'تحت المراجعة', label_en: 'Under Review', color: 'yellow', order: 2 },
  { id: '3', key: 'awaiting_customer', label_ar: 'بانتظار العميل', label_en: 'Awaiting Customer', color: 'orange', order: 3 },
  { id: '4', key: 'resolved', label_ar: 'تم الحل', label_en: 'Resolved', color: 'green', order: 4 },
  { id: '5', key: 'closed', label_ar: 'مغلقة', label_en: 'Closed', color: 'gray', order: 5 }
];

const defaultCategories: TicketCategory[] = [
  { id: '1', key: 'problem', label_ar: 'مشكلة', label_en: 'Problem', color: 'red', order: 1 },
  { id: '2', key: 'report', label_ar: 'بلاغ', label_en: 'Report', color: 'orange', order: 2 },
  { id: '3', key: 'technical', label_ar: 'خلل فني', label_en: 'Technical', color: 'purple', order: 3 },
  { id: '4', key: 'fraud', label_ar: 'عملية نصب', label_en: 'Fraud', color: 'red', order: 4 }
];

const colorOptions = [
  { value: 'blue', label: 'أزرق', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { value: 'green', label: 'أخضر', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { value: 'yellow', label: 'أصفر', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  { value: 'orange', label: 'برتقالي', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { value: 'red', label: 'أحمر', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { value: 'purple', label: 'بنفسجي', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { value: 'gray', label: 'رمادي', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  { value: 'pink', label: 'وردي', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { value: 'indigo', label: 'نيلي', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  { value: 'teal', label: 'أخضر مزرق', bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' }
];

const TicketManagementModal: React.FC<TicketManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  // Ticket System Settings
  const [ticketSystemSettings, setTicketSystemSettings] = useState<TicketSystemSettings>({
    isEnabled: true,
    closureMessage_ar: 'نظام التذاكر مغلق حالياً. يرجى المحاولة لاحقاً.',
    closureMessage_en: 'The ticket system is currently closed. Please try again later.'
  });
  const [showSystemSettingsDialog, setShowSystemSettingsDialog] = useState(false);
  const [tempClosureMessage, setTempClosureMessage] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [useScheduledClosure, setUseScheduledClosure] = useState(false);
  const [scheduledClosureDate, setScheduledClosureDate] = useState('');
  const [scheduledClosureTime, setScheduledClosureTime] = useState('');

  // Status and Category Management
  const [statuses, setStatuses] = useState<TicketStatus[]>(defaultStatuses);
  const [categories, setCategories] = useState<TicketCategory[]>(defaultCategories);
  const [showStatusCategoryManager, setShowStatusCategoryManager] = useState(false);
  const [activeTab, setActiveTab] = useState<'statuses' | 'categories'>('statuses');
  const [editingStatus, setEditingStatus] = useState<TicketStatus | null>(null);
  const [editingCategory, setEditingCategory] = useState<TicketCategory | null>(null);
  const [newStatus, setNewStatus] = useState({ key: '', label_ar: '', label_en: '', color: 'blue' });
  const [newCategory, setNewCategory] = useState({ key: '', label_ar: '', label_en: '', color: 'blue' });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    underReview: 0,
    closed: 0
  });

  // Load ticket system settings
  useEffect(() => {
    if (!isOpen) return;

    const settingsRef = ref(database, 'settings/ticketSystem');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setTicketSystemSettings(snapshot.val());
      }
    });

    // Load statuses
    const statusesRef = ref(database, 'settings/ticketStatuses');
    const unsubscribeStatuses = onValue(statusesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const statusList = Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s }));
        statusList.sort((a, b) => a.order - b.order);
        setStatuses(statusList);
      } else {
        defaultStatuses.forEach(s => {
          set(ref(database, `settings/ticketStatuses/${s.id}`), s);
        });
      }
    });

    // Load categories
    const categoriesRef = ref(database, 'settings/ticketCategories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const categoryList = Object.entries(data).map(([id, c]: [string, any]) => ({ id, ...c }));
        categoryList.sort((a, b) => a.order - b.order);
        setCategories(categoryList);
      } else {
        defaultCategories.forEach(c => {
          set(ref(database, `settings/ticketCategories/${c.id}`), c);
        });
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeStatuses();
      unsubscribeCategories();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const ticketsRef = ref(database, 'tickets');
    const unsubscribe = onValue(ticketsRef, (snapshot) => {
      if (snapshot.exists()) {
        const ticketsData = snapshot.val();
        const ticketsList = Object.entries(ticketsData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          messages: data.messages ? Object.values(data.messages) : []
        }));
        ticketsList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setTickets(ticketsList);

        setStats({
          total: ticketsList.length,
          open: ticketsList.filter(t => t.status === 'open').length,
          underReview: ticketsList.filter(t => t.status === 'under_review' || t.status === 'awaiting_customer').length,
          closed: ticketsList.filter(t => t.status === 'closed' || t.status === 'resolved').length
        });
      } else {
        setTickets([]);
        setStats({ total: 0, open: 0, underReview: 0, closed: 0 });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const getStatusInfo = (statusKey: string) => {
    const status = statuses.find(s => s.key === statusKey);
    if (status) {
      const colorInfo = colorOptions.find(c => c.value === status.color) || colorOptions[0];
      return {
        label: isArabic ? status.label_ar : status.label_en,
        color: status.color,
        bg: colorInfo.bg,
        text: colorInfo.text
      };
    }
    return { label: statusKey, color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  const getCategoryInfo = (categoryKey: string) => {
    const category = categories.find(c => c.key === categoryKey);
    if (category) {
      const colorInfo = colorOptions.find(c => c.value === category.color) || colorOptions[0];
      return {
        label: isArabic ? category.label_ar : category.label_en,
        color: category.color,
        bg: colorInfo.bg,
        text: colorInfo.text
      };
    }
    return { label: categoryKey, color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'low': return { label: isArabic ? 'منخفضة' : 'Low', bg: 'bg-gray-100', text: 'text-gray-700' };
      case 'normal': return { label: isArabic ? 'عادية' : 'Normal', bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'high': return { label: isArabic ? 'عالية' : 'High', bg: 'bg-orange-100', text: 'text-orange-700' };
      case 'urgent': return { label: isArabic ? 'عاجلة' : 'Urgent', bg: 'bg-red-100', text: 'text-red-700' };
      default: return { label: priority, bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.ticketCode.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.customerUsername.toLowerCase().includes(query) ||
        ticket.customerEmail.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const now = new Date().toISOString();
      const messageId = 'msg_' + Date.now();
    
      await update(ref(database), {
        [`tickets/${selectedTicket.id}/messages/${messageId}`]: {
          id: messageId,
          senderType: 'staff',
          senderId: 'admin',
          senderName: isArabic ? 'الإدارة' : 'Support',
          message: replyMessage.trim(),
          createdAt: now,
          isInternal: isInternalNote
        },
        [`tickets/${selectedTicket.id}/updatedAt`]: now,
        [`tickets/${selectedTicket.id}/lastStaffMessageAt`]: now,
        [`tickets/${selectedTicket.id}/status`]: isInternalNote ? selectedTicket.status : 'awaiting_customer'
      });

      if (!isInternalNote) {
        let customerId = selectedTicket.customerId;
      
        if (!customerId && selectedTicket.customerEmail) {
          customerId = await findCustomerIdByEmail(selectedTicket.customerEmail) || '';
        }
      
        if (customerId) {
          await sendNotification(
            customerId,
            'ticket_reply',
            'رد جديد على تذكرتك',
            'New Reply on Your Ticket',
            `تم الرد على تذكرتك #${selectedTicket.ticketCode}. يرجى مراجعة التذكرة للاطلاع على الرد.`,
            `Your ticket #${selectedTicket.ticketCode} has received a new reply. Please check your ticket for details.`,
            '/my-tickets'
          );
        }
      }

      setReplyMessage('');
      setIsInternalNote(false);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
    setSendingReply(false);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const now = new Date().toISOString();
      await update(ref(database, `tickets/${ticketId}`), {
        status: newStatus,
        updatedAt: now
      });
    
      if (selectedTicket) {
        let customerId = selectedTicket.customerId;
      
        if (!customerId && selectedTicket.customerEmail) {
          customerId = await findCustomerIdByEmail(selectedTicket.customerEmail) || '';
        }
      
        if (customerId) {
          const statusInfo = getStatusInfo(newStatus);
          await sendNotification(
            customerId,
            'ticket_reply',
            'تحديث حالة التذكرة',
            'Ticket Status Update',
            `تم تحديث حالة تذكرتك #${selectedTicket.ticketCode} إلى: ${statusInfo.label}`,
            `Your ticket #${selectedTicket.ticketCode} status has been updated to: ${statusInfo.label}`,
            '/my-tickets'
          );
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || !resolutionSummary.trim()) return;

    try {
      const now = new Date().toISOString();
      await update(ref(database, `tickets/${selectedTicket.id}`), {
        status: 'closed',
        closedAt: now,
        closedBy: 'admin',
        resolutionSummary: resolutionSummary.trim(),
        customerCanReply: false,
        updatedAt: now
      });

      let customerId = selectedTicket.customerId;
    
      if (!customerId && selectedTicket.customerEmail) {
        customerId = await findCustomerIdByEmail(selectedTicket.customerEmail) || '';
      }
    
      if (customerId) {
        await sendNotification(
          customerId,
          'ticket_reply',
          'تم إغلاق التذكرة',
          'Ticket Closed',
          `تم إغلاق تذكرتك #${selectedTicket.ticketCode}. شكراً لتواصلك معنا.`,
          `Your ticket #${selectedTicket.ticketCode} has been closed. Thank you for contacting us.`,
          '/my-tickets'
        );
      }

      setShowCloseDialog(false);
      setResolutionSummary('');
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  const handleToggleTicketSystem = () => {
    if (ticketSystemSettings.isEnabled) {
      setTempClosureMessage(isArabic ? ticketSystemSettings.closureMessage_ar : ticketSystemSettings.closureMessage_en);
      setShowSystemSettingsDialog(true);
    } else {
      handleEnableTicketSystem();
    }
  };

  const handleEnableTicketSystem = async () => {
    setSavingSettings(true);
    try {
      await set(ref(database, 'settings/ticketSystem'), {
        ...ticketSystemSettings,
        isEnabled: true,
        closedAt: null,
        closedBy: null
      });
    } catch (error) {
      console.error('Error enabling ticket system:', error);
    }
    setSavingSettings(false);
  };

  const handleDisableTicketSystem = async () => {
    if (!tempClosureMessage.trim()) return;

    if (useScheduledClosure && (!scheduledClosureDate || !scheduledClosureTime)) {
      return;
    }

    setSavingSettings(true);
    try {
      const now = new Date().toISOString();
      
      if (useScheduledClosure && scheduledClosureDate && scheduledClosureTime) {
        const scheduledDateTime = new Date(`${scheduledClosureDate}T${scheduledClosureTime}`).toISOString();
        await set(ref(database, 'settings/ticketSystem'), {
          isEnabled: true,
          closureMessage_ar: isArabic ? tempClosureMessage.trim() : ticketSystemSettings.closureMessage_ar,
          closureMessage_en: !isArabic ? tempClosureMessage.trim() : ticketSystemSettings.closureMessage_en,
          scheduledClosureAt: scheduledDateTime,
          scheduledBy: 'admin',
          pendingTicketsCount: stats.open
        });
      } else {
        await set(ref(database, 'settings/ticketSystem'), {
          isEnabled: false,
          closureMessage_ar: isArabic ? tempClosureMessage.trim() : ticketSystemSettings.closureMessage_ar,
          closureMessage_en: !isArabic ? tempClosureMessage.trim() : ticketSystemSettings.closureMessage_en,
          closedAt: now,
          closedBy: 'admin',
          pendingTicketsCount: stats.open
        });
      }
      
      setShowSystemSettingsDialog(false);
      setTempClosureMessage('');
      setUseScheduledClosure(false);
      setScheduledClosureDate('');
      setScheduledClosureTime('');
    } catch (error) {
      console.error('Error disabling ticket system:', error);
    }
    setSavingSettings(false);
  };

  // Status Management Functions
  const handleAddStatus = async () => {
    if (!newStatus.key || !newStatus.label_ar || !newStatus.label_en) return;
    
    const id = 'status_' + Date.now();
    const statusData = {
      ...newStatus,
      id,
      order: statuses.length + 1
    };
    
    await set(ref(database, `settings/ticketStatuses/${id}`), statusData);
    setNewStatus({ key: '', label_ar: '', label_en: '', color: 'blue' });
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    await set(ref(database, `settings/ticketStatuses/${status.id}`), status);
    setEditingStatus(null);
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (statuses.length <= 1) return;
    await remove(ref(database, `settings/ticketStatuses/${statusId}`));
  };

  // Category Management Functions
  const handleAddCategory = async () => {
    if (!newCategory.key || !newCategory.label_ar || !newCategory.label_en) return;
    
    const id = 'category_' + Date.now();
    const categoryData = {
      ...newCategory,
      id,
      order: categories.length + 1
    };
    
    await set(ref(database, `settings/ticketCategories/${id}`), categoryData);
    setNewCategory({ key: '', label_ar: '', label_en: '', color: 'blue' });
  };

  const handleUpdateCategory = async (category: TicketCategory) => {
    await set(ref(database, `settings/ticketCategories/${category.id}`), category);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (categories.length <= 1) return;
    await remove(ref(database, `settings/ticketCategories/${categoryId}`));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isArabic ? 'الآن' : 'Just now';
    if (diffMins < 60) return isArabic ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isArabic ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    return isArabic ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[98vw] h-[95vh] max-w-[1600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Ticket size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{isArabic ? 'إدارة التذاكر' : 'Ticket Management'}</h2>
                <p className="text-purple-200 text-sm">
                  {isArabic ? 'إدارة ومتابعة تذاكر الدعم الفني' : 'Manage and track support tickets'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleTicketSystem}
                disabled={savingSettings}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  ticketSystemSettings.isEnabled
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {savingSettings ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : ticketSystemSettings.isEnabled ? (
                  <Power size={18} />
                ) : (
                  <PowerOff size={18} />
                )}
                <span>
                  {ticketSystemSettings.isEnabled
                    ? (isArabic ? 'النظام مفعّل' : 'System Active')
                    : (isArabic ? 'النظام معطّل' : 'System Disabled')}
                </span>
              </button>
              
              <button
                onClick={() => setShowStatusCategoryManager(true)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                title={isArabic ? 'إدارة الحالات والأنواع' : 'Manage Statuses & Categories'}
              >
                <Settings size={20} />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="shrink-0 bg-gray-50 border-b px-6 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600">{isArabic ? 'الإجمالي:' : 'Total:'}</span>
              <span className="font-bold text-purple-600">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">{isArabic ? 'جديدة:' : 'New:'}</span>
              <span className="font-bold text-blue-600">{stats.open}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600">{isArabic ? 'قيد المراجعة:' : 'In Progress:'}</span>
              <span className="font-bold text-yellow-600">{stats.underReview}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-sm text-gray-600">{isArabic ? 'مغلقة:' : 'Closed:'}</span>
              <span className="font-bold text-gray-600">{stats.closed}</span>
            </div>
            
            <div className="flex-1"></div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? 'بحث...' : 'Search...'}
                  className="w-64 pr-10 pl-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl border transition-colors ${
                  showFilters ? 'bg-purple-100 border-purple-300 text-purple-600' : 'border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="all">{isArabic ? 'جميع الحالات' : 'All Statuses'}</option>
                {statuses.map(s => (
                  <option key={s.key} value={s.key}>{isArabic ? s.label_ar : s.label_en}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="all">{isArabic ? 'جميع الأنواع' : 'All Categories'}</option>
                {categories.map(c => (
                  <option key={c.key} value={c.key}>{isArabic ? c.label_ar : c.label_en}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tickets List */}
          <div className="w-[400px] border-l bg-white flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800">{isArabic ? 'قائمة التذاكر' : 'Tickets List'}</h3>
              <p className="text-sm text-gray-500">{filteredTickets.length} {isArabic ? 'تذكرة' : 'tickets'}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw size={32} className="animate-spin text-purple-600" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                  <Ticket size={64} className="mb-4 opacity-30" />
                  <p className="text-lg font-medium">{isArabic ? 'لا توجد تذاكر' : 'No tickets'}</p>
                  <p className="text-sm">{isArabic ? 'ستظهر التذاكر هنا' : 'Tickets will appear here'}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTickets.map(ticket => {
                    const statusInfo = getStatusInfo(ticket.status);
                    const categoryInfo = getCategoryInfo(ticket.category);
                    const isSelected = selectedTicket?.id === ticket.id;

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-purple-50 border-r-4 border-purple-500' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-mono text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-bold">
                            {ticket.ticketCode}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-800 truncate mb-1">{ticket.subject}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <User size={12} />
                          <span className="truncate">{ticket.customerUsername}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded ${categoryInfo.bg} ${categoryInfo.text}`}>
                            {categoryInfo.label}
                          </span>
                          <span className="text-xs text-gray-400">{getTimeAgo(ticket.updatedAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Detail */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedTicket ? (
              <>
                {/* Ticket Header */}
                <div className="shrink-0 bg-white border-b p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl font-bold text-purple-700">
                          {selectedTicket.ticketCode}
                        </span>
                        <button
                          onClick={() => copyToClipboard(selectedTicket.ticketCode)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title={isArabic ? 'نسخ' : 'Copy'}
                        >
                          <Copy size={14} className="text-gray-400" />
                        </button>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(selectedTicket.status).bg} ${getStatusInfo(selectedTicket.status).text}`}>
                        {getStatusInfo(selectedTicket.status).label}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={20} className="text-gray-400" />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{selectedTicket.subject}</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{isArabic ? 'العميل' : 'Customer'}</p>
                      <p className="font-medium text-gray-800">{selectedTicket.customerUsername}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{isArabic ? 'البريد' : 'Email'}</p>
                      <p className="font-medium text-gray-800 text-sm truncate">{selectedTicket.customerEmail}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{isArabic ? 'النوع' : 'Category'}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-sm ${getCategoryInfo(selectedTicket.category).bg} ${getCategoryInfo(selectedTicket.category).text}`}>
                        {getCategoryInfo(selectedTicket.category).label}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{isArabic ? 'الأولوية' : 'Priority'}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-sm ${getPriorityInfo(selectedTicket.priority).bg} ${getPriorityInfo(selectedTicket.priority).text}`}>
                        {getPriorityInfo(selectedTicket.priority).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="shrink-0 bg-white border-b px-6 py-3 flex items-center gap-4">
                  <span className="text-sm text-gray-600">{isArabic ? 'تغيير الحالة:' : 'Change Status:'}</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                  >
                    {statuses.filter(s => s.key !== 'closed').map(s => (
                      <option key={s.key} value={s.key}>{isArabic ? s.label_ar : s.label_en}</option>
                    ))}
                  </select>
                  <div className="flex-1"></div>
                  <button
                    onClick={() => setShowCloseDialog(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    {isArabic ? 'إغلاق التذكرة' : 'Close Ticket'}
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {/* Original Description */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">{selectedTicket.customerUsername}</span>
                          <span className="text-xs text-gray-400 mx-2">•</span>
                          <span className="text-xs text-gray-400">{formatDate(selectedTicket.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>

                    {/* Messages */}
                    {selectedTicket.messages.map((msg: TicketMessage, index: number) => (
                      <div
                        key={msg.id || index}
                        className={`flex ${msg.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl p-4 ${
                          msg.isInternal
                            ? 'bg-yellow-50 border-2 border-yellow-200'
                            : msg.senderType === 'customer'
                            ? 'bg-white shadow-sm border'
                            : 'bg-purple-600 text-white'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {msg.senderType === 'customer' ? (
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <User size={12} className="text-blue-600" />
                              </div>
                            ) : (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${msg.isInternal ? 'bg-yellow-200' : 'bg-white/20'}`}>
                                <MessageSquare size={12} className={msg.isInternal ? 'text-yellow-700' : 'text-white'} />
                              </div>
                            )}
                            <span className={`text-xs font-medium ${
                              msg.isInternal ? 'text-yellow-700' :
                              msg.senderType === 'customer' ? 'text-gray-600' : 'text-purple-200'
                            }`}>
                              {msg.isInternal 
                                ? (isArabic ? 'ملاحظة داخلية' : 'Internal Note')
                                : msg.senderType === 'customer' 
                                ? msg.senderName
                                : (isArabic ? 'الإدارة' : 'Support')}
                            </span>
                            <span className={`text-xs ${
                              msg.isInternal ? 'text-yellow-600' :
                              msg.senderType === 'customer' ? 'text-gray-400' : 'text-purple-200'
                            }`}>
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Box */}
                {selectedTicket.status !== 'closed' && (
                  <div className="shrink-0 bg-white border-t p-4">
                    <div className="max-w-3xl mx-auto">
                      <div className="flex items-center gap-3 mb-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className={isInternalNote ? 'text-yellow-600 font-medium' : ''}>
                            {isArabic ? 'ملاحظة داخلية (لا تظهر للعميل)' : 'Internal note (not visible to customer)'}
                          </span>
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder={isArabic ? 'اكتب ردك هنا...' : 'Type your reply here...'}
                          rows={3}
                          className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                            isInternalNote ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                          }`}
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={sendingReply || !replyMessage.trim()}
                          className="px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {sendingReply ? (
                            <RefreshCw size={20} className="animate-spin" />
                          ) : (
                            <Send size={20} />
                          )}
                          <span className="font-medium">{isArabic ? 'إرسال' : 'Send'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Eye size={40} className="opacity-30" />
                </div>
                <p className="text-xl font-medium">{isArabic ? 'اختر تذكرة' : 'Select a ticket'}</p>
                <p className="text-sm">{isArabic ? 'اختر تذكرة من القائمة لعرض التفاصيل' : 'Choose a ticket from the list to view details'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Close Ticket Dialog */}
        {showCloseDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {isArabic ? 'إغلاق التذكرة' : 'Close Ticket'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isArabic ? 'لن يتمكن العميل من الرد بعد الإغلاق' : 'Customer will not be able to reply after closing'}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'ملخص الحل:' : 'Resolution Summary:'}
                </label>
                <textarea
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder={isArabic ? 'اكتب ملخص الحل هنا...' : 'Write resolution summary here...'}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCloseTicket}
                  disabled={!resolutionSummary.trim()}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {isArabic ? 'إغلاق التذكرة' : 'Close Ticket'}
                </button>
                <button
                  onClick={() => {
                    setShowCloseDialog(false);
                    setResolutionSummary('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disable Ticket System Dialog */}
        {showSystemSettingsDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <PowerOff size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {isArabic ? 'إيقاف نظام التذاكر' : 'Disable Ticket System'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isArabic ? 'لن يتمكن العملاء من فتح تذاكر جديدة' : 'Customers will not be able to open new tickets'}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'رسالة الإغلاق للعملاء:' : 'Closure message for customers:'}
                </label>
                <textarea
                  value={tempClosureMessage}
                  onChange={(e) => setTempClosureMessage(e.target.value)}
                  placeholder={isArabic ? 'اكتب رسالة الإغلاق هنا...' : 'Write closure message here...'}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  dir={isArabic ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Scheduled Closure Option */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useScheduledClosure}
                    onChange={(e) => setUseScheduledClosure(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {isArabic ? 'جدولة الإغلاق التلقائي' : 'Schedule automatic closure'}
                  </span>
                </label>
                
                {useScheduledClosure && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        {isArabic ? 'التاريخ' : 'Date'}
                      </label>
                      <input
                        type="date"
                        value={scheduledClosureDate}
                        onChange={(e) => setScheduledClosureDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        {isArabic ? 'الوقت' : 'Time'}
                      </label>
                      <input
                        type="time"
                        value={scheduledClosureTime}
                        onChange={(e) => setScheduledClosureTime(e.target.value)}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Tickets Warning */}
              {stats.open > 0 && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-sm text-orange-700 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {isArabic 
                      ? `تنبيه: يوجد ${stats.open} تذكرة معلقة`
                      : `Warning: ${stats.open} pending ticket(s)`}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleDisableTicketSystem}
                  disabled={!tempClosureMessage.trim() || savingSettings}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {savingSettings ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <PowerOff size={18} />
                  )}
                  <span>{isArabic ? 'إيقاف النظام' : 'Disable System'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowSystemSettingsDialog(false);
                    setTempClosureMessage('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status & Category Manager Dialog */}
        {showStatusCategoryManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[900px] max-h-[85vh] mx-4 shadow-2xl overflow-hidden flex flex-col">
              <div className="shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings size={24} />
                    <h3 className="text-xl font-bold">
                      {isArabic ? 'إدارة الحالات والأنواع' : 'Manage Statuses & Categories'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowStatusCategoryManager(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="shrink-0 flex border-b">
                <button
                  onClick={() => setActiveTab('statuses')}
                  className={`flex-1 py-4 px-6 font-medium transition-colors ${
                    activeTab === 'statuses'
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {isArabic ? 'الحالات' : 'Statuses'}
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`flex-1 py-4 px-6 font-medium transition-colors ${
                    activeTab === 'categories'
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {isArabic ? 'الأنواع' : 'Categories'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'statuses' ? (
                  <div className="space-y-6">
                    {/* Add New Status */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-purple-600" />
                        {isArabic ? 'إضافة حالة جديدة' : 'Add New Status'}
                      </h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{isArabic ? 'المفتاح' : 'Key'}</label>
                          <input
                            type="text"
                            value={newStatus.key}
                            onChange={(e) => setNewStatus({ ...newStatus, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                            placeholder="status_key"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{isArabic ? 'الاسم بالعربية' : 'Arabic'}</label>
                          <input
                            type="text"
                            value={newStatus.label_ar}
                            onChange={(e) => setNewStatus({ ...newStatus, label_ar: e.target.value })}
                            placeholder="الاسم بالعربية"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{isArabic ? 'الاسم بالإنجليزية' : 'English'}</label>
                          <input
                            type="text"
                            value={newStatus.label_en}
                            onChange={(e) => setNewStatus({ ...newStatus, label_en: e.target.value })}
                            placeholder="English name"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">{isArabic ? 'اللون' : 'Color'}</label>
                            <select
                              value={newStatus.color}
                              onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              {colorOptions.map(c => (
                                <option key={c.value} value={c.value}>{isArabic ? c.label : c.value}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={handleAddStatus}
                            disabled={!newStatus.key || !newStatus.label_ar || !newStatus.label_en}
                            className="self-end px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status List */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-800">{isArabic ? 'الحالات الحالية' : 'Current Statuses'}</h4>
                      {statuses.map(status => (
                        <div key={status.id} className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-purple-200 transition-colors">
                          {editingStatus?.id === status.id ? (
                            <div className="grid grid-cols-4 gap-4">
                              <input
                                type="text"
                                value={editingStatus.key}
                                onChange={(e) => setEditingStatus({ ...editingStatus, key: e.target.value })}
                                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm"
                              />
                              <input
                                type="text"
                                value={editingStatus.label_ar}
                                onChange={(e) => setEditingStatus({ ...editingStatus, label_ar: e.target.value })}
                                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm"
                                dir="rtl"
                              />
                              <input
                                type="text"
                                value={editingStatus.label_en}
                                onChange={(e) => setEditingStatus({ ...editingStatus, label_en: e.target.value })}
                                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm"
                              />
                              <div className="flex gap-2">
                                <select
                                  value={editingStatus.color}
                                  onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm"
                                >
                                  {colorOptions.map(c => (
                                    <option key={c.value} value={c.value}>{isArabic ? c.label : c.value}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleUpdateStatus(editingStatus)}
                                  className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                                >
                                  <Save size={18} />
                                </button>
                                <button
                                  onClick={() => setEditingStatus(null)}
                                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className={`px-4 py-2 rounded-xl text-sm font-medium ${colorOptions.find(c => c.value === status.color)?.bg} ${colorOptions.find(c => c.value === status.color)?.text}`}>
                                  {isArabic ? status.label_ar : status.label_en}
                                </span>
                                <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">{status.key}</span>
                                <span className="text-sm text-gray-400">
                                  {isArabic ? status.label_en : status.label_ar}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingStatus(status)}
                                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStatus(status.id)}
                                  disabled={statuses.length <= 1}
                                  className="p-2 hover:bg-red-50 rounded-xl text-red-500 disabled:opacity-30 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Add New Category */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-purple-600" />
                        {isArabic ? 'إضافة نوع جديد' : 'Add New Category'}
                      </h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{isArabic ? 'المفتاح' : 'Key'}</label>
                          <input
                            type="text"
                            value={newCategory.key}
                            onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                            placeholder="category_key"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{isArabic ? 'الاسم بالعربية' : 'Arabic'}</label>
                          <input
                            type="text"
                            value={newCategory.label_ar}
                            onChange={(e) => setNewCategory({ ...newCategory, label_ar: e.target.value })}
                            placeholder="الاسم بالعربية"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{isArabic ? 'الاسم بالإنجليزية' : 'English'}</label>
                          <input
                            type="text"
                            value={newCategory.label_en}
                            onChange={(e) => setNewCategory({ ...newCategory, label_en: e.target.value })}
                            placeholder="English name"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">{isArabic ? 'اللون' : 'Color'}</label>
                            <select
                              value={newCategory.color}
                              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              {colorOptions.map(c => (
                                <option key={c.value} value={c.value}>{isArabic ? c.label : c.value}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={handleAddCategory}
                            disabled={!newCategory.key || !newCategory.label_ar || !newCategory.label_en}
                            className="self-end px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Category List */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-800">{isArabic ? 'الأنواع الحالية' : 'Current Categories'}</h4>
                      {categories.map(category => (
                        <div key={category.id} className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-purple-200 transition-colors">
                          {editingCategory?.id === category.id ? (
                            <div className="grid grid-cols-4 gap-4">
                              <input
                                type="text"
                                value={editingCategory.key}
                                onChange={(e) => setEditingCategory({ ...editingCategory, key: e.target.value })}
                                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm"
                              />
                              <input
                                type="text"
                                value={editingCategory.label_ar}
                                onChange={(e) => setEditingCategory({ ...editingCategory, label_ar: e.target.value })}
                                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm"
                                dir="rtl"
                              />
                              <input
                                type="text"
                                value={editingCategory.label_en}
                                onChange={(e) => setEditingCategory({ ...editingCategory, label_en: e.target.value })}
                                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm"
                              />
                              <div className="flex gap-2">
                                <select
                                  value={editingCategory.color}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm"
                                >
                                  {colorOptions.map(c => (
                                    <option key={c.value} value={c.value}>{isArabic ? c.label : c.value}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleUpdateCategory(editingCategory)}
                                  className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                                >
                                  <Save size={18} />
                                </button>
                                <button
                                  onClick={() => setEditingCategory(null)}
                                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className={`px-4 py-2 rounded-xl text-sm font-medium ${colorOptions.find(c => c.value === category.color)?.bg} ${colorOptions.find(c => c.value === category.color)?.text}`}>
                                  {isArabic ? category.label_ar : category.label_en}
                                </span>
                                <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">{category.key}</span>
                                <span className="text-sm text-gray-400">
                                  {isArabic ? category.label_en : category.label_ar}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingCategory(category)}
                                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  disabled={categories.length <= 1}
                                  className="p-2 hover:bg-red-50 rounded-xl text-red-500 disabled:opacity-30 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketManagementModal;
