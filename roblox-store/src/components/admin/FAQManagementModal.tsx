import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Edit2, Trash2, HelpCircle } from 'lucide-react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../../firebase/config';

interface FAQItem {
  id: string;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  category: string;
  order: number;
}

interface FAQManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQManagementModal: React.FC<FAQManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [saving, setSaving] = useState(false);

  const categories = [
    { id: 'orders', label_ar: 'الطلبات', label_en: 'Orders' },
    { id: 'payment', label_ar: 'الدفع', label_en: 'Payment' },
    { id: 'delivery', label_ar: 'التسليم', label_en: 'Delivery' },
    { id: 'account', label_ar: 'الحساب', label_en: 'Account' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' }
  ];

  const [formData, setFormData] = useState({
    question_ar: '',
    question_en: '',
    answer_ar: '',
    answer_en: '',
    category: 'other',
    order: 0
  });

  useEffect(() => {
    const faqRef = ref(database, 'faqs');
    const unsubscribe = onValue(faqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const faqList = Object.entries(data).map(([id, faq]) => ({
          id,
          ...(faq as Omit<FAQItem, 'id'>)
        }));
        faqList.sort((a, b) => (a.order || 0) - (b.order || 0));
        setFaqs(faqList);
      } else {
        setFaqs([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      question_ar: '',
      question_en: '',
      answer_ar: '',
      answer_en: '',
      category: 'other',
      order: faqs.length
    });
    setEditingFaq(null);
  };

  const handleEdit = (faq: FAQItem) => {
    setFormData({
      question_ar: faq.question_ar,
      question_en: faq.question_en,
      answer_ar: faq.answer_ar,
      answer_en: faq.answer_en,
      category: faq.category,
      order: faq.order
    });
    setEditingFaq(faq);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingFaq) {
        await update(ref(database, `faqs/${editingFaq.id}`), formData);
      } else {
        await push(ref(database, 'faqs'), {
          ...formData,
          order: faqs.length
        });
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving FAQ:', error);
    }
    setSaving(false);
  };

  const handleDelete = async (faqId: string) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا السؤال؟' : 'Are you sure you want to delete this FAQ?')) {
      try {
        await remove(ref(database, `faqs/${faqId}`));
      } catch (error) {
        console.error('Error deleting FAQ:', error);
      }
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newFaqs = [...faqs];
    [newFaqs[index - 1], newFaqs[index]] = [newFaqs[index], newFaqs[index - 1]];
    
    try {
      await update(ref(database, `faqs/${newFaqs[index].id}`), { order: index });
      await update(ref(database, `faqs/${newFaqs[index - 1].id}`), { order: index - 1 });
    } catch (error) {
      console.error('Error reordering FAQs:', error);
    }
  };

  const moveDown = async (index: number) => {
    if (index === faqs.length - 1) return;
    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
    
    try {
      await update(ref(database, `faqs/${newFaqs[index].id}`), { order: index });
      await update(ref(database, `faqs/${newFaqs[index + 1].id}`), { order: index + 1 });
    } catch (error) {
      console.error('Error reordering FAQs:', error);
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? (isArabic ? category.label_ar : category.label_en) : categoryId;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle size={24} />
            {isArabic ? 'إدارة الأسئلة الشائعة' : 'FAQ Management'}
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
              className="mb-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              {isArabic ? 'إضافة سؤال جديد' : 'Add New FAQ'}
            </button>
          )}

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingFaq 
                  ? (isArabic ? 'تعديل السؤال' : 'Edit FAQ')
                  : (isArabic ? 'إضافة سؤال جديد' : 'Add New FAQ')}
              </h3>

              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {isArabic ? cat.label_ar : cat.label_en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question AR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'السؤال (عربي)' : 'Question (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={formData.question_ar}
                    onChange={(e) => setFormData({ ...formData, question_ar: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="كيف أجد رقم حسابي في روبلوكس؟"
                  />
                </div>

                {/* Question EN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'السؤال (إنجليزي)' : 'Question (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.question_en}
                    onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="How do I find my Roblox account ID?"
                  />
                </div>

                {/* Answer AR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الإجابة (عربي)' : 'Answer (Arabic)'}
                  </label>
                  <textarea
                    value={formData.answer_ar}
                    onChange={(e) => setFormData({ ...formData, answer_ar: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="يمكنك إيجاد رقم حسابك من خلال..."
                  />
                </div>

                {/* Answer EN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الإجابة (إنجليزي)' : 'Answer (English)'}
                  </label>
                  <textarea
                    value={formData.answer_en}
                    onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="You can find your account ID by..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving 
                    ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                    : (isArabic ? 'حفظ' : 'Save')}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          )}

          {/* FAQ List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>{isArabic ? 'لا توجد أسئلة شائعة' : 'No FAQs yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === faqs.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {getCategoryLabel(faq.category)}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-800">
                        {isArabic ? faq.question_ar : faq.question_en}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {isArabic ? faq.answer_ar : faq.answer_en}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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

export default FAQManagementModal;
