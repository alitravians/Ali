import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Shield,
  Tag,
  BarChart3,
  Globe,
  Trash2,
  Ticket,
  FileText,
  HelpCircle,
  Star,
  Gift,
  Percent,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';

// Import all modal components
import SiteManagementModal from '../../components/admin/SiteManagementModal';
import UserManagementModal from '../../components/admin/UserManagementModal';
import ModeratorManagementModal from '../../components/admin/ModeratorManagementModal';
import ProductManagementModal from '../../components/admin/ProductManagementModal';
import OrderManagementModal from '../../components/admin/OrderManagementModal';
import MarketingModal from '../../components/admin/MarketingModal';
import AnalyticsModal from '../../components/admin/AnalyticsModal';
import TicketManagementModal from '../../components/admin/TicketManagementModal';
import StaticPagesModal from '../../components/admin/StaticPagesModal';
import FAQManagementModal from '../../components/admin/FAQManagementModal';
import CustomerManagementModal from '../../components/admin/CustomerManagementModal';
import ReviewManagementModal from '../../components/admin/ReviewManagementModal';
import LoyaltyManagementModal from '../../components/admin/LoyaltyManagementModal';
import CouponManagementModal from '../../components/admin/CouponManagementModal';
import GameCategoryManagementModal from '../../components/admin/GameCategoryManagementModal';

interface Order {
  id: string;
  items: Array<{
    id: string;
    name_en: string;
    name_ar: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  paymentMethod: string;
  customerInfo: {
    robloxUsername: string;
    email: string;
  };
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, logout } = useAuth();
  const isArabic = i18n.language === 'ar';
  
  const [orders, setOrders] = useState<Order[]>([]);
  
        // Modal states
        const [modals, setModals] = useState({
          siteManagement: false,
          userManagement: false,
          moderatorManagement: false,
          productManagement: false,
          orderManagement: false,
          marketing: false,
          analytics: false,
          ticketManagement: false,
          staticPages: false,
          faqManagement: false,
          customerManagement: false,
          reviewManagement: false,
          loyaltyManagement: false,
          couponManagement: false,
          gameCategoryManagement: false
        });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }

    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const orderList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(orderList);
      } else {
        setOrders([]);
      }
    });

    return () => unsubscribe();
  }, [isAdmin, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openModal = (modal: keyof typeof modals) => {
    setModals({ ...modals, [modal]: true });
  };

  const closeModal = (modal: keyof typeof modals) => {
    setModals({ ...modals, [modal]: false });
  };

  const clearCache = () => {
    if (confirm(isArabic ? 'هل أنت متأكد من مسح الذاكرة المؤقتة؟' : 'Are you sure you want to clear cache?')) {
      localStorage.clear();
      sessionStorage.clear();
      alert(isArabic ? 'تم مسح الذاكرة المؤقتة بنجاح' : 'Cache cleared successfully');
      window.location.reload();
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    failed: orders.filter(o => o.status === 'failed').length,
    revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0)
  };

  // Admin panel buttons configuration
  const adminButtons = [
    {
      id: 'siteManagement',
      icon: Globe,
      label: isArabic ? 'إدارة الموقع' : 'Site Management',
      description: isArabic ? 'فتح/إغلاق الموقع، البنر، الإعدادات' : 'Open/Close site, banner, settings',
      color: 'from-blue-500 to-blue-600',
      onClick: () => openModal('siteManagement')
    },
    {
      id: 'userManagement',
      icon: Users,
      label: isArabic ? 'إدارة المستخدمين' : 'User Management',
      description: isArabic ? 'قائمة الأعضاء، المحظورين، الأكثر شراءً' : 'Members, banned users, top buyers',
      color: 'from-green-500 to-green-600',
      onClick: () => openModal('userManagement')
    },
    {
      id: 'moderatorManagement',
      icon: Shield,
      label: isArabic ? 'إدارة المشرفين' : 'Staff Management',
      description: isArabic ? 'إضافة/حذف مشرفين، الصلاحيات، سجل الأنشطة' : 'Add/remove staff, permissions, activity log',
      color: 'from-purple-500 to-purple-600',
      onClick: () => openModal('moderatorManagement')
    },
    {
      id: 'productManagement',
      icon: Package,
      label: isArabic ? 'إدارة المنتجات' : 'Product Management',
      description: isArabic ? 'إضافة/تعديل/حذف المنتجات' : 'Add/edit/delete products',
      color: 'from-orange-500 to-orange-600',
      onClick: () => openModal('productManagement')
    },
    {
      id: 'orderManagement',
      icon: ShoppingBag,
      label: isArabic ? 'إدارة الطلبات' : 'Order Management',
      description: isArabic ? 'مراجعة الطلبات، تغيير الحالة، الملاحظات' : 'Review orders, change status, notes',
      color: 'from-teal-500 to-teal-600',
      onClick: () => openModal('orderManagement')
    },
    {
      id: 'marketing',
      icon: Tag,
      label: isArabic ? 'التسويق والعروض' : 'Marketing & Promotions',
      description: isArabic ? 'كوبونات الخصم، العروض المحدودة' : 'Discount coupons, limited offers',
      color: 'from-pink-500 to-pink-600',
      onClick: () => openModal('marketing')
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: isArabic ? 'التحليلات والإحصائيات' : 'Analytics & Statistics',
      description: isArabic ? 'المبيعات، أفضل المنتجات، التقارير' : 'Sales, top products, reports',
      color: 'from-indigo-500 to-indigo-600',
      onClick: () => openModal('analytics')
    },
    {
      id: 'ticketManagement',
      icon: Ticket,
      label: isArabic ? 'إدارة التذاكر' : 'Ticket Management',
      description: isArabic ? 'مراجعة تذاكر الدعم، الرد على العملاء' : 'Review support tickets, reply to customers',
      color: 'from-cyan-500 to-cyan-600',
      onClick: () => openModal('ticketManagement')
    },
    {
      id: 'staticPages',
      icon: FileText,
      label: isArabic ? 'الصفحات الثابتة' : 'Static Pages',
      description: isArabic ? 'من نحن، سياسة الإرجاع، وقت التسليم' : 'About us, return policy, delivery time',
      color: 'from-emerald-500 to-emerald-600',
      onClick: () => openModal('staticPages')
    },
      {
        id: 'faqManagement',
        icon: HelpCircle,
        label: isArabic ? 'إدارة الأسئلة الشائعة' : 'FAQ Management',
        description: isArabic ? 'إضافة/تعديل/حذف الأسئلة الشائعة' : 'Add/edit/delete FAQs',
        color: 'from-sky-500 to-sky-600',
        onClick: () => openModal('faqManagement')
      },
      {
        id: 'customerManagement',
        icon: Users,
        label: isArabic ? 'إدارة العملاء' : 'Customer Management',
        description: isArabic ? 'البحث، الملاحظات، الحظر' : 'Search, notes, ban',
        color: 'from-violet-500 to-violet-600',
        onClick: () => openModal('customerManagement')
      },
      {
        id: 'reviewManagement',
        icon: Star,
        label: isArabic ? 'إدارة التقييمات' : 'Review Management',
        description: isArabic ? 'اعتماد/رفض التقييمات، الرد' : 'Approve/reject reviews, reply',
        color: 'from-amber-500 to-amber-600',
        onClick: () => openModal('reviewManagement')
      },
      {
        id: 'loyaltyManagement',
        icon: Gift,
        label: isArabic ? 'إدارة نقاط الولاء' : 'Loyalty Management',
        description: isArabic ? 'إعدادات النقاط، الإحالات' : 'Points settings, referrals',
        color: 'from-rose-500 to-rose-600',
        onClick: () => openModal('loyaltyManagement')
      },
      {
        id: 'couponManagement',
        icon: Percent,
        label: isArabic ? 'إدارة الكوبونات' : 'Coupon Management',
        description: isArabic ? 'إنشاء/تعديل كوبونات الخصم' : 'Create/edit discount coupons',
        color: 'from-lime-500 to-lime-600',
        onClick: () => openModal('couponManagement')
      },
          {
            id: 'gameCategoryManagement',
            icon: Gamepad2,
            label: isArabic ? 'إدارة الألعاب والفئات' : 'Games & Categories',
            description: isArabic ? 'إضافة/تعديل/حذف الألعاب والفئات' : 'Add/edit/delete games & categories',
            color: 'from-fuchsia-500 to-fuchsia-600',
            onClick: () => openModal('gameCategoryManagement')
          },
          {
            id: 'clearCache',
            icon: Trash2,
            label: isArabic ? 'مسح الكاش' : 'Clear Cache',
            description: isArabic ? 'مسح الذاكرة المؤقتة للمتصفح' : 'Clear browser cache',
            color: 'from-red-500 to-red-600',
            onClick: clearCache
          }
        ];

  return (
    <div className="min-h-screen bg-gray-100" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎮</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">{isArabic ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}</h1>
                <p className="text-purple-200 text-sm">{isArabic ? 'إدارة المتجر بالكامل' : 'Complete store management'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isArabic ? 'العودة للمتجر' : 'Back to Store'}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                {isArabic ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{isArabic ? 'إجمالي الطلبات' : 'Total Orders'}</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{isArabic ? 'قيد الانتظار' : 'Pending'}</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{isArabic ? 'مكتمل' : 'Completed'}</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{isArabic ? 'الإيرادات' : 'Revenue'}</p>
                <p className="text-3xl font-bold text-gray-800">${stats.revenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Panel Buttons */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <LayoutDashboard size={24} />
            {isArabic ? 'لوحة التحكم' : 'Control Panel'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {adminButtons.map(button => (
              <button
                key={button.id}
                onClick={button.onClick}
                className={`p-6 rounded-xl bg-gradient-to-br ${button.color} text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200`}
              >
                <button.icon size={32} className="mb-3" />
                <h3 className="font-bold text-lg mb-1">{button.label}</h3>
                <p className="text-sm opacity-80">{button.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Orders Quick View */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {isArabic ? 'أحدث الطلبات' : 'Recent Orders'}
            </h3>
            <button
              onClick={() => openModal('orderManagement')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {isArabic ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className={`pb-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                      {isArabic ? 'رقم الطلب' : 'Order ID'}
                    </th>
                    <th className={`pb-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                      {isArabic ? 'المستخدم' : 'User'}
                    </th>
                    <th className={`pb-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                      {isArabic ? 'المبلغ' : 'Amount'}
                    </th>
                    <th className={`pb-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                      {isArabic ? 'الحالة' : 'Status'}
                    </th>
                    <th className={`pb-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                      {isArabic ? 'التاريخ' : 'Date'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 font-mono text-sm">{order.id.slice(-8)}</td>
                      <td className="py-3">{order.customerInfo.robloxUsername}</td>
                      <td className="py-3 font-bold">${order.total.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status === 'pending' ? (isArabic ? 'قيد الانتظار' : 'Pending') :
                           order.status === 'completed' ? (isArabic ? 'مكتمل' : 'Completed') :
                           (isArabic ? 'فشل' : 'Failed')}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-sm">
                        {new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {isArabic ? 'لا توجد طلبات بعد' : 'No orders yet'}
            </p>
          )}
        </div>
      </main>

      {/* Modals */}
      <SiteManagementModal 
        isOpen={modals.siteManagement} 
        onClose={() => closeModal('siteManagement')} 
      />
      <UserManagementModal 
        isOpen={modals.userManagement} 
        onClose={() => closeModal('userManagement')} 
      />
      <ModeratorManagementModal 
        isOpen={modals.moderatorManagement} 
        onClose={() => closeModal('moderatorManagement')} 
      />
      <ProductManagementModal 
        isOpen={modals.productManagement} 
        onClose={() => closeModal('productManagement')} 
      />
      <OrderManagementModal 
        isOpen={modals.orderManagement} 
        onClose={() => closeModal('orderManagement')} 
      />
      <MarketingModal 
        isOpen={modals.marketing} 
        onClose={() => closeModal('marketing')} 
      />
      <AnalyticsModal 
        isOpen={modals.analytics} 
        onClose={() => closeModal('analytics')} 
      />
      <TicketManagementModal 
        isOpen={modals.ticketManagement} 
        onClose={() => closeModal('ticketManagement')} 
      />
      <StaticPagesModal 
        isOpen={modals.staticPages} 
        onClose={() => closeModal('staticPages')} 
      />
      <FAQManagementModal 
        isOpen={modals.faqManagement} 
        onClose={() => closeModal('faqManagement')} 
      />
      <CustomerManagementModal 
        isOpen={modals.customerManagement} 
        onClose={() => closeModal('customerManagement')} 
      />
      <ReviewManagementModal 
        isOpen={modals.reviewManagement} 
        onClose={() => closeModal('reviewManagement')} 
      />
      <LoyaltyManagementModal 
        isOpen={modals.loyaltyManagement} 
        onClose={() => closeModal('loyaltyManagement')} 
      />
      <CouponManagementModal 
        isOpen={modals.couponManagement} 
        onClose={() => closeModal('couponManagement')} 
      />
      <GameCategoryManagementModal 
        isOpen={modals.gameCategoryManagement} 
        onClose={() => closeModal('gameCategoryManagement')} 
      />
    </div>
  );
};

export default AdminDashboard;
