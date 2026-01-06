import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Send, 
  AlertTriangle, 
  Bug, 
  Shield, 
  HelpCircle,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  Ticket,
  XCircle
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useTickets } from '../../contexts/TicketContext';
import type { TicketAttachment } from '../../contexts/TicketContext';

interface TicketSystemSettings {
  isEnabled: boolean;
  closureMessage_ar: string;
  closureMessage_en: string;
  closedAt?: string;
  closedBy?: string;
}

type TicketCategory = 'problem' | 'report' | 'technical' | 'fraud';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

const CreateTicket: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading } = useCustomerAuth();
  const { createTicket } = useTickets();

  const [category, setCategory] = useState<TicketCategory>('problem');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ ticketCode: string } | null>(null);

  // Ticket system settings
  const [ticketSystemSettings, setTicketSystemSettings] = useState<TicketSystemSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const isArabic = i18n.language === 'ar';

  // Load ticket system settings
  useEffect(() => {
    const settingsRef = ref(database, 'settings/ticketSystem');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setTicketSystemSettings(snapshot.val());
      } else {
        // Default to enabled if no settings exist
        setTicketSystemSettings({
          isEnabled: true,
          closureMessage_ar: 'نظام التذاكر مغلق حالياً. يرجى المحاولة لاحقاً.',
          closureMessage_en: 'The ticket system is currently closed. Please try again later.'
        });
      }
      setLoadingSettings(false);
    });

    return () => unsubscribe();
  }, []);

  // Redirect if not logged in
  if (!authLoading && !isLoggedIn) {
    navigate('/customer/auth');
    return null;
  }

  const categories: { value: TicketCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'problem', label: isArabic ? 'مشكلة' : 'Problem', icon: <HelpCircle size={20} />, color: 'blue' },
    { value: 'report', label: isArabic ? 'بلاغ' : 'Report', icon: <AlertTriangle size={20} />, color: 'yellow' },
    { value: 'technical', label: isArabic ? 'خلل فني' : 'Technical Issue', icon: <Bug size={20} />, color: 'orange' },
    { value: 'fraud', label: isArabic ? 'عملية نصب' : 'Fraud Report', icon: <Shield size={20} />, color: 'red' },
  ];

  const priorities: { value: TicketPriority; label: string; color: string }[] = [
    { value: 'low', label: isArabic ? 'منخفضة' : 'Low', color: 'gray' },
    { value: 'normal', label: isArabic ? 'عادية' : 'Normal', color: 'blue' },
    { value: 'high', label: isArabic ? 'عالية' : 'High', color: 'orange' },
    { value: 'urgent', label: isArabic ? 'عاجلة' : 'Urgent', color: 'red' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(isArabic ? 'حجم الملف كبير جداً (الحد الأقصى 5MB)' : 'File too large (max 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim() || !description.trim()) {
      setError(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    const result = await createTicket({
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      attachments
    });

    setIsSubmitting(false);

    if (result.success && result.ticketCode) {
      setSuccess({ ticketCode: result.ticketCode });
    } else {
      setError(result.error || (isArabic ? 'حدث خطأ' : 'An error occurred'));
    }
  };

  // Show loading while checking settings
  if (loadingSettings || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="text-white text-xl">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    );
  }

  // Show closure message if ticket system is disabled
  if (ticketSystemSettings && !ticketSystemSettings.isEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isArabic ? 'نظام التذاكر مغلق' : 'Ticket System Closed'}
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-lg">
              {isArabic ? ticketSystemSettings.closureMessage_ar : ticketSystemSettings.closureMessage_en}
            </p>
          </div>
          {ticketSystemSettings.closedAt && (
            <p className="text-sm text-gray-500 mb-6">
              {isArabic ? 'تم الإغلاق: ' : 'Closed: '}
              {new Date(ticketSystemSettings.closedAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          <div className="flex gap-3">
            <Link
              to="/"
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              {isArabic ? 'العودة للمتجر' : 'Back to Store'}
            </Link>
            <Link
              to="/track-ticket"
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              {isArabic ? 'تتبع تذكرة' : 'Track Ticket'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ticket size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isArabic ? 'تم إنشاء التذكرة بنجاح!' : 'Ticket Created Successfully!'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isArabic ? 'رقم التذكرة الخاص بك:' : 'Your ticket number:'}
          </p>
          <div className="bg-purple-100 rounded-xl p-4 mb-6">
            <p className="text-3xl font-bold text-purple-700 font-mono">{success.ticketCode}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {isArabic 
              ? 'احتفظ برقم التذكرة لتتبع حالتها. سيتم الرد عليك في أقرب وقت.'
              : 'Keep this number to track your ticket status. We will respond soon.'}
          </p>
          <div className="flex gap-3">
            <Link
              to="/my-tickets"
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              {isArabic ? 'تذاكري' : 'My Tickets'}
            </Link>
            <Link
              to="/"
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              {isArabic ? 'الرئيسية' : 'Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isArabic ? 'فتح تذكرة جديدة' : 'Open New Ticket'}
          </h1>
          <p className="text-purple-200">
            {isArabic ? 'أخبرنا بمشكلتك وسنساعدك في أقرب وقت' : 'Tell us your issue and we will help you soon'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-gray-700 font-medium mb-3">
              {isArabic ? 'نوع التذكرة *' : 'Ticket Type *'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    category === cat.value
                      ? `border-${cat.color}-500 bg-${cat.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={category === cat.value ? `text-${cat.color}-600` : 'text-gray-500'}>
                    {cat.icon}
                  </span>
                  <span className={`font-medium ${category === cat.value ? `text-${cat.color}-700` : 'text-gray-700'}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-gray-700 font-medium mb-3">
              {isArabic ? 'الأولوية' : 'Priority'}
            </label>
            <div className="flex gap-2 flex-wrap">
              {priorities.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    priority === p.value
                      ? p.color === 'gray' ? 'border-gray-500 bg-gray-100 text-gray-700'
                        : p.color === 'blue' ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : p.color === 'orange' ? 'border-orange-500 bg-orange-100 text-orange-700'
                        : 'border-red-500 bg-red-100 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {isArabic ? 'الموضوع *' : 'Subject *'}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={isArabic ? 'اكتب موضوع التذكرة...' : 'Enter ticket subject...'}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {isArabic ? 'الوصف *' : 'Description *'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder={isArabic ? 'اشرح مشكلتك بالتفصيل...' : 'Describe your issue in detail...'}
              required
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {isArabic ? 'المرفقات (اختياري)' : 'Attachments (optional)'}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
              <label className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={24} className="text-gray-400" />
                <span className="text-gray-500 text-sm">
                  {isArabic ? 'اضغط لرفع ملفات أو صور' : 'Click to upload files or images'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-100 rounded-lg p-2">
                    <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>{isArabic ? 'جاري الإرسال...' : 'Submitting...'}</span>
            ) : (
              <>
                <Send size={20} />
                <span>{isArabic ? 'إرسال التذكرة' : 'Submit Ticket'}</span>
              </>
            )}
          </button>

          {/* Back Link */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isArabic ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            <span>{isArabic ? 'العودة للمتجر' : 'Back to Store'}</span>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
