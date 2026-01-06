import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Package, Users, DollarSign, Download } from 'lucide-react';
import Modal from './Modal';
import { getDailySales, getTopProducts, getTopBuyers, getOrders } from '../../services/firebase';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DailySale {
  date: string;
  orders: number;
  revenue: number;
}

interface TopProduct {
  productId: string;
  name_en: string;
  name_ar: string;
  totalSold: number;
  revenue: number;
}

interface TopBuyer {
  robloxUsername: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [sales, products, buyers, orders] = await Promise.all([
        getDailySales(period),
        getTopProducts(period),
        getTopBuyers(period),
        getOrders()
      ]);
      
      setDailySales(sales);
      setTopProducts(products.slice(0, 5));
      setTopBuyers(buyers.slice(0, 5));
      
      // Calculate stats
      const completedOrders = orders.filter(o => o.status === 'completed');
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
      const totalOrders = completedOrders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        conversionRate: orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const exportData = () => {
    const data = {
      period: `${period} days`,
      exportDate: new Date().toISOString(),
      stats,
      dailySales,
      topProducts,
      topBuyers
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}days-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxRevenue = Math.max(...dailySales.map(d => d.revenue), 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isArabic ? 'التحليلات والإحصائيات' : 'Analytics & Statistics'} size="xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {[7, 30, 90].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as 7 | 30 | 90)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p} {isArabic ? 'يوم' : 'days'}
            </button>
          ))}
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={18} />
          {isArabic ? 'تصدير' : 'Export'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={20} />
                <span className="text-sm opacity-80">{isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}</span>
              </div>
              <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <Package size={20} />
                <span className="text-sm opacity-80">{isArabic ? 'إجمالي الطلبات' : 'Total Orders'}</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} />
                <span className="text-sm opacity-80">{isArabic ? 'متوسط الطلب' : 'Avg Order'}</span>
              </div>
              <p className="text-2xl font-bold">${stats.avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={20} />
                <span className="text-sm opacity-80">{isArabic ? 'معدل التحويل' : 'Conversion'}</span>
              </div>
              <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} />
              {isArabic ? 'المبيعات اليومية' : 'Daily Sales'}
            </h4>
            <div className="flex items-end gap-1 h-40">
              {dailySales.slice(-14).map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                    style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: day.revenue > 0 ? '4px' : '0' }}
                    title={`$${day.revenue.toFixed(2)}`}
                  />
                  <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products & Buyers */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Package size={18} />
                {isArabic ? 'أفضل المنتجات' : 'Top Products'}
              </h4>
              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{isArabic ? 'لا توجد بيانات' : 'No data'}</p>
                ) : (
                  topProducts.map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-purple-500'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-gray-800">{isArabic ? product.name_ar : product.name_en}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${product.revenue.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{product.totalSold} {isArabic ? 'مبيعات' : 'sold'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Buyers */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={18} />
                {isArabic ? 'أفضل المشترين' : 'Top Buyers'}
              </h4>
              <div className="space-y-3">
                {topBuyers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{isArabic ? 'لا توجد بيانات' : 'No data'}</p>
                ) : (
                  topBuyers.map((buyer, index) => (
                    <div key={buyer.robloxUsername} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-purple-500'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-gray-800">{buyer.robloxUsername}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${buyer.totalSpent.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{buyer.totalOrders} {isArabic ? 'طلب' : 'orders'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default AnalyticsModal;
