import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Image, Save, Power, PowerOff, CreditCard } from 'lucide-react';
import Modal from './Modal';
import { getSiteSettings, updateSiteSettings } from '../../services/firebase';
import type { SiteSettings } from '../../types';

interface SiteManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SiteManagementModal: React.FC<SiteManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
    const [settings, setSettings] = useState<SiteSettings>({
      siteName_en: 'Roblox Assets Store',
      siteName_ar: 'متجر أصول روبلوكس',
      developerName: '',
      isOpen: true,
      closureMessage_en: 'The store is currently closed for maintenance.',
      closureMessage_ar: 'المتجر مغلق حالياً للصيانة.',
      bannerEnabled: false,
      bannerText_en: '',
      bannerText_ar: '',
      bannerLink: '',
      bannerColor: '#8B5CF6',
      paypalEnabled: false,
      paypalBusinessName: '',
      paypalBusinessEmail: '',
      paypalCurrency: 'USD'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'status' | 'banner' | 'branding' | 'paypal'>('status');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSiteSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteSettings(settings);
      alert(isArabic ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
    }
    setSaving(false);
  };

    const tabs = [
      { id: 'status', label: isArabic ? 'حالة الموقع' : 'Site Status', icon: Power },
      { id: 'banner', label: isArabic ? 'البنر' : 'Banner', icon: Image },
      { id: 'branding', label: isArabic ? 'العلامة التجارية' : 'Branding', icon: Globe },
      { id: 'paypal', label: isArabic ? 'PayPal' : 'PayPal', icon: CreditCard },
    ];

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={isArabic ? 'إدارة الموقع' : 'Site Management'} size="lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isArabic ? 'إدارة الموقع' : 'Site Management'} size="lg">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Site Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-bold text-gray-800">
                {isArabic ? 'حالة الموقع' : 'Site Status'}
              </h4>
              <p className="text-sm text-gray-500">
                {settings.isOpen 
                  ? (isArabic ? 'الموقع مفتوح للزوار' : 'Site is open to visitors')
                  : (isArabic ? 'الموقع مغلق' : 'Site is closed')
                }
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, isOpen: !settings.isOpen })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                settings.isOpen
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {settings.isOpen ? <Power size={18} /> : <PowerOff size={18} />}
              {settings.isOpen 
                ? (isArabic ? 'مفتوح' : 'Open')
                : (isArabic ? 'مغلق' : 'Closed')
              }
            </button>
          </div>

          {!settings.isOpen && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'رسالة الإغلاق (عربي)' : 'Closure Message (Arabic)'}
                </label>
                <textarea
                  value={settings.closureMessage_ar}
                  onChange={(e) => setSettings({ ...settings, closureMessage_ar: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'رسالة الإغلاق (إنجليزي)' : 'Closure Message (English)'}
                </label>
                <textarea
                  value={settings.closureMessage_en}
                  onChange={(e) => setSettings({ ...settings, closureMessage_en: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Banner Tab */}
      {activeTab === 'banner' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-bold text-gray-800">
                {isArabic ? 'تفعيل البنر' : 'Enable Banner'}
              </h4>
              <p className="text-sm text-gray-500">
                {isArabic ? 'عرض بنر في أعلى الصفحة الرئيسية' : 'Show banner at top of homepage'}
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, bannerEnabled: !settings.bannerEnabled })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                settings.bannerEnabled
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {settings.bannerEnabled 
                ? (isArabic ? 'مفعل' : 'Enabled')
                : (isArabic ? 'معطل' : 'Disabled')
              }
            </button>
          </div>

          {settings.bannerEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'نص البنر (عربي)' : 'Banner Text (Arabic)'}
                </label>
                <input
                  type="text"
                  value={settings.bannerText_ar}
                  onChange={(e) => setSettings({ ...settings, bannerText_ar: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'نص البنر (إنجليزي)' : 'Banner Text (English)'}
                </label>
                <input
                  type="text"
                  value={settings.bannerText_en}
                  onChange={(e) => setSettings({ ...settings, bannerText_en: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'رابط البنر' : 'Banner Link'}
                </label>
                <input
                  type="url"
                  value={settings.bannerLink}
                  onChange={(e) => setSettings({ ...settings, bannerLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'لون البنر' : 'Banner Color'}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={settings.bannerColor}
                    onChange={(e) => setSettings({ ...settings, bannerColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.bannerColor}
                    onChange={(e) => setSettings({ ...settings, bannerColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Banner Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'معاينة البنر' : 'Banner Preview'}
                </label>
                <div 
                  className="p-3 rounded-lg text-white text-center font-medium"
                  style={{ backgroundColor: settings.bannerColor }}
                >
                  {isArabic ? settings.bannerText_ar : settings.bannerText_en || (isArabic ? 'نص البنر هنا' : 'Banner text here')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isArabic ? 'اسم الموقع (عربي)' : 'Site Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={settings.siteName_ar}
                    onChange={(e) => setSettings({ ...settings, siteName_ar: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isArabic ? 'اسم الموقع (إنجليزي)' : 'Site Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={settings.siteName_en}
                    onChange={(e) => setSettings({ ...settings, siteName_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isArabic ? 'اسم المطور (يظهر في أسفل الصفحة)' : 'Developer Name (shown in footer)'}
                  </label>
                  <input
                    type="text"
                    value={settings.developerName}
                    onChange={(e) => setSettings({ ...settings, developerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder={isArabic ? 'اسم المطور' : 'Developer name'}
                  />
                </div>
              </div>
            )}

            {/* PayPal Tab */}
            {activeTab === 'paypal' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {isArabic ? 'تفعيل الدفع بـ PayPal' : 'Enable PayPal Payment'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {isArabic ? 'السماح للعملاء بالدفع عبر PayPal' : 'Allow customers to pay via PayPal'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, paypalEnabled: !settings.paypalEnabled })}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      settings.paypalEnabled
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {settings.paypalEnabled 
                      ? (isArabic ? 'مفعل' : 'Enabled')
                      : (isArabic ? 'معطل' : 'Disabled')
                    }
                  </button>
                </div>

                {settings.paypalEnabled && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        {isArabic 
                          ? '💡 أدخل بيانات حساب PayPal Business الخاص بك لاستقبال المدفوعات' 
                          : '💡 Enter your PayPal Business account details to receive payments'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isArabic ? 'اسم النشاط التجاري' : 'Business Name'}
                      </label>
                      <input
                        type="text"
                        value={settings.paypalBusinessName || ''}
                        onChange={(e) => setSettings({ ...settings, paypalBusinessName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder={isArabic ? 'اسم متجرك أو شركتك' : 'Your store or company name'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isArabic ? 'البريد الإلكتروني لـ PayPal' : 'PayPal Email'}
                      </label>
                      <input
                        type="email"
                        value={settings.paypalBusinessEmail || ''}
                        onChange={(e) => setSettings({ ...settings, paypalBusinessEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="business@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isArabic ? 'العملة' : 'Currency'}
                      </label>
                      <select
                        value={settings.paypalCurrency || 'USD'}
                        onChange={(e) => setSettings({ ...settings, paypalCurrency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="SAR">SAR - Saudi Riyal</option>
                        <option value="AED">AED - UAE Dirham</option>
                        <option value="KWD">KWD - Kuwaiti Dinar</option>
                        <option value="QAR">QAR - Qatari Riyal</option>
                        <option value="BHD">BHD - Bahraini Dinar</option>
                        <option value="OMR">OMR - Omani Rial</option>
                      </select>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        {isArabic 
                          ? '⚠️ تأكد من أن حساب PayPal الخاص بك هو حساب Business وليس حساب شخصي' 
                          : '⚠️ Make sure your PayPal account is a Business account, not a personal account'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
      <div className="mt-6 pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400"
        >
          <Save size={18} />
          {saving 
            ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
            : (isArabic ? 'حفظ التغييرات' : 'Save Changes')
          }
        </button>
      </div>
    </Modal>
  );
};

export default SiteManagementModal;
