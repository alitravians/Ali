import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Plus, Trash2, Edit, Save, X, Percent, DollarSign, Calendar, Copy } from 'lucide-react';
import Modal from './Modal';
import { subscribeCoupons, addCoupon, updateCoupon, deleteCoupon } from '../../services/firebase';
import type { Coupon } from '../../types';

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MarketingModal: React.FC<MarketingModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; coupon: Coupon | null }>({
    isOpen: false,
    coupon: null
  });
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minOrderAmount: 0,
    maxUses: 0,
    expiresAt: '',
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeCoupons(setCoupons);
      setLoading(false);
      return () => unsubscribe();
    }
  }, [isOpen]);

  const openAddModal = () => {
    setFormData({
      code: generateCouponCode(),
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxUses: 0,
      expiresAt: '',
      isActive: true
    });
    setEditModal({ isOpen: true, coupon: null });
  };

  const openEditModal = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxUses: coupon.maxUses || 0,
      expiresAt: coupon.expiresAt || '',
      isActive: coupon.isActive
    });
    setEditModal({ isOpen: true, coupon });
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSave = async () => {
    if (!formData.code || formData.discountValue <= 0) {
      alert(isArabic ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }

    try {
      if (editModal.coupon) {
        await updateCoupon(editModal.coupon.id, formData);
        alert(isArabic ? 'تم تحديث الكوبون بنجاح' : 'Coupon updated successfully');
      } else {
        await addCoupon({
          ...formData,
          usedCount: 0,
          createdAt: new Date().toISOString()
        });
        alert(isArabic ? 'تمت إضافة الكوبون بنجاح' : 'Coupon added successfully');
      }
      setEditModal({ isOpen: false, coupon: null });
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving coupon');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(isArabic ? `هل أنت متأكد من حذف الكوبون ${coupon.code}؟` : `Are you sure you want to delete coupon ${coupon.code}?`)) {
      return;
    }

    try {
      await deleteCoupon(coupon.id);
      alert(isArabic ? 'تم حذف الكوبون بنجاح' : 'Coupon deleted successfully');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert(isArabic ? 'حدث خطأ أثناء الحذف' : 'Error deleting coupon');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(isArabic ? 'تم نسخ الكود' : 'Code copied');
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isArabic ? 'التسويق والعروض' : 'Marketing & Promotions'} size="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Tag size={20} />
          {isArabic ? 'كوبونات الخصم' : 'Discount Coupons'}
        </h4>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={18} />
          {isArabic ? 'إضافة كوبون' : 'Add Coupon'}
        </button>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isArabic ? 'لا توجد كوبونات' : 'No coupons found'}
            </div>
          ) : (
            coupons.map(coupon => (
              <div key={coupon.id} className={`p-4 rounded-lg border-2 ${
                !coupon.isActive || isExpired(coupon.expiresAt) 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <code className="px-3 py-1 bg-white rounded font-bold text-purple-600 border">
                      {coupon.code}
                    </code>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="p-1 text-gray-400 hover:text-purple-600"
                    >
                      <Copy size={16} />
                    </button>
                    {!coupon.isActive && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                        {isArabic ? 'معطل' : 'Inactive'}
                      </span>
                    )}
                    {isExpired(coupon.expiresAt) && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                        {isArabic ? 'منتهي' : 'Expired'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(coupon)}
                      className={`px-3 py-1 rounded text-sm ${
                        coupon.isActive 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {coupon.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Inactive')}
                    </button>
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    {coupon.discountType === 'percentage' ? <Percent size={14} /> : <DollarSign size={14} />}
                    {coupon.discountType === 'percentage' 
                      ? `${coupon.discountValue}%` 
                      : `$${coupon.discountValue}`
                    } {isArabic ? 'خصم' : 'off'}
                  </span>
                  {coupon.minOrderAmount && coupon.minOrderAmount > 0 && (
                    <span>{isArabic ? 'الحد الأدنى:' : 'Min:'} ${coupon.minOrderAmount}</span>
                  )}
                  {coupon.maxUses && coupon.maxUses > 0 && (
                    <span>{coupon.usedCount}/{coupon.maxUses} {isArabic ? 'استخدام' : 'uses'}</span>
                  )}
                  {coupon.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(coupon.expiresAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit/Add Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditModal({ isOpen: false, coupon: null })} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                {editModal.coupon ? (isArabic ? 'تعديل الكوبون' : 'Edit Coupon') : (isArabic ? 'إضافة كوبون جديد' : 'Add New Coupon')}
              </h4>
              <button onClick={() => setEditModal({ isOpen: false, coupon: null })}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'كود الكوبون' : 'Coupon Code'} *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                  <button
                    onClick={() => setFormData({ ...formData, code: generateCouponCode() })}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                  >
                    {isArabic ? 'توليد' : 'Generate'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'نوع الخصم' : 'Discount Type'}
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="percentage">{isArabic ? 'نسبة مئوية' : 'Percentage'}</option>
                    <option value="fixed">{isArabic ? 'مبلغ ثابت' : 'Fixed Amount'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'قيمة الخصم' : 'Discount Value'} *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الحد الأدنى للطلب' : 'Min Order Amount'}
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                    placeholder="0 = no limit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الحد الأقصى للاستخدام' : 'Max Uses'}
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                    placeholder="0 = unlimited"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'تاريخ الانتهاء' : 'Expiry Date'}
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{isArabic ? 'نشط' : 'Active'}</span>
              </label>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModal({ isOpen: false, coupon: null })}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save size={18} />
                {isArabic ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MarketingModal;
