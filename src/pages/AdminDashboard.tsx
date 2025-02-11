import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { handleApiError } from '@/lib/errors';
import { StudentManagement } from '../components/admin/StudentManagement';
import { BookManagement } from '../components/admin/BookManagement';
import { LoanManagement } from '../components/admin/LoanManagement';
import { RuleManagement } from '../components/admin/RuleManagement';

interface SystemStats {
  total_students: number;
  total_books: number;
  active_loans: number;
  overdue_loans: number;
  total_rules: number;
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'books' | 'loans' | 'rules'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    is_enabled: false,
    message: '',
    allow_admin_access: true
  });

  const toggleMaintenance = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/maintenance/config`,
        {
          is_enabled: !maintenanceConfig.is_enabled,
          message: maintenanceConfig.message || 'النظام تحت الصيانة حالياً',
          allow_admin_access: maintenanceConfig.allow_admin_access
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setMaintenanceConfig(prev => ({
        ...prev,
        is_enabled: !prev.is_enabled
      }));
    } catch (err) {
      const errorMessage = handleApiError(err, 'فشل في تحديث حالة الصيانة');
      setError(errorMessage);
      console.error('Error toggling maintenance mode:', err);
    }
  };

  useEffect(() => {
    const fetchMaintenanceConfig = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/maintenance/status`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setMaintenanceConfig(response.data);
      } catch (err) {
        console.error('Error fetching maintenance config:', err);
      }
    };

    if (isAdmin) {
      fetchMaintenanceConfig();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<SystemStats>(
          `${import.meta.env.VITE_API_URL}/admin/stats`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setStats(response.data);
      } catch (err) {
        const errorMessage = handleApiError(err, 'فشل في تحميل إحصائيات النظام');
        setError(errorMessage);
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 font-semibold">Access Denied</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">لوحة تحكم المشرف</h2>
      
      {/* Navigation Tabs */}
      <div className="flex flex-row-reverse gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500' : ''}`}
        >
          نظرة عامة
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 ${activeTab === 'students' ? 'border-b-2 border-blue-500' : ''}`}
        >
          إدارة الطلاب
        </button>
        <button
          onClick={() => setActiveTab('books')}
          className={`px-4 py-2 ${activeTab === 'books' ? 'border-b-2 border-blue-500' : ''}`}
        >
          إدارة الكتب
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 ${activeTab === 'loans' ? 'border-b-2 border-blue-500' : ''}`}
        >
          إدارة الاستعارات
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 ${activeTab === 'rules' ? 'border-b-2 border-blue-500' : ''}`}
        >
          إدارة القوانين
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>إجمالي الطلاب</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.total_students || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>إجمالي الكتب</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.total_books || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>الاستعارات النشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.active_loans || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>الاستعارات المتأخرة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">{stats?.overdue_loans || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>إجمالي القوانين</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.total_rules || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>حالة النظام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold">وضع الصيانة:</span>
                  <button
                    onClick={toggleMaintenance}
                    className={`px-4 py-2 rounded ${
                      maintenanceConfig.is_enabled
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {maintenanceConfig.is_enabled ? 'إيقاف الصيانة' : 'تفعيل الصيانة'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">السماح للمشرفين بالدخول:</span>
                  <input
                    type="checkbox"
                    checked={maintenanceConfig.allow_admin_access}
                    onChange={(e) => setMaintenanceConfig(prev => ({
                      ...prev,
                      allow_admin_access: e.target.checked
                    }))}
                    className="w-4 h-4"
                  />
                </div>
                <div className="space-y-2">
                  <span className="font-bold block">رسالة الصيانة:</span>
                  <textarea
                    value={maintenanceConfig.message}
                    onChange={(e) => setMaintenanceConfig(prev => ({
                      ...prev,
                      message: e.target.value
                    }))}
                    placeholder="النظام تحت الصيانة حالياً"
                    className="w-full p-2 border rounded text-right"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students Management Tab */}
      {activeTab === 'students' && <StudentManagement />}

      {/* Books Management Tab */}
      {activeTab === 'books' && <BookManagement />}

      {/* Loans Management Tab */}
      {activeTab === 'loans' && <LoanManagement />}

      {/* Rules Management Tab */}
      {activeTab === 'rules' && <RuleManagement />}
    </div>
  );
}
