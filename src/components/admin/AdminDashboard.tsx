import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

const AdminDashboard: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    window.location.href = '/';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <Button onClick={handleLogout} variant="outline">تسجيل الخروج</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/admin/edit-countdown" className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">تعديل العد التنازلي</h2>
        </Link>
        <Link to="/admin/edit-team" className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">تعديل الفريق</h2>
        </Link>
        <Link to="/admin/edit-updates" className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">تعديل التحديثات</h2>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
