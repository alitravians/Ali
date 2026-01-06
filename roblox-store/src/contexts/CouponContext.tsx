import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../firebase/config';

export interface Coupon {
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

interface CouponContextType {
  coupons: Coupon[];
  loading: boolean;
  validateCoupon: (code: string, orderAmount: number) => { valid: boolean; discount: number; message_ar: string; message_en: string; coupon?: Coupon };
  applyCoupon: (couponId: string) => Promise<void>;
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>) => Promise<void>;
  updateCoupon: (couponId: string, updates: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (couponId: string) => Promise<void>;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export const useCoupons = () => {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error('useCoupons must be used within a CouponProvider');
  }
  return context;
};

interface CouponProviderProps {
  children: ReactNode;
}

export const CouponProvider: React.FC<CouponProviderProps> = ({ children }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const couponsRef = ref(database, 'coupons');
    const unsubscribe = onValue(couponsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const couponsList = Object.entries(data).map(([id, coupon]) => ({
          id,
          ...(coupon as Omit<Coupon, 'id'>)
        }));
        setCoupons(couponsList);
      } else {
        setCoupons([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const validateCoupon = (code: string, orderAmount: number) => {
    const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase());

    if (!coupon) {
      return {
        valid: false,
        discount: 0,
        message_ar: 'كود الخصم غير صالح',
        message_en: 'Invalid coupon code'
      };
    }

    if (!coupon.isActive) {
      return {
        valid: false,
        discount: 0,
        message_ar: 'كود الخصم غير مفعّل',
        message_en: 'Coupon is not active'
      };
    }

    if (new Date(coupon.expiresAt) < new Date()) {
      return {
        valid: false,
        discount: 0,
        message_ar: 'كود الخصم منتهي الصلاحية',
        message_en: 'Coupon has expired'
      };
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        discount: 0,
        message_ar: 'تم استخدام كود الخصم الحد الأقصى من المرات',
        message_en: 'Coupon has reached maximum uses'
      };
    }

    if (orderAmount < coupon.minOrderAmount) {
      return {
        valid: false,
        discount: 0,
        message_ar: `الحد الأدنى للطلب هو $${coupon.minOrderAmount}`,
        message_en: `Minimum order amount is $${coupon.minOrderAmount}`
      };
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderAmount * coupon.value) / 100;
    } else {
      discount = Math.min(coupon.value, orderAmount);
    }

    return {
      valid: true,
      discount,
      message_ar: coupon.type === 'percentage' 
        ? `خصم ${coupon.value}% تم تطبيقه`
        : `خصم $${coupon.value} تم تطبيقه`,
      message_en: coupon.type === 'percentage'
        ? `${coupon.value}% discount applied`
        : `$${coupon.value} discount applied`,
      coupon
    };
  };

  const applyCoupon = async (couponId: string) => {
    try {
      const coupon = coupons.find(c => c.id === couponId);
      if (coupon) {
        await update(ref(database, `coupons/${couponId}`), {
          usedCount: (coupon.usedCount || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
    }
  };

  const addCoupon = async (coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>) => {
    try {
      const newCoupon = {
        ...coupon,
        usedCount: 0,
        createdAt: new Date().toISOString()
      };
      await push(ref(database, 'coupons'), newCoupon);
    } catch (error) {
      console.error('Error adding coupon:', error);
      throw error;
    }
  };

  const updateCoupon = async (couponId: string, updates: Partial<Coupon>) => {
    try {
      await update(ref(database, `coupons/${couponId}`), updates);
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      await remove(ref(database, `coupons/${couponId}`));
    } catch (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
  };

  return (
    <CouponContext.Provider value={{
      coupons,
      loading,
      validateCoupon,
      applyCoupon,
      addCoupon,
      updateCoupon,
      deleteCoupon
    }}>
      {children}
    </CouponContext.Provider>
  );
};
