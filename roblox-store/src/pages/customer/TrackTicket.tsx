import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Ticket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Home,
  Paperclip
} from 'lucide-react';
import { useTickets } from '../../contexts/TicketContext';
import type { Ticket as TicketType } from '../../contexts/TicketContext';

const TrackTicket: React.FC = () => {
  const { i18n } = useTranslation();
  const { getTicketByCode } = useTickets();

  const [ticketCode, setTicketCode] = useState('');
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketType | null>(null);

  const isArabic = i18n.language === 'ar';

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return { 
          label: isArabic ? 'جديدة' : 'Open', 
          color: 'blue',
          icon: <AlertCircle size={20} />,
          description: isArabic ? 'تم استلام تذكرتك وسيتم مراجعتها قريباً' : 'Your ticket has been received and will be reviewed soon'
        };
      case 'under_review':
        return { 
          label: isArabic ? 'تحت المراجعة' : 'Under Review', 
          color: 'yellow',
          icon: <Clock size={20} />,
          description: isArabic ? 'فريق الدعم يعمل على حل مشكلتك' : 'Our support team is working on your issue'
        };
      case 'awaiting_customer':
        return { 
          label: isArabic ? 'بانتظار ردك' : 'Awaiting Your Reply', 
          color: 'orange',
          icon: <MessageSquare size={20} />,
          description: isArabic ? 'نحتاج منك معلومات إضافية للمتابعة' : 'We need additional information from you to proceed'
        };
      case 'resolved':
        return { 
          label: isArabic ? 'تم الحل' : 'Resolved', 
          color: 'green',
          icon: <CheckCircle size={20} />,
          description: isArabic ? 'تم حل مشكلتك بنجاح' : 'Your issue has been resolved successfully'
        };
      case 'closed':
        return { 
          label: isArabic ? 'مغلقة' : 'Closed', 
          color: 'gray',
          icon: <XCircle size={20} />,
          description: isArabic ? 'تم إغلاق هذه التذكرة' : 'This ticket has been closed'
        };
      default:
        return { label: status, color: 'gray', icon: <AlertCircle size={20} />, description: '' };
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTicket(null);

    if (!ticketCode.trim() || !email.trim()) {
      setError(isArabic ? 'يرجى إدخال رقم التذكرة والبريد الإلكتروني' : 'Please enter ticket number and email');
      return;
    }

    setIsSearching(true);
    const result = await getTicketByCode(ticketCode.trim(), email.trim());
    setIsSearching(false);

    if (result) {
      setTicket(result);
    } else {
      setError(isArabic ? 'لم يتم العثور على التذكرة. تأكد من رقم التذكرة والبريد الإلكتروني' : 'Ticket not found. Please verify the ticket number and email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isArabic ? 'تتبع التذكرة' : 'Track Ticket'}
          </h1>
          <p className="text-purple-200">
            {isArabic ? 'أدخل رقم التذكرة والبريد الإلكتروني لمعرفة حالتها' : 'Enter your ticket number and email to check its status'}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {isArabic ? 'رقم التذكرة' : 'Ticket Number'}
              </label>
              <input
                type="text"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-lg text-center"
                placeholder="MM2-XXXXXX"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={isArabic ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <span>{isArabic ? 'جاري البحث...' : 'Searching...'}</span>
              ) : (
                <>
                  <Search size={20} />
                  <span>{isArabic ? 'بحث' : 'Search'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Ticket Result */}
        {ticket && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Status Banner */}
            {(() => {
              const statusInfo = getStatusInfo(ticket.status);
              return (
                <div className={`p-6 ${
                  statusInfo.color === 'blue' ? 'bg-blue-500' :
                  statusInfo.color === 'yellow' ? 'bg-yellow-500' :
                  statusInfo.color === 'orange' ? 'bg-orange-500' :
                  statusInfo.color === 'green' ? 'bg-green-500' :
                  'bg-gray-500'
                } text-white`}>
                  <div className="flex items-center gap-3 mb-2">
                    {statusInfo.icon}
                    <span className="text-2xl font-bold">{statusInfo.label}</span>
                  </div>
                  <p className="opacity-90">{statusInfo.description}</p>
                </div>
              );
            })()}

            {/* Ticket Details */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-lg bg-purple-100 text-purple-700 px-3 py-1 rounded-lg">
                  {ticket.ticketCode}
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                  {getCategoryLabel(ticket.category)}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">{ticket.subject}</h3>
              
              <div className="text-sm text-gray-500 mb-6">
                {isArabic ? 'تاريخ الإنشاء: ' : 'Created: '}
                {new Date(ticket.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {/* Messages */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-700 mb-4">
                  {isArabic ? 'المحادثة' : 'Conversation'}
                </h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {ticket.messages.map((msg: any, index: number) => (
                    <div
                      key={msg.id || index}
                      className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-xl p-4 ${
                        msg.senderType === 'customer'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100'
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
              </div>

              {/* Resolution Summary */}
              {ticket.status === 'closed' && ticket.resolutionSummary && (
                <div className="mt-4 bg-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">
                    {isArabic ? 'ملخص الحل:' : 'Resolution Summary:'}
                  </p>
                  <p className="text-gray-700">{ticket.resolutionSummary}</p>
                </div>
              )}

              {/* Login Prompt */}
              <div className="mt-6 bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-purple-700 mb-3">
                  {isArabic 
                    ? 'سجل دخول لحسابك للرد على التذكرة ومتابعتها'
                    : 'Login to your account to reply and follow up on this ticket'}
                </p>
                <Link
                  to="/customer/auth"
                  className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Login'}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <Home size={18} />
            <span>{isArabic ? 'الرئيسية' : 'Home'}</span>
          </Link>
          <Link
            to="/create-ticket"
            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <Ticket size={18} />
            <span>{isArabic ? 'فتح تذكرة جديدة' : 'Open New Ticket'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackTicket;
