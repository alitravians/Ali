import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter } from 'lucide-react';
import ProductCard from '../../components/ui/ProductCard';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';
import { subscribeGameCategories, subscribeProductCategories } from '../../services/firebase';
import type { GameCategory, ProductCategory } from '../../types';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  image: string;
  category: string;
  game: string;
  inStock: boolean;
}


const ProductsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedGame, setSelectedGame] = useState('all');
  const [gameCategories, setGameCategories] = useState<GameCategory[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    // Load products from Firebase
    const productsRef = ref(database, 'products');
    const unsubProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setProducts(productList);
      }
    }, (error) => {
      console.log('Error loading products:', error.message);
    });

    // Load game categories from Firebase
    const unsubGames = subscribeGameCategories((data) => {
      setGameCategories(data.filter(g => g.isActive));
    });

    // Load product categories from Firebase
    const unsubCategories = subscribeProductCategories((data) => {
      setProductCategories(data.filter(c => c.isActive));
    });

    return () => {
      unsubProducts();
      unsubGames();
      unsubCategories();
    };
  }, []);

  // Build games array from Firebase data
  const games = [
    { key: 'all', label_en: 'All Games', label_ar: 'كل الألعاب' },
    ...gameCategories.map(g => ({ key: g.key, label_en: g.name_en, label_ar: g.name_ar }))
  ];

  // Build categories array from Firebase data
  const categories = [
    { key: 'all', label_en: 'All', label_ar: 'الكل' },
    ...productCategories.map(c => ({ key: c.key, label_en: c.name_en, label_ar: c.name_ar }))
  ];

  const filteredProducts = products.filter(product => {
    const name = i18n.language === 'ar' ? product.name_ar : product.name_en;
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesGame = selectedGame === 'all' || product.game === selectedGame;
    return matchesSearch && matchesCategory && matchesGame;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('categories.all')}
          </h1>
          <p className="text-gray-600">
            {filteredProducts.length} {t('cart.items')}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Game Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {games.map(game => (
                  <option key={game.key} value={game.key}>
                    {i18n.language === 'ar' ? game.label_ar : game.label_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setSearchParams(cat.key === 'all' ? {} : { category: cat.key });
                }}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {i18n.language === 'ar' ? cat.label_ar : cat.label_en}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-xl">
              {i18n.language === 'ar' ? 'لا توجد منتجات' : 'No products found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
