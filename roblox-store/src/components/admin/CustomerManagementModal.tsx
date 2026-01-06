import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, Users, User, Mail, Gamepad2, Hash, Calendar, ShoppingBag, AlertTriangle, Ban, CheckCircle, MessageSquare, Edit2 } from 'lucide-react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../firebase/config';

interface Customer {
  id: string;
  username: string;
  email: string;
  robloxUsername: string;
  robloxId: string;
  createdAt: string;
  lastLogin: string;
  isBanned?: boolean;
  banReason?: string;
  notes?: string;
  tags?: string[];
}

interface Order {
  id: string;
  customerId: string;
  total: number;
  status: string;
  createdAt: string;
}

interface CustomerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerManagementModal: React.FC<CustomerManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'username' | 'email' | 'robloxUsername' | 'robloxId'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');

  useEffect(() => {
    const customersRef = ref(database, 'customers');
    const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const customersList = Object.entries(data).map(([id, customer]) => ({
          id,
          ...(customer as Omit<Customer, 'id'>)
        }));
        customersList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setCustomers(customersList);
      } else {
        setCustomers([]);
      }
      setLoading(false);
    });

    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersList = Object.entries(data).map(([id, order]) => ({
          id,
          ...(order as Omit<Order, 'id'>)
        }));
        setOrders(ordersList);
      } else {
        setOrders([]);
      }
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
    };
  }, []);

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    switch (searchType) {
      case 'username':
        return customer.username.toLowerCase().includes(query);
      case 'email':
        return customer.email.toLowerCase().includes(query);
      case 'robloxUsername':
        return customer.robloxUsername?.toLowerCase().includes(query);
      case 'robloxId':
        return customer.robloxId?.toLowerCase().includes(query);
      default:
        return (
          customer.username.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.robloxUsername?.toLowerCase().includes(query) ||
          customer.robloxId?.toLowerCase().includes(query)
        );
    }
  });

  const getCustomerOrders = (customerId: string) => {
    return orders.filter(order => order.customerId === customerId);
  };

  const getCustomerStats = (customerId: string) => {
    const customerOrders = getCustomerOrders(customerId);
    const totalSpent = customerOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      orderCount: customerOrders.length,
      totalSpent
    };
  };

  const handleBan = async () => {
    if (!selectedCustomer) return;
    try {
      await update(ref(database, `customers/${selectedCustomer.id}`), {
        isBanned: true,
        banReason
      });
      setShowBanModal(false);
      setBanReason('');
    } catch (error) {
      console.error('Error banning customer:', error);
    }
  };

  const handleUnban = async (customerId: string) => {
    try {
      await update(ref(database, `customers/${customerId}`), {
        isBanned: false,
        banReason: null
      });
    } catch (error) {
      console.error('Error unbanning customer:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    try {
      await update(ref(database, `customers/${selectedCustomer.id}`), {
        notes: customerNotes
      });
      setEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users size={24} />
            {isArabic ? 'إدارة العملاء' : 'Customer Management'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Customer List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Search size={18} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isArabic ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isArabic ? 'بحث عن عميل...' : 'Search customer...'}
                    className={`w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'all', label_ar: 'الكل', label_en: 'All' },
                  { id: 'username', label_ar: 'اسم المستخدم', label_en: 'Username' },
                  { id: 'email', label_ar: 'البريد', label_en: 'Email' },
                  { id: 'robloxUsername', label_ar: 'روبلوكس', label_en: 'Roblox' },
                  { id: 'robloxId', label_ar: 'ID روبلوكس', label_en: 'Roblox ID' }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSearchType(type.id as typeof searchType)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      searchType === type.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {isArabic ? type.label_ar : type.label_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>{isArabic ? 'لا يوجد عملاء' : 'No customers found'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const stats = getCustomerStats(customer.id);
                  return (
                    <div
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerNotes(customer.notes || '');
                      }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedCustomer?.id === customer.id ? 'bg-indigo-50' : ''
                      } ${customer.isBanned ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${customer.isBanned ? 'bg-red-100' : 'bg-indigo-100'}`}>
                          {customer.isBanned ? (
                            <Ban size={20} className="text-red-600" />
                          ) : (
                            <User size={20} className="text-indigo-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800 truncate">{customer.username}</p>
                            {customer.isBanned && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                                {isArabic ? 'محظور' : 'Banned'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">{stats.orderCount} {isArabic ? 'طلب' : 'orders'}</p>
                          <p className="text-xs text-gray-500">${stats.totalSpent.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="w-1/2 overflow-y-auto bg-gray-50">
            {selectedCustomer ? (
              <div className="p-6">
                {/* Customer Header */}
                <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedCustomer.isBanned ? 'bg-red-100' : 'bg-indigo-100'}`}>
                        <User size={32} className={selectedCustomer.isBanned ? 'text-red-600' : 'text-indigo-600'} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{selectedCustomer.username}</h3>
                        {selectedCustomer.isBanned && (
                          <p className="text-sm text-red-600">
                            {isArabic ? 'محظور: ' : 'Banned: '}{selectedCustomer.banReason}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedCustomer.isBanned ? (
                      <button
                        onClick={() => handleUnban(selectedCustomer.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle size={18} />
                        {isArabic ? 'إلغاء الحظر' : 'Unban'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowBanModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Ban size={18} />
                        {isArabic ? 'حظر' : 'Ban'}
                      </button>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={16} />
                      <span className="text-sm">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Gamepad2 size={16} />
                      <span className="text-sm">{selectedCustomer.robloxUsername || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Hash size={16} />
                      <span className="text-sm">{selectedCustomer.robloxId || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span className="text-sm">
                        {new Date(selectedCustomer.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <MessageSquare size={18} />
                      {isArabic ? 'ملاحظات داخلية' : 'Internal Notes'}
                    </h4>
                    {!editingNotes && (
                      <button
                        onClick={() => setEditingNotes(true)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div>
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder={isArabic ? 'أضف ملاحظات عن هذا العميل...' : 'Add notes about this customer...'}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSaveNotes}
                          className="px-4 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          {isArabic ? 'حفظ' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotes(false);
                            setCustomerNotes(selectedCustomer.notes || '');
                          }}
                          className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {isArabic ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.notes || (isArabic ? 'لا توجد ملاحظات' : 'No notes')}
                    </p>
                  )}
                </div>

                {/* Orders */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-4">
                    <ShoppingBag size={18} />
                    {isArabic ? 'الطلبات' : 'Orders'}
                  </h4>
                  {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {isArabic ? 'لا توجد طلبات' : 'No orders'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getCustomerOrders(selectedCustomer.id).slice(0, 5).map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">#{order.id.slice(-6)}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${order.total?.toFixed(2) || '0.00'}</p>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              order.status === 'completed' ? 'bg-green-100 text-green-600' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <User size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{isArabic ? 'اختر عميل لعرض التفاصيل' : 'Select a customer to view details'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ban Modal */}
        {showBanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-600" />
                {isArabic ? 'حظر العميل' : 'Ban Customer'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isArabic 
                  ? `هل أنت متأكد من حظر ${selectedCustomer?.username}؟`
                  : `Are you sure you want to ban ${selectedCustomer?.username}?`}
              </p>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={isArabic ? 'سبب الحظر...' : 'Ban reason...'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleBan}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  {isArabic ? 'حظر' : 'Ban'}
                </button>
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setBanReason('');
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagementModal;
