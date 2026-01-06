import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { useCustomerAuth } from './CustomerAuthContext';

export interface WishlistItem {
  productId: string;
  name_ar: string;
  name_en: string;
  price: number;
  image: string;
  addedAt: string;
  gamePassUrl?: string;
}

interface WishlistContextType {
  wishlist: string[];
  wishlistItems: WishlistItem[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [products, setProducts] = useState<{ [key: string]: { name_ar: string; name_en: string; price: number; image: string } }>({});
  const [loading, setLoading] = useState(true);
  const { customer } = useCustomerAuth();

  // Load products
  useEffect(() => {
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProducts(data);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!customer) {
      setWishlist([]);
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    const wishlistRef = ref(database, `wishlists/${customer.id}`);
    const unsubscribe = onValue(wishlistRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ids = Object.keys(data);
        setWishlist(ids);
        
                // Build wishlist items with product data
                const items: WishlistItem[] = ids.map(productId => {
                  const product = products[productId] as any;
                  const wishlistData = data[productId];
                  return {
                    productId,
                    name_ar: product?.name_ar || '',
                    name_en: product?.name_en || '',
                    price: product?.price || 0,
                    image: product?.image || '',
                    addedAt: wishlistData?.addedAt || '',
                    gamePassUrl: product?.gamePassUrl || ''
                  };
                }).filter(item => item.name_ar || item.name_en);
        setWishlistItems(items);
      } else {
        setWishlist([]);
        setWishlistItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [customer, products]);

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const addToWishlist = async (productId: string) => {
    if (!customer) return;
    try {
      await set(ref(database, `wishlists/${customer.id}/${productId}`), {
        addedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!customer) return;
    try {
      await remove(ref(database, `wishlists/${customer.id}/${productId}`));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

    return (
      <WishlistContext.Provider value={{
        wishlist,
        wishlistItems,
        loading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist
      }}>
        {children}
      </WishlistContext.Provider>
    );
};
