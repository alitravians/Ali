import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ref, onValue, push, update, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase/config';
import { useCustomerAuth } from './CustomerAuthContext';

export interface Notification {
  id: string;
  customerId: string;
  type: 'order_status' | 'ticket_reply' | 'promotion' | 'system';
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { customer } = useCustomerAuth();

  useEffect(() => {
    if (!customer) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notificationsRef = ref(database, 'notifications');
    const customerNotificationsQuery = query(
      notificationsRef,
      orderByChild('customerId'),
      equalTo(customer.id)
    );

    const unsubscribe = onValue(customerNotificationsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList = Object.entries(data).map(([id, notification]) => ({
          id,
          ...(notification as Omit<Notification, 'id'>)
        }));
        // Sort by createdAt descending
        notificationsList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(notificationsList);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [customer]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      await update(ref(database, `notifications/${notificationId}`), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updates: { [key: string]: boolean } = {};
      notifications.filter(n => !n.read).forEach(n => {
        updates[`notifications/${n.id}/read`] = true;
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    try {
      const newNotification = {
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
      };
      await push(ref(database, 'notifications'), newNotification);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      loading
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper function to create notifications (can be called from anywhere)
export const createNotification = async (
  customerId: string,
  type: Notification['type'],
  title_ar: string,
  title_en: string,
  message_ar: string,
  message_en: string,
  link?: string
) => {
  try {
    const notification = {
      customerId,
      type,
      title_ar,
      title_en,
      message_ar,
      message_en,
      read: false,
      createdAt: new Date().toISOString(),
      link
    };
    await push(ref(database, 'notifications'), notification);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
