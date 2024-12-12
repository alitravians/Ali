import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-lg rtl" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex space-x-4 space-x-reverse">
            <Link to="" className="text-gray-800 hover:text-gray-600">الرئيسية</Link>
            <Link to="rules" className="text-gray-800 hover:text-gray-600">القوانين</Link>
            <Link to="join-moderators" className="text-gray-800 hover:text-gray-600">انضمام المشرفين</Link>
            <Link to="request-trend" className="text-gray-800 hover:text-gray-600">طلب الترند</Link>
            <Link to="team" className="text-gray-800 hover:text-gray-600">فريق العمل</Link>
          </div>
          <Link to="admin/login" className="text-gray-800 hover:text-gray-600">تسجيل الدخول</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
