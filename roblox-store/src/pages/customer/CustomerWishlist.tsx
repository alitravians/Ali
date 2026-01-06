import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';

const CustomerWishlist: React.FC = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const { wishlistItems, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  if (!customer) {
    navigate('/customer/auth');
    return null;
  }

    const handleAddToCart = (item: typeof wishlistItems[0]) => {
      addToCart({
        id: item.productId,
        name_ar: item.name_ar,
        name_en: item.name_en,
        price: item.price,
        image: item.image,
        category: '',
        gamePassUrl: item.gamePassUrl
      });
    };

  return (
    <div className={`min-h-screen bg-gray-50 ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-6">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            {isArabic ? 'رجوع' : 'Back'}
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Heart size={28} />
            {isArabic ? 'قائمة الأمنيات' : 'My Wishlist'}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {isArabic ? 'قائمة الأمنيات فارغة' : 'Your wishlist is empty'}
            </h2>
            <p className="text-gray-500 mb-6">
              {isArabic 
                ? 'أضف منتجات إلى قائمة الأمنيات لتتمكن من شرائها لاحقاً'
                : 'Add products to your wishlist to buy them later'}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              {isArabic ? 'تصفح المنتجات' : 'Browse Products'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={item.image || 'https://via.placeholder.com/300x200'}
                    alt={isArabic ? item.name_ar : item.name_en}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-red-500 hover:bg-white"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {isArabic ? item.name_ar : item.name_en}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-pink-600">
                      ${item.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                    >
                      <ShoppingCart size={18} />
                      {isArabic ? 'أضف للسلة' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerWishlist;
