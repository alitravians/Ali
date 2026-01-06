import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Gift, Settings, Users, TrendingUp, Award, Plus, Minus } from 'lucide-react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../firebase/config';

interface LoyaltySettings {
  pointsPerDollar: number;
  pointsValue: number;
  referralBonus: number;
  referredBonus: number;
  minRedeemPoints: number;
}

interface CustomerLoyalty {
  id: string;
  username: string;
  points: number;
  referralCode: string;
  referralCount: number;
}

interface LoyaltyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoyaltyManagementModal: React.FC<LoyaltyManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'settings' | 'customers'>('settings');
  const [settings, setSettings] = useState<LoyaltySettings>({
    pointsPerDollar: 10,
    pointsValue: 0.01,
    referralBonus: 100,
    referredBonus: 50,
    minRedeemPoints: 100
  });
  const [customers, setCustomers] = useState<CustomerLoyalty[]>([]);
  const [loyalty, setLoyalty] = useState<{ [key: string]: { points: number; referral?: { code: string; referralCount: number } } }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjustingCustomer, setAdjustingCustomer] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    // Load settings
    const settingsRef = ref(database, 'settings/loyalty');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings({ ...settings, ...data });
      }
    });

    // Load customers
    const customersRef = ref(database, 'customers');
    const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const customersList = Object.entries(data).map(([id, customer]) => ({
          id,
          username: (customer as { username: string }).username,
          points: 0,
          referralCode: '',
          referralCount: 0
        }));
        setCustomers(customersList);
      }
      setLoading(false);
    });

    // Load loyalty data
    const loyaltyRef = ref(database, 'loyalty');
    const unsubscribeLoyalty = onValue(loyaltyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLoyalty(data);
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeCustomers();
      unsubscribeLoyalty();
    };
  }, []);

  const getCustomerPoints = (customerId: string) => {
    return loyalty[customerId]?.points || 0;
  };

  const getCustomerReferralCode = (customerId: string) => {
    return loyalty[customerId]?.referral?.code || '-';
  };

  const getCustomerReferralCount = (customerId: string) => {
    return loyalty[customerId]?.referral?.referralCount || 0;
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'settings/loyalty'), settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    setSaving(false);
  };

  const handleAdjustPoints = async () => {
    if (!adjustingCustomer || adjustPoints === 0) return;
    
    try {
      const currentPoints = getCustomerPoints(adjustingCustomer);
      const newPoints = Math.max(0, currentPoints + adjustPoints);
      
      await update(ref(database, `loyalty/${adjustingCustomer}`), {
        points: newPoints
      });

      // Log the adjustment
      const adjustmentLog = {
        customerId: adjustingCustomer,
        type: adjustPoints > 0 ? 'admin_add' : 'admin_remove',
        points: adjustPoints,
        description_ar: adjustReason || (adjustPoints > 0 ? 'إضافة نقاط من الإدارة' : 'خصم نقاط من الإدارة'),
        description_en: adjustReason || (adjustPoints > 0 ? 'Points added by admin' : 'Points removed by admin'),
        createdAt: new Date().toISOString()
      };
      
      await update(ref(database, `loyalty/${adjustingCustomer}/transactions/${Date.now()}`), adjustmentLog);

      setAdjustingCustomer(null);
      setAdjustPoints(0);
      setAdjustReason('');
    } catch (error) {
      console.error('Error adjusting points:', error);
    }
  };

  const totalPoints = Object.values(loyalty).reduce((sum, l) => sum + (l.points || 0), 0);
  const totalReferrals = Object.values(loyalty).reduce((sum, l) => sum + (l.referral?.referralCount || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gift size={24} />
            {isArabic ? 'إدارة نقاط الولاء' : 'Loyalty Points Management'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <Award className="mx-auto text-pink-600 mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-800">{totalPoints.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{isArabic ? 'إجمالي النقاط' : 'Total Points'}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <Users className="mx-auto text-blue-600 mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-800">{customers.length}</p>
            <p className="text-sm text-gray-500">{isArabic ? 'العملاء' : 'Customers'}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <TrendingUp className="mx-auto text-green-600 mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-800">{totalReferrals}</p>
            <p className="text-sm text-gray-500">{isArabic ? 'الإحالات' : 'Referrals'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings size={18} className="inline mr-2" />
            {isArabic ? 'الإعدادات' : 'Settings'}
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === 'customers'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={18} className="inline mr-2" />
            {isArabic ? 'العملاء' : 'Customers'}
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {activeTab === 'settings' ? (
            <div className="space-y-6">
              {/* Points Per Dollar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'النقاط لكل دولار' : 'Points Per Dollar'}
                </label>
                <input
                  type="number"
                  value={settings.pointsPerDollar}
                  onChange={(e) => setSettings({ ...settings, pointsPerDollar: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isArabic ? 'عدد النقاط التي يحصل عليها العميل مقابل كل دولار' : 'Points customer earns per dollar spent'}
                </p>
              </div>

              {/* Points Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'قيمة النقطة ($)' : 'Point Value ($)'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={settings.pointsValue}
                  onChange={(e) => setSettings({ ...settings, pointsValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isArabic ? 'قيمة كل نقطة بالدولار عند الاستبدال' : 'Dollar value of each point when redeemed'}
                </p>
              </div>

              {/* Referral Bonus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'مكافأة المُحيل' : 'Referrer Bonus'}
                </label>
                <input
                  type="number"
                  value={settings.referralBonus}
                  onChange={(e) => setSettings({ ...settings, referralBonus: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isArabic ? 'النقاط التي يحصل عليها العميل عند إحالة صديق' : 'Points earned when referring a friend'}
                </p>
              </div>

              {/* Referred Bonus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'مكافأة المُحال' : 'Referred Bonus'}
                </label>
                <input
                  type="number"
                  value={settings.referredBonus}
                  onChange={(e) => setSettings({ ...settings, referredBonus: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isArabic ? 'النقاط التي يحصل عليها العميل الجديد عند استخدام كود إحالة' : 'Points new customer gets when using referral code'}
                </p>
              </div>

              {/* Min Redeem Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'الحد الأدنى للاستبدال' : 'Minimum Redeem Points'}
                </label>
                <input
                  type="number"
                  value={settings.minRedeemPoints}
                  onChange={(e) => setSettings({ ...settings, minRedeemPoints: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isArabic ? 'الحد الأدنى من النقاط المطلوبة للاستبدال' : 'Minimum points required to redeem'}
                </p>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 disabled:opacity-50 font-medium"
              >
                {saving 
                  ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                  : (isArabic ? 'حفظ الإعدادات' : 'Save Settings')}
              </button>
            </div>
          ) : (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{isArabic ? 'لا يوجد عملاء' : 'No customers yet'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{customer.username}</p>
                          <div className="flex gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Award size={14} className="text-pink-600" />
                              {getCustomerPoints(customer.id).toLocaleString()} {isArabic ? 'نقطة' : 'points'}
                            </span>
                            <span>
                              {isArabic ? 'كود: ' : 'Code: '}{getCustomerReferralCode(customer.id)}
                            </span>
                            <span>
                              {isArabic ? 'إحالات: ' : 'Referrals: '}{getCustomerReferralCount(customer.id)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAdjustingCustomer(customer.id)}
                            className="px-3 py-1 bg-pink-100 text-pink-600 rounded hover:bg-pink-200 text-sm"
                          >
                            {isArabic ? 'تعديل النقاط' : 'Adjust Points'}
                          </button>
                        </div>
                      </div>

                      {/* Adjust Points Form */}
                      {adjustingCustomer === customer.id && (
                        <div className="mt-4 p-4 bg-white rounded-lg border">
                          <div className="flex gap-4 mb-3">
                            <button
                              onClick={() => setAdjustPoints(Math.abs(adjustPoints))}
                              className={`flex-1 py-2 rounded flex items-center justify-center gap-2 ${
                                adjustPoints >= 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              <Plus size={18} />
                              {isArabic ? 'إضافة' : 'Add'}
                            </button>
                            <button
                              onClick={() => setAdjustPoints(-Math.abs(adjustPoints))}
                              className={`flex-1 py-2 rounded flex items-center justify-center gap-2 ${
                                adjustPoints < 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              <Minus size={18} />
                              {isArabic ? 'خصم' : 'Remove'}
                            </button>
                          </div>
                          <input
                            type="number"
                            value={Math.abs(adjustPoints)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setAdjustPoints(adjustPoints >= 0 ? val : -val);
                            }}
                            placeholder={isArabic ? 'عدد النقاط' : 'Number of points'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                          />
                          <input
                            type="text"
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder={isArabic ? 'السبب (اختياري)' : 'Reason (optional)'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleAdjustPoints}
                              disabled={adjustPoints === 0}
                              className="flex-1 bg-pink-600 text-white py-2 rounded hover:bg-pink-700 disabled:opacity-50"
                            >
                              {isArabic ? 'تأكيد' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => {
                                setAdjustingCustomer(null);
                                setAdjustPoints(0);
                                setAdjustReason('');
                              }}
                              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                              {isArabic ? 'إلغاء' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyManagementModal;
