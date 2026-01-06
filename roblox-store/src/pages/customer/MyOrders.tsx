import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ShoppingBag, LogOut, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { database } from '../../firebase/config';

interface OrderItem {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'processing';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  proofImage?: string;
}

const MyOrders: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { customer, isLoggedIn, isLoading, logout } = useCustomerAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const isArabic = i18n.language === 'ar';

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/customer/auth');
    }
  }, [isLoading, isLoggedIn, navigate]);

  // Load customer orders
  useEffect(() => {
    if (!customer?.email) return;

    const ordersRef = ref(database, 'orders');
    const customerOrdersQuery = query(
      ordersRef,
      orderByChild('customerInfo/email'),
      equalTo(customer.email)
    );

    const unsubscribe = onValue(customerOrdersQuery, (snapshot) => {
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const ordersList = Object.entries(ordersData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));
        // Sort by date (newest first)
        ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(ordersList);
      } else {
        setOrders([]);
      }
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [customer?.email]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock size={20} />,
          color: 'text-yellow-600 bg-yellow-100',
          label: isArabic ? 'قيد المراجعة' : 'Pending Review'
        };
      case 'processing':
        return {
          icon: <AlertCircle size={20} />,
          color: 'text-blue-600 bg-blue-100',
          label: isArabic ? 'قيد المعالجة' : 'Processing'
        };
      case 'completed':
        return {
          icon: <CheckCircle size={20} />,
          color: 'text-green-600 bg-green-100',
          label: isArabic ? 'مكتمل' : 'Completed'
        };
      case 'cancelled':
        return {
          icon: <XCircle size={20} />,
          color: 'text-red-600 bg-red-100',
          label: isArabic ? 'ملغي' : 'Cancelled'
        };
      default:
        return {
          icon: <Clock size={20} />,
          color: 'text-gray-600 bg-gray-100',
          label: status
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {isArabic ? `مرحباً، ${customer?.username}` : `Welcome, ${customer?.username}`}
                </h1>
                <p className="text-purple-200 text-sm">{customer?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ShoppingBag size={18} />
                <span>{isArabic ? 'المتجر' : 'Store'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <LogOut size={18} />
                <span>{isArabic ? 'خروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Package size={28} className="text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {isArabic ? 'طلباتي' : 'My Orders'}
          </h2>
          <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
            {orders.length}
          </span>
        </div>

        {loadingOrders ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              {isArabic ? 'لا توجد طلبات' : 'No Orders Yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {isArabic ? 'لم تقم بأي طلبات بعد. تصفح المتجر وابدأ التسوق!' : "You haven't placed any orders yet. Browse the store and start shopping!"}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              {isArabic ? 'تصفح المنتجات' : 'Browse Products'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const isExpanded = expandedOrder === order.id;

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${statusInfo.color}`}>
                          {statusInfo.icon}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {isArabic ? `طلب #${order.id.slice(-8)}` : `Order #${order.id.slice(-8)}`}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-purple-600">${order.total.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Details (Expanded) */}
                  {isExpanded && (
                    <div className="border-t px-4 py-4 bg-gray-50">
                      <h4 className="font-bold text-gray-700 mb-3">
                        {isArabic ? 'تفاصيل الطلب' : 'Order Details'}
                      </h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">
                                {isArabic ? item.name_ar : item.name_en}
                              </p>
                              <p className="text-sm text-gray-500">x{item.quantity}</p>
                            </div>
                            <p className="font-bold text-gray-800">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Order Info */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{isArabic ? 'طريقة الدفع' : 'Payment Method'}</p>
                          <p className="font-medium text-gray-800">
                            {order.paymentMethod === 'gamepass' 
                              ? (isArabic ? 'Game Pass (Robux)' : 'Game Pass (Robux)')
                              : 'PayPal'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">{isArabic ? 'آخر تحديث' : 'Last Updated'}</p>
                          <p className="font-medium text-gray-800">{formatDate(order.updatedAt)}</p>
                        </div>
                      </div>

                      {/* Status Message */}
                      {order.status === 'pending' && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-yellow-800 text-sm">
                            {isArabic 
                              ? '⏳ طلبك قيد المراجعة. سيتم تحديث الحالة بعد التحقق من الدفع.'
                              : '⏳ Your order is under review. Status will be updated after payment verification.'
                            }
                          </p>
                        </div>
                      )}
                      {order.status === 'completed' && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-800 text-sm">
                            {isArabic 
                              ? '✅ تم إكمال طلبك بنجاح! تم تسليم العناصر.'
                              : '✅ Your order has been completed! Items have been delivered.'
                            }
                          </p>
                        </div>
                      )}
                      {order.status === 'cancelled' && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-800 text-sm">
                            {isArabic 
                              ? '❌ تم إلغاء هذا الطلب. تواصل معنا للمزيد من المعلومات.'
                              : '❌ This order has been cancelled. Contact us for more information.'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
