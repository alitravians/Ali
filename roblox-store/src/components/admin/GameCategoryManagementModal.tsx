import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Edit2, Trash2, Gamepad2, Save } from 'lucide-react';
import type { GameCategory, ProductCategory } from '../../types';
import {
  subscribeGameCategories,
  addGameCategory,
  updateGameCategory,
  deleteGameCategory,
  subscribeProductCategories,
  addProductCategory,
  updateProductCategory,
  deleteProductCategory
} from '../../services/firebase';

interface GameCategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameCategoryManagementModal: React.FC<GameCategoryManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<'games' | 'categories'>('games');
  const [games, setGames] = useState<GameCategory[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    type: 'game' | 'category';
    item: GameCategory | ProductCategory | null;
  }>({ isOpen: false, type: 'game', item: null });

  const [formData, setFormData] = useState({
    key: '',
    name_en: '',
    name_ar: '',
    isActive: true
  });

  useEffect(() => {
    if (!isOpen) return;

    const unsubGames = subscribeGameCategories((data) => {
      setGames(data);
      setLoading(false);
    });

    const unsubCategories = subscribeProductCategories((data) => {
      setCategories(data);
    });

    return () => {
      unsubGames();
      unsubCategories();
    };
  }, [isOpen]);

  const openAddModal = (type: 'game' | 'category') => {
    setFormData({
      key: '',
      name_en: '',
      name_ar: '',
      isActive: true
    });
    setEditModal({ isOpen: true, type, item: null });
  };

  const openEditModal = (type: 'game' | 'category', item: GameCategory | ProductCategory) => {
    setFormData({
      key: item.key,
      name_en: item.name_en,
      name_ar: item.name_ar,
      isActive: item.isActive
    });
    setEditModal({ isOpen: true, type, item });
  };

  const handleSave = async () => {
    if (!formData.key || !formData.name_en || !formData.name_ar) {
      alert(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      if (editModal.type === 'game') {
        if (editModal.item) {
          await updateGameCategory(editModal.item.id, formData);
          alert(isArabic ? 'تم تحديث اللعبة بنجاح' : 'Game updated successfully');
        } else {
          await addGameCategory({
            ...formData,
            createdAt: new Date().toISOString()
          });
          alert(isArabic ? 'تمت إضافة اللعبة بنجاح' : 'Game added successfully');
        }
      } else {
        if (editModal.item) {
          await updateProductCategory(editModal.item.id, formData);
          alert(isArabic ? 'تم تحديث الفئة بنجاح' : 'Category updated successfully');
        } else {
          await addProductCategory({
            ...formData,
            createdAt: new Date().toISOString()
          });
          alert(isArabic ? 'تمت إضافة الفئة بنجاح' : 'Category added successfully');
        }
      }
      setEditModal({ isOpen: false, type: 'game', item: null });
    } catch (error) {
      console.error('Error saving:', error);
      alert(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving');
    }
  };

  const handleDelete = async (type: 'game' | 'category', id: string) => {
    const confirmMsg = type === 'game'
      ? (isArabic ? 'هل أنت متأكد من حذف هذه اللعبة؟' : 'Are you sure you want to delete this game?')
      : (isArabic ? 'هل أنت متأكد من حذف هذه الفئة؟' : 'Are you sure you want to delete this category?');

    if (!confirm(confirmMsg)) return;

    try {
      if (type === 'game') {
        await deleteGameCategory(id);
        alert(isArabic ? 'تم حذف اللعبة بنجاح' : 'Game deleted successfully');
      } else {
        await deleteProductCategory(id);
        alert(isArabic ? 'تم حذف الفئة بنجاح' : 'Category deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert(isArabic ? 'حدث خطأ أثناء الحذف' : 'Error deleting');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8" />
            <h2 className="text-2xl font-bold">
              {isArabic ? 'إدارة الألعاب والفئات' : 'Games & Categories Management'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'games'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isArabic ? 'الألعاب' : 'Games'}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isArabic ? 'الفئات' : 'Categories'}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Add Button */}
          <button
            onClick={() => openAddModal(activeTab === 'games' ? 'game' : 'category')}
            className="mb-4 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'games'
              ? (isArabic ? 'إضافة لعبة جديدة' : 'Add New Game')
              : (isArabic ? 'إضافة فئة جديدة' : 'Add New Category')
            }
          </button>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'games' ? (
                games.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {isArabic ? 'لا توجد ألعاب. أضف لعبة جديدة للبدء.' : 'No games found. Add a new game to get started.'}
                  </p>
                ) : (
                  games.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div>
                        <h3 className="font-semibold text-lg">
                          {isArabic ? game.name_ar : game.name_en}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {isArabic ? `المفتاح: ${game.key}` : `Key: ${game.key}`}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          game.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {game.isActive
                            ? (isArabic ? 'نشط' : 'Active')
                            : (isArabic ? 'غير نشط' : 'Inactive')
                          }
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal('game', game)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title={isArabic ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete('game', game.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title={isArabic ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                categories.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {isArabic ? 'لا توجد فئات. أضف فئة جديدة للبدء.' : 'No categories found. Add a new category to get started.'}
                  </p>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div>
                        <h3 className="font-semibold text-lg">
                          {isArabic ? category.name_ar : category.name_en}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {isArabic ? `المفتاح: ${category.key}` : `Key: ${category.key}`}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          category.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {category.isActive
                            ? (isArabic ? 'نشط' : 'Active')
                            : (isArabic ? 'غير نشط' : 'Inactive')
                          }
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal('category', category)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title={isArabic ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete('category', category.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title={isArabic ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          )}
        </div>

                {/* Edit/Add Modal */}
                {editModal.isOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" dir={isArabic ? 'rtl' : 'ltr'}>
              <h3 className="text-xl font-bold mb-4">
                {editModal.item
                  ? (editModal.type === 'game'
                    ? (isArabic ? 'تعديل اللعبة' : 'Edit Game')
                    : (isArabic ? 'تعديل الفئة' : 'Edit Category'))
                  : (editModal.type === 'game'
                    ? (isArabic ? 'إضافة لعبة جديدة' : 'Add New Game')
                    : (isArabic ? 'إضافة فئة جديدة' : 'Add New Category'))
                }
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'المفتاح (بالإنجليزية)' : 'Key (English)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="mm2"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الاسم (بالإنجليزية)' : 'Name (English)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Murder Mystery 2"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isArabic ? 'الاسم (بالعربية)' : 'Name (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="مردر ميستري 2"
                    dir="rtl"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    {isArabic ? 'نشط' : 'Active'}
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {isArabic ? 'حفظ' : 'Save'}
                </button>
                <button
                  onClick={() => setEditModal({ isOpen: false, type: 'game', item: null })}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition-colors"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCategoryManagementModal;
