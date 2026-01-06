import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban, Send, AlertTriangle, LogOut, MessageSquare } from 'lucide-react';
import { ref, push, set } from 'firebase/database';
import { database } from '../../firebase/config';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';

const BannedPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { customer, logout } = useCustomerAuth();
  const isArabic = i18n.language === 'ar';

  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealMessage.trim() || !customer) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create a special ban appeal ticket
      const ticketCode = 'BAN-' + Date.now().toString(36).toUpperCase();
      const ticketsRef = ref(database, 'tickets');
      const newTicketRef = push(ticketsRef);

      await set(newTicketRef, {
        ticketCode,
        customerId: customer.id,
        customerEmail: customer.email,
        customerUsername: customer.username,
        robloxUsername: customer.robloxUsername || '',
        category: 'ban_appeal',
        subject: isArabic ? 'طلب إلغاء الحظر' : 'Ban Appeal Request',
        description: appealMessage.trim(),
        priority: 'high',
        status: 'open',
        banReason: customer.banReason || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [{
          id: 'initial',
          sender: 'customer',
          senderName: customer.username,
          content: appealMessage.trim(),
          createdAt: new Date().toISOString()
        }]
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting appeal:', err);
      setError(isArabic ? 'حدث خطأ أثناء إرسال الطلب' : 'Error submitting appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4 ${isArabic ? 'rtl' : 'ltr'}`}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban size={40} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isArabic ? 'تم حظر حسابك' : 'Your Account is Banned'}
          </h1>
          <p className="text-gray-600">
            {isArabic 
              ? 'لقد تم حظرك من استخدام المتجر'
              : 'You have been banned from using the store'}
          </p>
        </div>

        {/* Ban Reason */}
        {customer?.banReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 mb-1">
                  {isArabic ? 'سبب الحظر:' : 'Ban Reason:'}
                </p>
                <p className="text-red-700">{customer.banReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Appeal Form or Success Message */}
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={24} className="text-green-600" />
            </div>
            <h3 className="font-bold text-green-800 mb-2">
              {isArabic ? 'تم إرسال طلبك!' : 'Appeal Submitted!'}
            </h3>
            <p className="text-green-700 text-sm">
              {isArabic 
                ? 'سيتم مراجعة طلبك من قبل الإدارة والرد عليك في أقرب وقت.'
                : 'Your appeal will be reviewed by the administration and you will be contacted soon.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitAppeal} className="mb-6">
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                {isArabic ? 'إرسال طلب إلغاء الحظر' : 'Submit Ban Appeal'}
              </label>
              <textarea
                value={appealMessage}
                onChange={(e) => setAppealMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder={isArabic 
                  ? 'اشرح سبب طلبك لإلغاء الحظر...'
                  : 'Explain why you want to be unbanned...'}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !appealMessage.trim()}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>{isArabic ? 'جاري الإرسال...' : 'Submitting...'}</span>
              ) : (
                <>
                  <Send size={18} />
                  <span>{isArabic ? 'إرسال الطلب' : 'Submit Appeal'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 text-center">
            {isArabic 
              ? 'إذا كنت تعتقد أن هذا الحظر خطأ، يرجى إرسال طلب إلغاء الحظر وسيتم مراجعته من قبل الإدارة.'
              : 'If you believe this ban was a mistake, please submit an appeal and it will be reviewed by the administration.'}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          <span>{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
};

export default BannedPage;
