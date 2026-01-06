import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ref, onValue, update, push, get } from 'firebase/database';
import { database } from '../firebase/config';
import { useCustomerAuth } from './CustomerAuthContext';

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'referral' | 'bonus';
  points: number;
  description_ar: string;
  description_en: string;
  orderId?: string;
  createdAt: string;
}

export interface ReferralInfo {
  code: string;
  referredBy?: string;
  referralCount: number;
  totalEarned: number;
}

interface LoyaltySettings {
  pointsPerDollar: number;
  pointsValue: number; // How much 1 point is worth in dollars
  referralBonus: number; // Points for referrer
  referredBonus: number; // Points for new user
  minRedeemPoints: number;
}

interface LoyaltyContextType {
  points: number;
  transactions: LoyaltyTransaction[];
  referralInfo: ReferralInfo | null;
  settings: LoyaltySettings;
  loading: boolean;
  addPoints: (points: number, type: LoyaltyTransaction['type'], description_ar: string, description_en: string, orderId?: string) => Promise<void>;
  redeemPoints: (points: number) => Promise<{ success: boolean; discount: number }>;
  applyReferralCode: (code: string) => Promise<{ success: boolean; message_ar: string; message_en: string }>;
  generateReferralCode: () => string;
}

const defaultSettings: LoyaltySettings = {
  pointsPerDollar: 10,
  pointsValue: 0.01,
  referralBonus: 100,
  referredBonus: 50,
  minRedeemPoints: 100
};

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};

interface LoyaltyProviderProps {
  children: ReactNode;
}

export const LoyaltyProvider: React.FC<LoyaltyProviderProps> = ({ children }) => {
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [settings, setSettings] = useState<LoyaltySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { customer } = useCustomerAuth();

  useEffect(() => {
    // Load settings
    const settingsRef = ref(database, 'settings/loyalty');
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings({ ...defaultSettings, ...data });
      }
    });
  }, []);

  useEffect(() => {
    if (!customer) {
      setPoints(0);
      setTransactions([]);
      setReferralInfo(null);
      setLoading(false);
      return;
    }

    // Load customer points
    const pointsRef = ref(database, `loyalty/${customer.id}/points`);
    const unsubscribePoints = onValue(pointsRef, (snapshot) => {
      setPoints(snapshot.val() || 0);
    });

    // Load transactions
    const transactionsRef = ref(database, `loyalty/${customer.id}/transactions`);
    const unsubscribeTransactions = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsList = Object.entries(data).map(([id, t]) => ({
          id,
          ...(t as Omit<LoyaltyTransaction, 'id'>)
        }));
        transactionsList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTransactions(transactionsList);
      } else {
        setTransactions([]);
      }
    });

    // Load referral info
    const referralRef = ref(database, `loyalty/${customer.id}/referral`);
    const unsubscribeReferral = onValue(referralRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setReferralInfo(data);
      } else {
        // Generate referral code for new users
        const code = generateReferralCode();
        update(ref(database, `loyalty/${customer.id}/referral`), {
          code,
          referralCount: 0,
          totalEarned: 0
        });
        setReferralInfo({ code, referralCount: 0, totalEarned: 0 });
      }
      setLoading(false);
    });

    return () => {
      unsubscribePoints();
      unsubscribeTransactions();
      unsubscribeReferral();
    };
  }, [customer]);

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REF-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const addPoints = async (
    pointsToAdd: number,
    type: LoyaltyTransaction['type'],
    description_ar: string,
    description_en: string,
    orderId?: string
  ) => {
    if (!customer) return;

    try {
      const newPoints = points + pointsToAdd;
      await update(ref(database, `loyalty/${customer.id}`), {
        points: newPoints
      });

      const transaction: Omit<LoyaltyTransaction, 'id'> = {
        customerId: customer.id,
        type,
        points: pointsToAdd,
        description_ar,
        description_en,
        orderId,
        createdAt: new Date().toISOString()
      };
      await push(ref(database, `loyalty/${customer.id}/transactions`), transaction);
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const redeemPoints = async (pointsToRedeem: number) => {
    if (!customer) return { success: false, discount: 0 };
    if (pointsToRedeem > points) return { success: false, discount: 0 };
    if (pointsToRedeem < settings.minRedeemPoints) return { success: false, discount: 0 };

    try {
      const discount = pointsToRedeem * settings.pointsValue;
      const newPoints = points - pointsToRedeem;
      
      await update(ref(database, `loyalty/${customer.id}`), {
        points: newPoints
      });

      const transaction: Omit<LoyaltyTransaction, 'id'> = {
        customerId: customer.id,
        type: 'redeem',
        points: -pointsToRedeem,
        description_ar: `استبدال ${pointsToRedeem} نقطة مقابل خصم $${discount.toFixed(2)}`,
        description_en: `Redeemed ${pointsToRedeem} points for $${discount.toFixed(2)} discount`,
        createdAt: new Date().toISOString()
      };
      await push(ref(database, `loyalty/${customer.id}/transactions`), transaction);

      return { success: true, discount };
    } catch (error) {
      console.error('Error redeeming points:', error);
      return { success: false, discount: 0 };
    }
  };

  const applyReferralCode = async (code: string) => {
    if (!customer) {
      return {
        success: false,
        message_ar: 'يجب تسجيل الدخول أولاً',
        message_en: 'Must be logged in first'
      };
    }

    if (referralInfo?.referredBy) {
      return {
        success: false,
        message_ar: 'لقد استخدمت كود إحالة مسبقاً',
        message_en: 'You have already used a referral code'
      };
    }

    try {
      // Find the referrer
      const loyaltyRef = ref(database, 'loyalty');
      const snapshot = await get(loyaltyRef);
      const data = snapshot.val();
      
      let referrerId: string | null = null;
      if (data) {
        for (const [userId, userData] of Object.entries(data)) {
          const userLoyalty = userData as { referral?: ReferralInfo };
          if (userLoyalty.referral?.code === code.toUpperCase() && userId !== customer.id) {
            referrerId = userId;
            break;
          }
        }
      }

      if (!referrerId) {
        return {
          success: false,
          message_ar: 'كود الإحالة غير صالح',
          message_en: 'Invalid referral code'
        };
      }

      // Add bonus to referrer
      const referrerPointsRef = ref(database, `loyalty/${referrerId}/points`);
      const referrerPointsSnapshot = await get(referrerPointsRef);
      const referrerPoints = referrerPointsSnapshot.val() || 0;
      
      await update(ref(database, `loyalty/${referrerId}`), {
        points: referrerPoints + settings.referralBonus,
        'referral/referralCount': ((data[referrerId] as { referral?: ReferralInfo })?.referral?.referralCount || 0) + 1,
        'referral/totalEarned': ((data[referrerId] as { referral?: ReferralInfo })?.referral?.totalEarned || 0) + settings.referralBonus
      });

      await push(ref(database, `loyalty/${referrerId}/transactions`), {
        customerId: referrerId,
        type: 'referral',
        points: settings.referralBonus,
        description_ar: 'مكافأة إحالة صديق جديد',
        description_en: 'Referral bonus for new friend',
        createdAt: new Date().toISOString()
      });

      // Add bonus to referred user
      await update(ref(database, `loyalty/${customer.id}`), {
        points: points + settings.referredBonus,
        'referral/referredBy': referrerId
      });

      await push(ref(database, `loyalty/${customer.id}/transactions`), {
        customerId: customer.id,
        type: 'referral',
        points: settings.referredBonus,
        description_ar: 'مكافأة استخدام كود إحالة',
        description_en: 'Bonus for using referral code',
        createdAt: new Date().toISOString()
      });

      return {
        success: true,
        message_ar: `تم تطبيق كود الإحالة! حصلت على ${settings.referredBonus} نقطة`,
        message_en: `Referral code applied! You earned ${settings.referredBonus} points`
      };
    } catch (error) {
      console.error('Error applying referral code:', error);
      return {
        success: false,
        message_ar: 'حدث خطأ أثناء تطبيق الكود',
        message_en: 'Error applying referral code'
      };
    }
  };

  return (
    <LoyaltyContext.Provider value={{
      points,
      transactions,
      referralInfo,
      settings,
      loading,
      addPoints,
      redeemPoints,
      applyReferralCode,
      generateReferralCode
    }}>
      {children}
    </LoyaltyContext.Provider>
  );
};
