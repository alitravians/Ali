import React from 'react';
import { Link } from 'react-router-dom';

const Welcome: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">وكالة العاصي</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="rules" className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">القوانين</h2>
          <p>تعرف على قوانين وشروط الوكالة</p>
        </Link>
        <Link to="join-moderators" className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">انضمام المشرفين</h2>
          <p>طلب الانضمام كمشرف في الوكالة</p>
        </Link>
        <Link to="request-trend" className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">طلب تريند</h2>
          <p>تقديم طلب للحصول على تريند</p>
        </Link>
        <Link to="team" className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">فريق العمل</h2>
          <p>تعرف على فريق العمل في الوكالة</p>
        </Link>
      </div>
    </div>
  );
};

export default Welcome;
