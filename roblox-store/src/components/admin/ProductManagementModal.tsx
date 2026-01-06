import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Search, Star, Eye, EyeOff, Save, X } from 'lucide-react';
import Modal from './Modal';
import { subscribeProducts, addProduct, updateProduct, deleteProduct, subscribeGameCategories, subscribeProductCategories } from '../../services/firebase';
import type { Product, GameCategory, ProductCategory } from '../../types';

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductManagementModal: React.FC<ProductManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGame, setFilterGame] = useState('all');
    const [gameCategories, setGameCategories] = useState<GameCategory[]>([]);
    const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
    const [editModal, setEditModal] = useState<{ isOpen: boolean; product: Product | null }>({
      isOpen: false,
      product: null
    });
        const [formData, setFormData] = useState({
          name_en: '',
          name_ar: '',
          description_en: '',
          description_ar: '',
          price: 0,
          image: '',
          category: '',
          game: '',
          stock: 100,
          isActive: true,
          isFeatured: false,
          gamePassUrl: ''
        });

    useEffect(() => {
      if (isOpen) {
        const unsubProducts = subscribeProducts(setProducts);
        const unsubGames = subscribeGameCategories((data) => {
          setGameCategories(data);
          // Set default game if available
          if (data.length > 0 && !formData.game) {
            setFormData(prev => ({ ...prev, game: data[0].key }));
          }
        });
        const unsubCategories = subscribeProductCategories((data) => {
          setProductCategories(data);
          // Set default category if available
          if (data.length > 0 && !formData.category) {
            setFormData(prev => ({ ...prev, category: data[0].key }));
          }
        });
        setLoading(false);
        return () => {
          unsubProducts();
          unsubGames();
          unsubCategories();
        };
      }
    }, [isOpen]);

    // Fallback to hardcoded values if no data in Firebase
    const games = gameCategories.length > 0 
      ? gameCategories.filter(g => g.isActive).map(g => g.key)
      : ['mm2', 'adopt_me', 'pet_sim_x'];
    const categories = productCategories.length > 0 
      ? productCategories.filter(c => c.isActive).map(c => c.key)
      : ['godly', 'chroma', 'legendary', 'sets', 'rare'];

        const openAddModal = () => {
          setFormData({
            name_en: '',
            name_ar: '',
            description_en: '',
            description_ar: '',
            price: 0,
            image: '',
            category: categories.length > 0 ? categories[0] : 'godly',
            game: games.length > 0 ? games[0] : 'mm2',
            stock: 100,
            isActive: true,
            isFeatured: false,
            gamePassUrl: ''
          });
          setEditModal({ isOpen: true, product: null });
        };

    const openEditModal = (product: Product) => {
      setFormData({
        name_en: product.name_en,
        name_ar: product.name_ar,
        description_en: product.description_en || '',
        description_ar: product.description_ar || '',
        price: product.price,
        image: product.image,
        category: product.category,
        game: product.game,
        stock: product.stock,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        gamePassUrl: product.gamePassUrl || ''
      });
      setEditModal({ isOpen: true, product });
    };

  const handleSave = async () => {
    if (!formData.name_en || !formData.name_ar || !formData.price) {
      alert(isArabic ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }

    try {
      if (editModal.product) {
        await updateProduct(editModal.product.id, formData);
        alert(isArabic ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully');
      } else {
        await addProduct({
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        alert(isArabic ? 'تمت إضافة المنتج بنجاح' : 'Product added successfully');
      }
      setEditModal({ isOpen: false, product: null });
    } catch (error) {
      console.error('Error saving product:', error);
      alert(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving product');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(isArabic ? `هل أنت متأكد من حذف ${product.name_ar}؟` : `Are you sure you want to delete ${product.name_en}?`)) {
      return;
    }

    try {
      await deleteProduct(product.id);
      alert(isArabic ? 'تم حذف المنتج بنجاح' : 'Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(isArabic ? 'حدث خطأ أثناء الحذف' : 'Error deleting product');
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
    } catch (error) {
      console.error('Error toggling product:', error);
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      await updateProduct(product.id, { isFeatured: !product.isFeatured });
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.name_ar.includes(searchQuery);
    const matchesGame = filterGame === 'all' || p.game === filterGame;
    return matchesSearch && matchesGame;
  });

    const getGameLabel = (game: string) => {
      // First check Firebase data
      const gameFromDb = gameCategories.find(g => g.key === game);
      if (gameFromDb) {
        return isArabic ? gameFromDb.name_ar : gameFromDb.name_en;
      }
      // Fallback to hardcoded labels
      const labels: Record<string, string> = {
        mm2: 'MM2',
        adopt_me: isArabic ? 'أدوبت مي' : 'Adopt Me',
        pet_sim_x: isArabic ? 'بت سيم إكس' : 'Pet Sim X'
      };
      return labels[game] || game;
    };

    const getCategoryLabel = (category: string) => {
      // First check Firebase data
      const catFromDb = productCategories.find(c => c.key === category);
      if (catFromDb) {
        return isArabic ? catFromDb.name_ar : catFromDb.name_en;
      }
      // Fallback to hardcoded labels
      const labels: Record<string, string> = {
        godly: isArabic ? 'أسطوري' : 'Godly',
        chroma: isArabic ? 'كروما' : 'Chroma',
        legendary: isArabic ? 'نادر جداً' : 'Legendary',
        sets: isArabic ? 'طقم' : 'Sets',
        rare: isArabic ? 'نادر' : 'Rare'
      };
      return labels[category] || category;
    };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isArabic ? 'إدارة المنتجات' : 'Product Management'} size="xl">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={18} />
          {isArabic ? 'إضافة منتج' : 'Add Product'}
        </button>
        
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'بحث...' : 'Search...'}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <select
          value={filterGame}
          onChange={(e) => setFilterGame(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">{isArabic ? 'جميع الألعاب' : 'All Games'}</option>
          {games.map(game => (
            <option key={game} value={game}>{getGameLabel(game)}</option>
          ))}
        </select>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isArabic ? 'لا توجد منتجات' : 'No products found'}
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {product.name_en.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800">{isArabic ? product.name_ar : product.name_en}</p>
                      {product.isFeatured && (
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      )}
                      {!product.isActive && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                          {isArabic ? 'معطل' : 'Inactive'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {getGameLabel(product.game)} • {getCategoryLabel(product.category)} • ${product.price}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFeatured(product)}
                    className={`p-2 rounded-lg transition-colors ${
                      product.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                    }`}
                    title={isArabic ? 'مميز' : 'Featured'}
                  >
                    <Star size={18} />
                  </button>
                  <button
                    onClick={() => toggleActive(product)}
                    className={`p-2 rounded-lg transition-colors ${
                      product.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}
                    title={product.isActive ? (isArabic ? 'تعطيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                  >
                    {product.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit/Add Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditModal({ isOpen: false, product: null })} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                {editModal.product ? (isArabic ? 'تعديل المنتج' : 'Edit Product') : (isArabic ? 'إضافة منتج جديد' : 'Add New Product')}
              </h4>
              <button onClick={() => setEditModal({ isOpen: false, product: null })}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'الاسم (إنجليزي)' : 'Name (English)'} *
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'الاسم (عربي)' : 'Name (Arabic)'} *
                </label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'الوصف (إنجليزي)' : 'Description (English)'}
                </label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={2}
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'السعر ($)' : 'Price ($)'} *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'المخزون' : 'Stock'}
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'اللعبة' : 'Game'}
                </label>
                <select
                  value={formData.game}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {games.map(game => (
                    <option key={game} value={game}>{getGameLabel(game)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isArabic ? 'الفئة' : 'Category'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {isArabic ? 'رابط الصورة' : 'Image URL'}
                              </label>
                              <input
                                type="url"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="https://..."
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {isArabic ? 'رابط Game Pass (للدفع)' : 'Game Pass URL (for payment)'}
                              </label>
                              <input
                                type="url"
                                value={formData.gamePassUrl}
                                onChange={(e) => setFormData({ ...formData, gamePassUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="https://www.roblox.com/game-pass/..."
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {isArabic ? 'رابط Game Pass الذي سيستخدمه العميل للدفع' : 'The Game Pass URL customers will use for payment'}
                              </p>
                            </div>
                            <div className="col-span-2 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{isArabic ? 'نشط' : 'Active'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{isArabic ? 'مميز' : 'Featured'}</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModal({ isOpen: false, product: null })}
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

export default ProductManagementModal;
