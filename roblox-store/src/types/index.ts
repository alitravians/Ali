// User Roles
export type UserRole = 'owner' | 'admin' | 'moderator' | 'support';

// Permissions
export interface Permissions {
  manageSettings: boolean;
  manageUsers: boolean;
  manageModerators: boolean;
  manageProducts: boolean;
  manageOrders: boolean;
  viewOrders: boolean;
  manageMarketing: boolean;
  viewAnalytics: boolean;
  viewAuditLog: boolean;
  banUsers: boolean;
  respondToCustomers: boolean;
}

export const RolePermissions: Record<UserRole, Permissions> = {
  owner: {
    manageSettings: true,
    manageUsers: true,
    manageModerators: true,
    manageProducts: true,
    manageOrders: true,
    viewOrders: true,
    manageMarketing: true,
    viewAnalytics: true,
    viewAuditLog: true,
    banUsers: true,
    respondToCustomers: true,
  },
  admin: {
    manageSettings: false,
    manageUsers: true,
    manageModerators: false,
    manageProducts: true,
    manageOrders: true,
    viewOrders: true,
    manageMarketing: true,
    viewAnalytics: true,
    viewAuditLog: true,
    banUsers: true,
    respondToCustomers: true,
  },
  moderator: {
    manageSettings: false,
    manageUsers: false,
    manageModerators: false,
    manageProducts: false,
    manageOrders: true,
    viewOrders: true,
    manageMarketing: false,
    viewAnalytics: false,
    viewAuditLog: false,
    banUsers: true,
    respondToCustomers: true,
  },
  support: {
    manageSettings: false,
    manageUsers: false,
    manageModerators: false,
    manageProducts: false,
    manageOrders: false,
    viewOrders: true,
    manageMarketing: false,
    viewAnalytics: false,
    viewAuditLog: false,
    banUsers: false,
    respondToCustomers: true,
  },
};

// Site Settings
export interface SiteSettings {
  siteName_en: string;
  siteName_ar: string;
  developerName: string;
  isOpen: boolean;
  closureMessage_en: string;
  closureMessage_ar: string;
  bannerEnabled: boolean;
  bannerText_en: string;
  bannerText_ar: string;
  bannerLink: string;
  bannerColor: string;
  // PayPal Settings
  paypalEnabled?: boolean;
  paypalBusinessName?: string;
  paypalBusinessEmail?: string;
  paypalCurrency?: string;
}

// User/Customer
export interface Customer {
  id: string;
  robloxUsername: string;
  email: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  isBanned: boolean;
  banReason?: string;
  bannedAt?: string;
  bannedBy?: string;
}

// Moderator/Staff
export interface Staff {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permissions;
  createdAt: string;
  lastActive?: string;
  isActive: boolean;
}

// Order Status
export type OrderStatus = 
  | 'pending' 
  | 'pending_payment'
  | 'awaiting_verification'
  | 'paid' 
  | 'needs_verification' 
  | 'processing' 
  | 'delivered' 
  | 'completed' 
  | 'failed' 
  | 'refunded';

// Order
export interface Order {
  id: string;
  items: Array<{
    id: string;
    name_en: string;
    name_ar: string;
    price: number;
    quantity: number;
    gamePassUrl?: string;
  }>;
  total: number;
  paymentMethod: 'paypal' | 'gamepass';
  customerInfo: {
    robloxUsername: string;
    robloxId?: string;
    email: string;
    customerId?: string;
  };
  paymentDetails?: {
    transactionId?: string;
    payerId?: string;
  };
  proofImage?: string;
  proofImageName?: string;
  status: OrderStatus;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  processedBy?: string;
}

// Product
export interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  price: number;
  image: string;
  category: string;
  game: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  gamePassUrl?: string; // رابط Game Pass للمنتج
  createdAt: string;
  updatedAt: string;
}

// Coupon
export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  targetType?: 'order' | 'product' | 'user' | 'settings' | 'moderator';
  targetId?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt: string;
}

// Game Category
export interface GameCategory {
  id: string;
  key: string;
  name_en: string;
  name_ar: string;
  isActive: boolean;
  createdAt: string;
}

// Product Category
export interface ProductCategory {
  id: string;
  key: string;
  name_en: string;
  name_ar: string;
  isActive: boolean;
  createdAt: string;
}

// Analytics
export interface DailySales {
  date: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  productId: string;
  name_en: string;
  name_ar: string;
  totalSold: number;
  revenue: number;
}

export interface TopBuyer {
  robloxUsername: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
}

// Message Types
export type MessageType = 'general' | 'promotion' | 'order_update' | 'welcome' | 'urgent' | 'announcement';
export type MessagePriority = 'normal' | 'high' | 'urgent';
export type MessageStatus = 'draft' | 'scheduled' | 'sent';

// Admin Message (stored in messages collection)
export interface AdminMessage {
  id: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  type: MessageType;
  priority: MessagePriority;
  status: MessageStatus;
  targetType: 'all' | 'single' | 'selected';
  targetCustomerIds?: string[]; // For single or selected customers
  scheduledAt?: string; // For scheduled messages
  sentAt?: string;
  sentBy: string;
  totalRecipients: number;
  readCount: number;
  createdAt: string;
  updatedAt: string;
}

// Customer Message (stored in customer's inbox)
export interface CustomerMessage {
  id: string;
  messageId: string; // Reference to AdminMessage
  customerId: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  type: MessageType;
  priority: MessagePriority;
  isRead: boolean;
  readAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
}

// Message Template
export interface MessageTemplate {
  id: string;
  name_en: string;
  name_ar: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  type: MessageType;
  isActive: boolean;
  createdAt: string;
}
