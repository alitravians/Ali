import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Ban, UserCheck, Search, Trophy, X } from 'lucide-react';
import Modal from './Modal';
import { subscribeCustomers, banCustomer, unbanCustomer, getTopBuyers } from '../../services/firebase';
import type { Customer, TopBuyer } from '../../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'banned' | 'top'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [banModal, setBanModal] = useState<{ isOpen: boolean; customer: Customer | null; reason: string }>({
    isOpen: false,
    customer: null,
    reason: ''
  });

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeCustomers(setCustomers);
      loadTopBuyers();
      setLoading(false);
      return () => unsubscribe();
    }
  }, [isOpen]);

  const loadTopBuyers = async () => {
    try {
      const buyers = await getTopBuyers(30);
      setTopBuyers(buyers);
    } catch (error) {
      console.error('Error loading top buyers:', error);
    }
  };

  const handleBan = async () => {
    if (!banModal.customer || !banModal.reason) return;
    try {
      await banCustomer(banModal.customer.id, banModal.reason, 'admin');
      setBanModal({ isOpen: false, customer: null, reason: '' });
      alert(isArabic ? 'تم حظر المستخدم بنجاح' : 'User banned successfully');
    } catch (error) {
      console.error('Error banning user:', error);
      alert(isArabic ? 'حدث خطأ أثناء الحظر' : 'Error banning user');
    }
  };

  const handleUnban = async (customer: Customer) => {
    try {
      await unbanCustomer(customer.id);
      alert(isArabic ? 'تم رفع الحظر بنجاح' : 'User unbanned successfully');
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert(isArabic ? 'حدث خطأ أثناء رفع الحظر' : 'Error unbanning user');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.robloxUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'banned') return c.isBanned && matchesSearch;
    if (activeTab === 'all') return !c.isBanned && matchesSearch;
    return matchesSearch;
  });

  const tabs = [
    { id: 'all', label: isArabic ? 'جميع المستخدمين' : 'All Users', icon: Users },
    { id: 'banned', label: isArabic ? 'المحظورين' : 'Banned', icon: Ban },
    { id: 'top', label: isArabic ? 'الأكثر شراءً' : 'Top Buyers', icon: Trophy },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isArabic ? 'إدارة المستخدمين' : 'User Management'} size="xl">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== 'top' && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : activeTab === 'top' ? (
        /* Top Buyers */
        <div className="space-y-3">
          {topBuyers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isArabic ? 'لا توجد بيانات' : 'No data available'}
            </div>
          ) : (
            topBuyers.map((buyer, index) => (
              <div key={buyer.robloxUsername} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-purple-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{buyer.robloxUsername}</p>
                    <p className="text-sm text-gray-500">{buyer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${buyer.totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">
                    {buyer.totalOrders} {isArabic ? 'طلب' : 'orders'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Users List */
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isArabic ? 'لا يوجد مستخدمين' : 'No users found'}
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-bold text-gray-800">{customer.robloxUsername}</p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                  {customer.isBanned && (
                    <p className="text-sm text-red-500 mt-1">
                      {isArabic ? 'سبب الحظر: ' : 'Ban reason: '}{customer.banReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {customer.isBanned ? (
                    <button
                      onClick={() => handleUnban(customer)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <UserCheck size={16} />
                      {isArabic ? 'رفع الحظر' : 'Unban'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setBanModal({ isOpen: true, customer, reason: '' })}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Ban size={16} />
                      {isArabic ? 'حظر' : 'Ban'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ban Modal */}
      {banModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBanModal({ isOpen: false, customer: null, reason: '' })} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                {isArabic ? 'حظر المستخدم' : 'Ban User'}
              </h4>
              <button onClick={() => setBanModal({ isOpen: false, customer: null, reason: '' })}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              {isArabic ? 'هل أنت متأكد من حظر ' : 'Are you sure you want to ban '}
              <strong>{banModal.customer?.robloxUsername}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isArabic ? 'سبب الحظر' : 'Ban Reason'}
              </label>
              <textarea
                value={banModal.reason}
                onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder={isArabic ? 'أدخل سبب الحظر...' : 'Enter ban reason...'}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBanModal({ isOpen: false, customer: null, reason: '' })}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleBan}
                disabled={!banModal.reason}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400"
              >
                {isArabic ? 'تأكيد الحظر' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default UserManagementModal;
