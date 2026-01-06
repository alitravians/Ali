import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Star, Zap, Shield, Clock, X } from 'lucide-react';
import ProductCard from '../../components/ui/ProductCard';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  image: string;
  category: string;
  featured?: boolean;
}

interface BannerSettings {
  bannerEnabled: boolean;
  bannerText_ar: string;
  bannerText_en: string;
  bannerLink: string;
  bannerColor: string;
}

interface ProductCategory {
  id: string;
  name_ar: string;
  name_en: string;
  icon?: string;
  color?: string;
}

const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [banner, setBanner] = useState<BannerSettings | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // Load banner settings from Firebase
    const settingsRef = ref(database, 'siteSettings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.bannerEnabled) {
          setBanner({
            bannerEnabled: data.bannerEnabled,
            bannerText_ar: data.bannerText_ar || '',
            bannerText_en: data.bannerText_en || '',
            bannerLink: data.bannerLink || '',
            bannerColor: data.bannerColor || '#8B5CF6'
          });
        } else {
          setBanner(null);
        }
      }
    });

    // Load featured products from Firebase
    const productsRef = ref(database, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Get featured products or first 4 products
        const featured = productList.filter(p => p.featured).slice(0, 4);
        setFeaturedProducts(featured.length > 0 ? featured : productList.slice(0, 4));
      } else {
        setFeaturedProducts([]);
      }
    });

    // Load categories from Firebase
    const categoriesRef = ref(database, 'productCategories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const categoryList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setCategories(categoryList);
      } else {
        setCategories([]);
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      {banner && banner.bannerEnabled && showBanner && (
        <div 
          className="relative py-3 px-4 text-center text-white font-medium"
          style={{ backgroundColor: banner.bannerColor }}
        >
          {banner.bannerLink ? (
            <a 
              href={banner.bannerLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {i18n.language === 'ar' ? banner.bannerText_ar : banner.bannerText_en}
            </a>
          ) : (
            <span>{i18n.language === 'ar' ? banner.bannerText_ar : banner.bannerText_en}</span>
          )}
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white"
            aria-label="Close banner"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('store.name')}
            </h1>
            <p className="text-xl md:text-2xl text-purple-200 mb-8">
              {t('store.tagline')}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold px-8 py-4 rounded-full text-lg hover:from-yellow-300 hover:to-orange-400 transition-all transform hover:scale-105"
            >
              {t('store.products')}
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="text-purple-600" size={32} />
              </div>
              <h3 className="font-bold text-gray-800">{t('footer.delivery')}</h3>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="text-green-600" size={32} />
              </div>
              <h3 className="font-bold text-gray-800">{t('footer.secure')}</h3>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="text-blue-600" size={32} />
              </div>
              <h3 className="font-bold text-gray-800">{t('footer.support')}</h3>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Star className="text-yellow-600" size={32} />
              </div>
              <h3 className="font-bold text-gray-800">100K+ {i18n.language === 'ar' ? 'عميل' : 'Customers'}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              {i18n.language === 'ar' ? '🔥 الأكثر مبيعاً' : '🔥 Best Sellers'}
            </h2>
            <Link
              to="/products"
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              {i18n.language === 'ar' ? 'عرض الكل' : 'View All'}
              <ArrowRight size={18} />
            </Link>
          </div>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {i18n.language === 'ar' ? 'لا توجد منتجات حالياً' : 'No products available'}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              {i18n.language === 'ar' ? '🎮 التصنيفات' : '🎮 Categories'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className={`bg-gradient-to-br ${cat.color || 'from-purple-500 to-indigo-500'} text-white p-6 rounded-xl text-center transform transition-all hover:scale-105 hover:shadow-lg`}
                >
                  <span className="text-4xl mb-2 block">{cat.icon || '📦'}</span>
                  <span className="font-bold text-lg">{i18n.language === 'ar' ? cat.name_ar : cat.name_en}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default HomePage;
