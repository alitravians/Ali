import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Edit2, Trash2, Tag, Percent, DollarSign, Calendar, Hash } from 'lucide-react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../../firebase/config';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  description_ar: string;
  description_en: string;
}

interface CouponManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CouponManagementModal: React.FC<CouponManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrderAmount: 0,
    maxUses: 0,
    expiresAt: '',
    isActive: true,
    description_ar: '',
    description_en: ''
  });

  useEffect(() => {
    const couponsRef = ref(database, 'coupons');
    const unsubscribe = onValue(couponsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const couponsList = Object.entries(data).map(([id, coupon]) => ({
          id,
          ...(coupon as Omit<Coupon, 'id'>)
        }));
        couponsList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setCoupons(couponsList);
      } else {
        setCoupons([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      minOrderAmount: 0,
      maxUses: 0,
      expiresAt: '',
      isActive: true,
      description_ar: '',
      description_en: ''
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt.split('T')[0],
      isActive: coupon.isActive,
      description_ar: coupon.description_ar,
      description_en: coupon.description_en
    });
    setEditingCoupon(coupon);
    setShowForm(true);
  };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setSaveError(null);

      try {
        // Validate value
        const numValue = Number(formData.value);
        if (!Number.isFinite(numValue) || numValue <= 0) {
          setSaveError(isArabic ? 'قيمة الخصم يجب أن تكون رقم أكبر من صفر' : 'Discount value must be a number greater than zero');
          setSaving(false);
          return;
        }

        const couponData = {
          ...formData,
          code: formData.code.toUpperCase(),
          value: numValue,
          minOrderAmount: Number(formData.minOrderAmount) || 0,
          maxUses: Number(formData.maxUses) || 0,
          expiresAt: new Date(formData.expiresAt).toISOString()
        };

        if (editingCoupon) {
          await update(ref(database, `coupons/${editingCoupon.id}`), couponData);
        } else {
          await push(ref(database, 'coupons'), {
            ...couponData,
            usedCount: 0,
            createdAt: new Date().toISOString()
          });
        }

        resetForm();
        setShowForm(false);
      } catch (error) {
        console.error('Error saving coupon:', error);
        setSaveError(isArabic ? 'حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى' : 'Error saving coupon, please try again');
      }
      setSaving(false);
    };

  const handleDelete = async (couponId: string) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا الكوبون؟' : 'Are you sure you want to delete this coupon?')) {
      try {
        await remove(ref(database, `coupons/${couponId}`));
      } catch (error) {
        console.error('Error deleting coupon:', error);
      }
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await update(ref(database, `coupons/${coupon.id}`), {
        isActive: !coupon.isActive
      });
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag size={24} />
            {isArabic ? 'إدارة الكوبونات' : 'Coupon Management'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Add Button */}
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="mb-6 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              {isArabic ? 'إضافة كوبون جديد' : 'Add New Coupon'}
            </button>
          )}

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingCoupon 
                  ? (isArabic ? 'تعديل الكوبون' : 'Edit Coupon')
                  : (isArabic ? 'إضافة كوبون جديد' : 'Add New Coupon')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'كود الخصم' : 'Coupon Code'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="SAVE20"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <Hash size={20} />
                    </button>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'نوع الخصم' : 'Discount Type'}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="percentage">{isArabic ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
                    <option value="fixed">{isArabic ? 'مبلغ ثابت ($)' : 'Fixed Amount ($)'}</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'قيمة الخصم' : 'Discount Value'}
                  </label>
                  <div className="relative">
                    {formData.type === 'percentage' ? (
                      <Percent size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isArabic ? 'left-3' : 'right-3'}`} />
                    ) : (
                      <DollarSign size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isArabic ? 'right-3' : 'left-3'}`} />
                    )}
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      required
                      min="0"
                      max={formData.type === 'percentage' ? 100 : undefined}
                      className={`w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 ${formData.type === 'fixed' ? (isArabic ? 'pr-8 pl-3' : 'pl-8 pr-3') : 'px-3'}`}
                    />
                  </div>
                </div>

                {/* Min Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الحد الأدنى للطلب ($)' : 'Minimum Order ($)'}
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الحد الأقصى للاستخدام (0 = غير محدود)' : 'Max Uses (0 = unlimited)'}
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                                {/* Expiry Date */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {isArabic ? 'تاريخ الانتهاء' : 'Expiry Date'}
                                  </label>
                                  <input
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    required
                                    min={editingCoupon ? undefined : new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                  />
                                  {editingCoupon && formData.expiresAt && new Date(formData.expiresAt) < new Date(new Date().toISOString().split('T')[0]) && (
                                    <p className="text-xs text-amber-600 mt-1">
                                      {isArabic ? '⚠️ هذا الكوبون منتهي الصلاحية' : '⚠️ This coupon has expired'}
                                    </p>
                                  )}
                                </div>

                {/* Description AR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الوصف (عربي)' : 'Description (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="خصم 20% على جميع المنتجات"
                  />
                </div>

                {/* Description EN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الوصف (إنجليزي)' : 'Description (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="20% off all products"
                  />
                </div>

                {/* Active */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    {isArabic ? 'مفعّل' : 'Active'}
                  </label>
                </div>
              </div>

                          {/* Error Message */}
                          {saveError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
                              {saveError}
                            </div>
                          )}

                          {/* Form Actions */}
                          <div className="flex gap-3 mt-6">
                            <button
                              type="submit"
                              disabled={saving}
                              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {saving 
                                ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                                : (isArabic ? 'حفظ' : 'Save')}
                            </button>
                            <button
                              type="button"
                              onClick={() => { resetForm(); setShowForm(false); setSaveError(null); }}
                              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              {isArabic ? 'إلغاء' : 'Cancel'}
                            </button>
                          </div>
                        </form>
          )}

          {/* Coupons List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tag size={48} className="mx-auto mb-4 opacity-50" />
              <p>{isArabic ? 'لا توجد كوبونات' : 'No coupons yet'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`bg-white border rounded-lg p-4 ${coupon.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {coupon.code}
                      </div>
                      <div>
                        <p className="font-medium">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                          {' '}
                          {isArabic ? 'خصم' : 'off'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isArabic ? coupon.description_ar : coupon.description_en}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {coupon.usedCount}/{coupon.maxUses || '∞'}
                      </span>
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`px-3 py-1 rounded text-sm ${coupon.isActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                      >
                        {coupon.isActive 
                          ? (isArabic ? 'تعطيل' : 'Disable')
                          : (isArabic ? 'تفعيل' : 'Enable')}
                      </button>
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {isArabic ? 'ينتهي: ' : 'Expires: '}
                      {new Date(coupon.expiresAt).toLocaleDateString()}
                    </span>
                    {coupon.minOrderAmount > 0 && (
                      <span>
                        {isArabic ? `الحد الأدنى: $${coupon.minOrderAmount}` : `Min: $${coupon.minOrderAmount}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponManagementModal;
