import { ref, get, set, push, update, remove, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import type { 
  SiteSettings, 
  Customer, 
  Staff, 
  Order, 
  Product, 
  Coupon, 
  AuditLogEntry,
  GameCategory,
  ProductCategory,
  AdminMessage,
  CustomerMessage,
  MessageTemplate
} from '../types';

// ============ SITE SETTINGS ============
export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  const snapshot = await get(ref(database, 'settings/site'));
  return snapshot.exists() ? snapshot.val() : null;
};

export const updateSiteSettings = async (settings: Partial<SiteSettings>): Promise<void> => {
  await update(ref(database, 'settings/site'), settings);
};

export const subscribeSiteSettings = (callback: (settings: SiteSettings | null) => void) => {
  return onValue(ref(database, 'settings/site'), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
};

// ============ CUSTOMERS ============
export const getCustomers = async (): Promise<Customer[]> => {
  const snapshot = await get(ref(database, 'customers'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const updateCustomer = async (customerId: string, data: Partial<Customer>): Promise<void> => {
  await update(ref(database, `customers/${customerId}`), data);
};

export const banCustomer = async (customerId: string, reason: string, bannedBy: string): Promise<void> => {
  await update(ref(database, `customers/${customerId}`), {
    isBanned: true,
    banReason: reason,
    bannedAt: new Date().toISOString(),
    bannedBy
  });
};

export const unbanCustomer = async (customerId: string): Promise<void> => {
  await update(ref(database, `customers/${customerId}`), {
    isBanned: false,
    banReason: null,
    bannedAt: null,
    bannedBy: null
  });
};

export const subscribeCustomers = (callback: (customers: Customer[]) => void) => {
  return onValue(ref(database, 'customers'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const customers = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(customers);
  });
};

// ============ STAFF/MODERATORS ============
export const getStaff = async (): Promise<Staff[]> => {
  const snapshot = await get(ref(database, 'staff'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const addStaff = async (staff: Omit<Staff, 'id'>): Promise<string> => {
  const newRef = push(ref(database, 'staff'));
  await set(newRef, staff);
  return newRef.key!;
};

export const updateStaff = async (staffId: string, data: Partial<Staff>): Promise<void> => {
  await update(ref(database, `staff/${staffId}`), data);
};

export const deleteStaff = async (staffId: string): Promise<void> => {
  await remove(ref(database, `staff/${staffId}`));
};

export const subscribeStaff = (callback: (staff: Staff[]) => void) => {
  return onValue(ref(database, 'staff'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const staff = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(staff);
  });
};

// ============ ORDERS ============
export const getOrders = async (): Promise<Order[]> => {
  const snapshot = await get(ref(database, 'orders'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const updateOrder = async (orderId: string, data: Partial<Order>): Promise<void> => {
  await update(ref(database, `orders/${orderId}`), {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const subscribeOrders = (callback: (orders: Order[]) => void) => {
  return onValue(ref(database, 'orders'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const orders = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(orders);
  });
};

// ============ PRODUCTS ============
export const getProducts = async (): Promise<Product[]> => {
  const snapshot = await get(ref(database, 'products'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  const newRef = push(ref(database, 'products'));
  await set(newRef, product);
  return newRef.key!;
};

export const updateProduct = async (productId: string, data: Partial<Product>): Promise<void> => {
  await update(ref(database, `products/${productId}`), {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await remove(ref(database, `products/${productId}`));
};

export const subscribeProducts = (callback: (products: Product[]) => void) => {
  return onValue(ref(database, 'products'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const products = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(products);
  });
};

// ============ COUPONS ============
export const getCoupons = async (): Promise<Coupon[]> => {
  const snapshot = await get(ref(database, 'coupons'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const addCoupon = async (coupon: Omit<Coupon, 'id'>): Promise<string> => {
  const newRef = push(ref(database, 'coupons'));
  await set(newRef, coupon);
  return newRef.key!;
};

export const updateCoupon = async (couponId: string, data: Partial<Coupon>): Promise<void> => {
  await update(ref(database, `coupons/${couponId}`), data);
};

export const deleteCoupon = async (couponId: string): Promise<void> => {
  await remove(ref(database, `coupons/${couponId}`));
};

export const subscribeCoupons = (callback: (coupons: Coupon[]) => void) => {
  return onValue(ref(database, 'coupons'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const coupons = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(coupons);
  });
};

// ============ AUDIT LOG ============
export const addAuditLog = async (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> => {
  const newRef = push(ref(database, 'auditLog'));
  await set(newRef, {
    ...entry,
    createdAt: new Date().toISOString()
  });
};

export const getAuditLog = async (limit: number = 100): Promise<AuditLogEntry[]> => {
  const snapshot = await get(ref(database, 'auditLog'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  const entries = Object.keys(data).map(key => ({ id: key, ...data[key] }));
  entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return entries.slice(0, limit);
};

export const subscribeAuditLog = (callback: (entries: AuditLogEntry[]) => void, limit: number = 100) => {
  return onValue(ref(database, 'auditLog'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const entries = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(entries.slice(0, limit));
  });
};

// ============ ANALYTICS ============
export const getTopBuyers = async (days: number = 30): Promise<{ robloxUsername: string; email: string; totalOrders: number; totalSpent: number }[]> => {
  const orders = await getOrders();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentOrders = orders.filter(o => 
    o.status === 'completed' && 
    new Date(o.createdAt) >= cutoffDate
  );
  
  const buyerStats: Record<string, { email: string; totalOrders: number; totalSpent: number }> = {};
  
  recentOrders.forEach(order => {
    const username = order.customerInfo.robloxUsername;
    if (!buyerStats[username]) {
      buyerStats[username] = {
        email: order.customerInfo.email,
        totalOrders: 0,
        totalSpent: 0
      };
    }
    buyerStats[username].totalOrders++;
    buyerStats[username].totalSpent += order.total;
  });
  
  return Object.entries(buyerStats)
    .map(([robloxUsername, stats]) => ({ robloxUsername, ...stats }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
};

export const getDailySales = async (days: number = 30): Promise<{ date: string; orders: number; revenue: number }[]> => {
  const orders = await getOrders();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const dailyStats: Record<string, { orders: number; revenue: number }> = {};
  
  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyStats[dateStr] = { orders: 0, revenue: 0 };
  }
  
  orders
    .filter(o => o.status === 'completed' && new Date(o.createdAt) >= cutoffDate)
    .forEach(order => {
      const dateStr = order.createdAt.split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].orders++;
        dailyStats[dateStr].revenue += order.total;
      }
    });
  
  return Object.entries(dailyStats)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getTopProducts = async (days: number = 30): Promise<{ productId: string; name_en: string; name_ar: string; totalSold: number; revenue: number }[]> => {
  const orders = await getOrders();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const productStats: Record<string, { name_en: string; name_ar: string; totalSold: number; revenue: number }> = {};
  
  orders
    .filter(o => o.status === 'completed' && new Date(o.createdAt) >= cutoffDate)
    .forEach(order => {
      order.items.forEach(item => {
        if (!productStats[item.id]) {
          productStats[item.id] = {
            name_en: item.name_en,
            name_ar: item.name_ar,
            totalSold: 0,
            revenue: 0
          };
        }
        productStats[item.id].totalSold += item.quantity;
        productStats[item.id].revenue += item.price * item.quantity;
      });
    });
  
  return Object.entries(productStats)
    .map(([productId, stats]) => ({ productId, ...stats }))
    .sort((a, b) => b.totalSold - a.totalSold);
};

// ============ GAME CATEGORIES ============
export const getGameCategories = async (): Promise<GameCategory[]> => {
  const snapshot = await get(ref(database, 'gameCategories'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const addGameCategory = async (category: Omit<GameCategory, 'id'>): Promise<string> => {
  const newRef = push(ref(database, 'gameCategories'));
  await set(newRef, category);
  return newRef.key!;
};

export const updateGameCategory = async (categoryId: string, data: Partial<GameCategory>): Promise<void> => {
  await update(ref(database, `gameCategories/${categoryId}`), data);
};

export const deleteGameCategory = async (categoryId: string): Promise<void> => {
  await remove(ref(database, `gameCategories/${categoryId}`));
};

export const subscribeGameCategories = (callback: (categories: GameCategory[]) => void) => {
  return onValue(ref(database, 'gameCategories'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const categories = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(categories);
  });
};

// ============ PRODUCT CATEGORIES ============
export const getProductCategories = async (): Promise<ProductCategory[]> => {
  const snapshot = await get(ref(database, 'productCategories'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const addProductCategory = async (category: Omit<ProductCategory, 'id'>): Promise<string> => {
  const newRef = push(ref(database, 'productCategories'));
  await set(newRef, category);
  return newRef.key!;
};

export const updateProductCategory = async (categoryId: string, data: Partial<ProductCategory>): Promise<void> => {
  await update(ref(database, `productCategories/${categoryId}`), data);
};

export const deleteProductCategory = async (categoryId: string): Promise<void> => {
  await remove(ref(database, `productCategories/${categoryId}`));
};

export const subscribeProductCategories = (callback: (categories: ProductCategory[]) => void) => {
  return onValue(ref(database, 'productCategories'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const categories = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(categories);
  });
};

// ============ NOTIFICATIONS ============
export type NotificationType = 'order_status' | 'ticket_reply' | 'promotion' | 'system';

export const sendNotification = async (
  customerId: string,
  type: NotificationType,
  title_ar: string,
  title_en: string,
  message_ar: string,
  message_en: string,
  link?: string
): Promise<void> => {
  if (!customerId) {
    console.warn('Cannot send notification: customerId is missing');
    return;
  }
  
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
    console.error('Error sending notification:', error);
  }
};

// Helper to find customerId by email (for old orders/tickets without customerId)
export const findCustomerIdByEmail = async (email: string): Promise<string | null> => {
  try {
    const customers = await getCustomers();
    const customer = customers.find(c => c.email?.toLowerCase() === email?.toLowerCase());
    return customer?.id || null;
  } catch (error) {
    console.error('Error finding customer by email:', error);
    return null;
  }
};

// ============ ADMIN MESSAGES ============
export const getAdminMessages = async (): Promise<AdminMessage[]> => {
  const snapshot = await get(ref(database, 'adminMessages'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const addAdminMessage = async (message: Omit<AdminMessage, 'id'>): Promise<string> => {
  const newRef = push(ref(database, 'adminMessages'));
  await set(newRef, message);
  return newRef.key!;
};

export const updateAdminMessage = async (messageId: string, data: Partial<AdminMessage>): Promise<void> => {
  await update(ref(database, `adminMessages/${messageId}`), {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const deleteAdminMessage = async (messageId: string): Promise<void> => {
  await remove(ref(database, `adminMessages/${messageId}`));
};

export const subscribeAdminMessages = (callback: (messages: AdminMessage[]) => void) => {
  return onValue(ref(database, 'adminMessages'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const messages = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(messages);
  });
};

// ============ CUSTOMER MESSAGES (INBOX) ============
export const getCustomerMessages = async (customerId: string): Promise<CustomerMessage[]> => {
  const snapshot = await get(ref(database, `customerMessages/${customerId}`));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const addCustomerMessage = async (customerId: string, message: Omit<CustomerMessage, 'id'>): Promise<string> => {
  const newRef = push(ref(database, `customerMessages/${customerId}`));
  await set(newRef, message);
  return newRef.key!;
};

export const markMessageAsRead = async (customerId: string, messageId: string): Promise<void> => {
  await update(ref(database, `customerMessages/${customerId}/${messageId}`), {
    isRead: true,
    readAt: new Date().toISOString()
  });
};

export const deleteCustomerMessage = async (customerId: string, messageId: string): Promise<void> => {
  await update(ref(database, `customerMessages/${customerId}/${messageId}`), {
    isDeleted: true,
    deletedAt: new Date().toISOString()
  });
};

export const subscribeCustomerMessages = (customerId: string, callback: (messages: CustomerMessage[]) => void) => {
  return onValue(ref(database, `customerMessages/${customerId}`), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const messages = Object.keys(data)
      .map(key => ({ id: key, ...data[key] }))
      .filter(m => !m.isDeleted);
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(messages);
  });
};

export const getUnreadMessageCount = async (customerId: string): Promise<number> => {
  const messages = await getCustomerMessages(customerId);
  return messages.filter(m => !m.isRead && !m.isDeleted).length;
};

// Send message to single customer
export const sendMessageToCustomer = async (
  adminMessage: AdminMessage,
  customerId: string
): Promise<void> => {
  const customerMessage: Omit<CustomerMessage, 'id'> = {
    messageId: adminMessage.id,
    customerId,
    title_en: adminMessage.title_en,
    title_ar: adminMessage.title_ar,
    content_en: adminMessage.content_en,
    content_ar: adminMessage.content_ar,
    type: adminMessage.type,
    priority: adminMessage.priority,
    isRead: false,
    isDeleted: false,
    createdAt: new Date().toISOString()
  };
  await addCustomerMessage(customerId, customerMessage);
};

// Send message to all customers
export const sendMessageToAllCustomers = async (adminMessage: AdminMessage): Promise<number> => {
  const customers = await getCustomers();
  console.log('Found customers:', customers.length);
  let sentCount = 0;
  
  for (const customer of customers) {
    if (!customer.isBanned && customer.id) {
      try {
        await sendMessageToCustomer(adminMessage, customer.id);
        sentCount++;
        console.log('Sent message to customer:', customer.id);
      } catch (err) {
        console.error('Failed to send to customer:', customer.id, err);
      }
    }
  }
  
  return sentCount;
};

// Send message to selected customers
export const sendMessageToSelectedCustomers = async (
  adminMessage: AdminMessage,
  customerIds: string[]
): Promise<number> => {
  let sentCount = 0;
  
  for (const customerId of customerIds) {
    await sendMessageToCustomer(adminMessage, customerId);
    sentCount++;
  }
  
  return sentCount;
};

// ============ MESSAGE TEMPLATES ============
export const getMessageTemplates = async (): Promise<MessageTemplate[]> => {
  const snapshot = await get(ref(database, 'messageTemplates'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const addMessageTemplate = async (template: Omit<MessageTemplate, 'id'>): Promise<string> => {
  const newRef = push(ref(database, 'messageTemplates'));
  await set(newRef, template);
  return newRef.key!;
};

export const updateMessageTemplate = async (templateId: string, data: Partial<MessageTemplate>): Promise<void> => {
  await update(ref(database, `messageTemplates/${templateId}`), data);
};

export const deleteMessageTemplate = async (templateId: string): Promise<void> => {
  await remove(ref(database, `messageTemplates/${templateId}`));
};

export const subscribeMessageTemplates = (callback: (templates: MessageTemplate[]) => void) => {
  return onValue(ref(database, 'messageTemplates'), (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const templates = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(templates);
  });
};

// initializeDefaultSettings removed - all data should come from Firebase only
