import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface ProductCardProps {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  image: string;
  category: string;
  inStock?: boolean;
  gamePassUrl?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name_en,
  name_ar,
  price,
  image,
  category,
  inStock = true,
  gamePassUrl
}) => {
  const { t, i18n } = useTranslation();
  const { addToCart, items } = useCart();
  const [added, setAdded] = React.useState(false);

  const name = i18n.language === 'ar' ? name_ar : name_en;
  const isInCart = items.some(item => item.id === id);

    const handleAddToCart = () => {
      if (!inStock) return;
      addToCart({ id, name_en, name_ar, price, image, category, gamePassUrl });
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      <div className="relative">
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
          {category}
        </div>
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{t('product.outOfStock')}</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-lg mb-2 truncate">{name}</h3>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-purple-600">
            ${price.toFixed(2)}
          </span>
          
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              added || isInCart
                ? 'bg-green-500 text-white'
                : inStock
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {added || isInCart ? (
              <>
                <Check size={18} />
                <span className="hidden sm:inline">{t('product.addToCart')}</span>
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                <span className="hidden sm:inline">{t('product.addToCart')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
