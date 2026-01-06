import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ref, get, set, push, query, orderByChild, equalTo, onValue, update } from 'firebase/database';
import { database } from '../firebase/config';

export interface Customer {
  id: string;
  username: string;
  email: string;
  robloxUsername: string;
  robloxId: string;
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
  isBanned?: boolean;
  banReason?: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<Customer>) => Promise<boolean>;
}

interface RegisterData {
  username: string;
  email: string;
  robloxUsername: string;
  robloxId: string;
  password: string;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

// Simple hash function for demo purposes - in production use bcrypt or similar
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const CustomerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load customer from localStorage on mount
  useEffect(() => {
    const savedCustomerId = localStorage.getItem('customerId');
    if (savedCustomerId) {
      loadCustomer(savedCustomerId);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Realtime listener for ban status changes while logged in
  useEffect(() => {
    if (!customer?.id) return;

    const customerRef = ref(database, `customers/${customer.id}`);
    const unsubscribe = onValue(customerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Update customer state with latest ban status (keep them logged in but in banned state)
        if (data.isBanned !== customer.isBanned || data.banReason !== customer.banReason) {
          setCustomer(prev => prev ? { ...prev, isBanned: data.isBanned, banReason: data.banReason } : null);
        }
      }
    });

    return () => unsubscribe();
  }, [customer?.id, customer?.isBanned, customer?.banReason]);

  const loadCustomer = async (customerId: string) => {
    try {
      const customerRef = ref(database, `customers/${customerId}`);
      const snapshot = await get(customerRef);
      if (snapshot.exists()) {
        const customerData = snapshot.val();
        // Keep customer logged in even if banned (they will be redirected to banned page)
        setCustomer({ id: customerId, ...customerData });
      } else {
        localStorage.removeItem('customerId');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      localStorage.removeItem('customerId');
    } finally {
      setIsLoading(false);
    }
  };

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const customersRef = ref(database, 'customers');
      
        // Try email query (may fail if no index)
        let snapshot;
        try {
          const emailQuery = query(customersRef, orderByChild('email'), equalTo(email.toLowerCase()));
          snapshot = await get(emailQuery);
        } catch (queryError: any) {
          console.error('Email query failed:', queryError.message);
          // Fallback: get all customers and filter manually
          const allSnapshot = await get(customersRef);
          if (!allSnapshot.exists()) {
            return { success: false, error: 'البريد الإلكتروني غير مسجل' };
          }
          const allCustomers = allSnapshot.val();
          const found = Object.entries(allCustomers).find(
            ([_, data]: [string, any]) => data.email === email.toLowerCase()
          );
          if (!found) {
            return { success: false, error: 'البريد الإلكتروني غير مسجل' };
          }
          const [customerId, customerData] = found as [string, any];
          
          if (customerData.passwordHash !== simpleHash(password)) {
            return { success: false, error: 'كلمة المرور غير صحيحة' };
          }
          await set(ref(database, `customers/${customerId}/lastLogin`), new Date().toISOString());
          const fullCustomer = { id: customerId, ...customerData, lastLogin: new Date().toISOString() };
          setCustomer(fullCustomer);
          localStorage.setItem('customerId', customerId);
          return { success: true };
        }

        if (!snapshot.exists()) {
          return { success: false, error: 'البريد الإلكتروني غير مسجل' };
        }

        const customers = snapshot.val();
        const customerId = Object.keys(customers)[0];
        const customerData = customers[customerId];

        if (customerData.passwordHash !== simpleHash(password)) {
          return { success: false, error: 'كلمة المرور غير صحيحة' };
        }

        // Update last login
        await set(ref(database, `customers/${customerId}/lastLogin`), new Date().toISOString());

        const fullCustomer = { id: customerId, ...customerData, lastLogin: new Date().toISOString() };
        setCustomer(fullCustomer);
        localStorage.setItem('customerId', customerId);

        return { success: true };
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.code === 'PERMISSION_DENIED') {
          return { success: false, error: 'خطأ في الصلاحيات - يرجى التواصل مع الدعم' };
        }
        return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول: ' + (error.message || 'خطأ غير معروف') };
      }
    };

    const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
      try {
        const customersRef = ref(database, 'customers');
      
        // Try to check if email already exists (may fail if no index)
        try {
          const emailQuery = query(customersRef, orderByChild('email'), equalTo(data.email.toLowerCase()));
          const emailSnapshot = await get(emailQuery);
          if (emailSnapshot.exists()) {
            return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً' };
          }
        } catch (emailError: any) {
          console.warn('Email query failed (index may be missing), proceeding:', emailError.message);
          // Continue without email check if index is missing
        }

        // Try to check if username already exists (may fail if no index)
        try {
          const usernameQuery = query(customersRef, orderByChild('username'), equalTo(data.username.toLowerCase()));
          const usernameSnapshot = await get(usernameQuery);
          if (usernameSnapshot.exists()) {
            return { success: false, error: 'اسم المستخدم مستخدم مسبقاً' };
          }
        } catch (usernameError: any) {
          console.warn('Username query failed (index may be missing), proceeding:', usernameError.message);
          // Continue without username check if index is missing
        }

        // Create new customer
        const newCustomerRef = push(customersRef);
        const newCustomer = {
          username: data.username.toLowerCase(),
          email: data.email.toLowerCase(),
          robloxUsername: data.robloxUsername,
          robloxId: data.robloxId,
          passwordHash: simpleHash(data.password),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        await set(newCustomerRef, newCustomer);

        const fullCustomer = { id: newCustomerRef.key!, ...newCustomer };
        setCustomer(fullCustomer);
        localStorage.setItem('customerId', newCustomerRef.key!);

        return { success: true };
      } catch (error: any) {
        console.error('Registration error:', error);
        // Provide more specific error message
        if (error.code === 'PERMISSION_DENIED') {
          return { success: false, error: 'خطأ في الصلاحيات - يرجى التواصل مع الدعم' };
        }
        return { success: false, error: 'حدث خطأ أثناء التسجيل: ' + (error.message || 'خطأ غير معروف') };
      }
    };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem('customerId');
  };

  const updateProfile = async (data: Partial<Customer>): Promise<boolean> => {
    if (!customer) return false;

    try {
      const updates: Record<string, any> = {};
      if (data.robloxUsername) updates.robloxUsername = data.robloxUsername;
      if (data.email) updates.email = data.email.toLowerCase();

      // Use update() instead of set() to preserve other fields like isBanned, banReason
      await update(ref(database, `customers/${customer.id}`), updates);

      setCustomer({ ...customer, ...updates });
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  return (
    <CustomerAuthContext.Provider value={{
      customer,
      isLoggedIn: !!customer,
      isLoading,
      login,
      register,
      logout,
      updateProfile
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
