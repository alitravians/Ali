import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Ticket, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Home,
  LogOut,
  Send,
  Paperclip
} from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useTickets } from '../../contexts/TicketContext';

const MyTickets: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { customer, isLoggedIn, isLoading: authLoading, logout } = useCustomerAuth();
  const { tickets, isLoading, addMessage } = useTickets();

  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const isArabic = i18n.language === 'ar';

  // Redirect if not logged in
  if (!authLoading && !isLoggedIn) {
    navigate('/customer/auth');
    return null;
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return { 
          label: isArabic ? 'جديدة' : 'Open', 
          color: 'blue',
          icon: <AlertCircle size={16} />
        };
      case 'under_review':
        return { 
          label: isArabic ? 'تحت المراجعة' : 'Under Review', 
          color: 'yellow',
          icon: <Clock size={16} />
        };
      case 'awaiting_customer':
        return { 
          label: isArabic ? 'بانتظار ردك' : 'Awaiting Your Reply', 
          color: 'orange',
          icon: <MessageSquare size={16} />
        };
      case 'resolved':
        return { 
          label: isArabic ? 'تم الحل' : 'Resolved', 
          color: 'green',
          icon: <CheckCircle size={16} />
        };
      case 'closed':
        return { 
          label: isArabic ? 'مغلقة' : 'Closed', 
          color: 'gray',
          icon: <XCircle size={16} />
        };
      default:
        return { label: status, color: 'gray', icon: <AlertCircle size={16} /> };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'problem': return isArabic ? 'مشكلة' : 'Problem';
      case 'report': return isArabic ? 'بلاغ' : 'Report';
      case 'technical': return isArabic ? 'خلل فني' : 'Technical';
      case 'fraud': return isArabic ? 'عملية نصب' : 'Fraud';
      default: return category;
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    const success = await addMessage(ticketId, replyMessage.trim());
    setSendingReply(false);

    if (success) {
      setReplyMessage('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Ticket size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isArabic ? 'تذاكري' : 'My Tickets'}
              </h1>
              <p className="text-purple-200 text-sm">
                {isArabic ? `مرحباً ${customer?.username}` : `Hello ${customer?.username}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/create-ticket"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">{isArabic ? 'تذكرة جديدة' : 'New Ticket'}</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Home size={18} />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600/80 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket size={40} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {isArabic ? 'لا توجد تذاكر' : 'No Tickets'}
            </h2>
            <p className="text-gray-500 mb-6">
              {isArabic ? 'لم تقم بفتح أي تذكرة بعد' : "You haven't opened any tickets yet"}
            </p>
            <Link
              to="/create-ticket"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              <span>{isArabic ? 'فتح تذكرة جديدة' : 'Open New Ticket'}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => {
              const statusInfo = getStatusInfo(ticket.status);
              const isExpanded = expandedTicket === ticket.id;

              return (
                <div key={ticket.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Ticket Header */}
                  <div
                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {ticket.ticketCode}
                          </span>
                          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                            statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                            statusInfo.color === 'green' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {statusInfo.icon}
                            <span>{statusInfo.label}</span>
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {getCategoryLabel(ticket.category)}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-800">{ticket.subject}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(ticket.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t">
                      {/* Messages */}
                      <div className="p-4 bg-gray-50 max-h-96 overflow-y-auto space-y-4">
                        {ticket.messages.map((msg: any, index: number) => (
                          <div
                            key={msg.id || index}
                            className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-xl p-4 ${
                              msg.senderType === 'customer'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white border shadow-sm'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-medium ${
                                  msg.senderType === 'customer' ? 'text-purple-200' : 'text-gray-500'
                                }`}>
                                  {msg.senderType === 'customer' 
                                    ? (isArabic ? 'أنت' : 'You')
                                    : (isArabic ? 'الإدارة' : 'Support')}
                                </span>
                                <span className={`text-xs ${
                                  msg.senderType === 'customer' ? 'text-purple-200' : 'text-gray-400'
                                }`}>
                                  {new Date(msg.createdAt).toLocaleTimeString(isArabic ? 'ar-SA' : 'en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {msg.attachments.map((att: any, i: number) => (
                                    <div key={i} className={`flex items-center gap-1 text-xs ${
                                      msg.senderType === 'customer' ? 'text-purple-200' : 'text-gray-500'
                                    }`}>
                                      <Paperclip size={12} />
                                      <span>{att.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply Box */}
                      {ticket.customerCanReply && ticket.status !== 'closed' ? (
                        <div className="p-4 border-t bg-white">
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder={isArabic ? 'اكتب ردك...' : 'Type your reply...'}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              onKeyPress={(e) => e.key === 'Enter' && handleSendReply(ticket.id)}
                            />
                            <button
                              onClick={() => handleSendReply(ticket.id)}
                              disabled={sendingReply || !replyMessage.trim()}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send size={20} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border-t bg-gray-100 text-center">
                          <p className="text-gray-500 text-sm">
                            {isArabic ? 'هذه التذكرة مغلقة ولا يمكن الرد عليها' : 'This ticket is closed and cannot be replied to'}
                          </p>
                          {ticket.resolutionSummary && (
                            <div className="mt-3 bg-white rounded-lg p-3 text-right">
                              <p className="text-xs text-gray-500 mb-1">
                                {isArabic ? 'ملخص الحل:' : 'Resolution Summary:'}
                              </p>
                              <p className="text-gray-700">{ticket.resolutionSummary}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Track Ticket Link */}
        <div className="mt-8 text-center">
          <Link
            to="/track-ticket"
            className="text-purple-200 hover:text-white transition-colors"
          >
            {isArabic ? 'تتبع تذكرة برقمها' : 'Track ticket by number'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
