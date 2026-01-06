import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Gift, Award, TrendingUp, Copy, Check, ArrowLeft, Users } from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useLoyalty } from '../../contexts/LoyaltyContext';

const CustomerLoyalty: React.FC = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const { points, transactions, referralInfo, settings, loading, applyReferralCode } = useLoyalty();
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!customer) {
    navigate('/customer/auth');
    return null;
  }

  const handleCopyCode = () => {
    if (referralInfo?.code) {
      navigator.clipboard.writeText(referralInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApplyCode = async () => {
    if (!referralCodeInput.trim()) return;
    setApplyingCode(true);
    setApplyMessage(null);
    
    const result = await applyReferralCode(referralCodeInput.trim());
    setApplyMessage({
      type: result.success ? 'success' : 'error',
      text: isArabic ? result.message_ar : result.message_en
    });
    
    if (result.success) {
      setReferralCodeInput('');
    }
    setApplyingCode(false);
  };

  const pointsValue = (points * settings.pointsValue).toFixed(2);

  return (
    <div className={`min-h-screen bg-gray-50 ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-6">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            {isArabic ? 'رجوع' : 'Back'}
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Gift size={28} />
            {isArabic ? 'نقاط الولاء' : 'Loyalty Points'}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Points Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
                  <Award className="mx-auto text-pink-600 mb-2" size={32} />
                  <p className="text-3xl font-bold text-gray-800">{points.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{isArabic ? 'نقاطك الحالية' : 'Your Points'}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                  <TrendingUp className="mx-auto text-green-600 mb-2" size={32} />
                  <p className="text-3xl font-bold text-gray-800">${pointsValue}</p>
                  <p className="text-sm text-gray-500">{isArabic ? 'قيمة النقاط' : 'Points Value'}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <Users className="mx-auto text-blue-600 mb-2" size={32} />
                  <p className="text-3xl font-bold text-gray-800">{referralInfo?.referralCount || 0}</p>
                  <p className="text-sm text-gray-500">{isArabic ? 'إحالاتك' : 'Your Referrals'}</p>
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {isArabic ? 'كود الإحالة الخاص بك' : 'Your Referral Code'}
              </h2>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <div className="flex-1">
                  <p className="text-2xl font-mono font-bold text-pink-600">{referralInfo?.code || '-'}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isArabic 
                      ? `شارك هذا الكود واحصل على ${settings.referralBonus} نقطة لكل صديق`
                      : `Share this code and earn ${settings.referralBonus} points per friend`}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-3 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors"
                >
                  {copied ? <Check size={24} /> : <Copy size={24} />}
                </button>
              </div>
            </div>

            {/* Apply Referral Code */}
            {!referralInfo?.referredBy && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {isArabic ? 'هل لديك كود إحالة؟' : 'Have a referral code?'}
                </h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder={isArabic ? 'أدخل كود الإحالة' : 'Enter referral code'}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    onClick={handleApplyCode}
                    disabled={applyingCode || !referralCodeInput.trim()}
                    className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  >
                    {applyingCode 
                      ? (isArabic ? 'جاري التطبيق...' : 'Applying...')
                      : (isArabic ? 'تطبيق' : 'Apply')}
                  </button>
                </div>
                {applyMessage && (
                  <p className={`mt-2 text-sm ${applyMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {applyMessage.text}
                  </p>
                )}
              </div>
            )}

            {/* How to Earn */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {isArabic ? 'كيف تكسب النقاط؟' : 'How to Earn Points?'}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Gift size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {isArabic ? 'عند كل عملية شراء' : 'On every purchase'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isArabic 
                        ? `احصل على ${settings.pointsPerDollar} نقطة لكل دولار`
                        : `Earn ${settings.pointsPerDollar} points per dollar`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {isArabic ? 'إحالة صديق' : 'Refer a friend'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isArabic 
                        ? `احصل على ${settings.referralBonus} نقطة لكل صديق`
                        : `Earn ${settings.referralBonus} points per friend`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {isArabic ? 'سجل النقاط' : 'Points History'}
              </h2>
              {transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {isArabic ? 'لا توجد معاملات بعد' : 'No transactions yet'}
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {isArabic ? transaction.description_ar : transaction.description_en}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                      <span className={`font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerLoyalty;
