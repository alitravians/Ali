import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { isAdminAuthenticated, clearAdminAuth } from '@/utils/localStorage';

export function AdminDashboard() {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    clearAdminAuth();
    navigate('/admin/login');
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">لوحة التحكم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/admin/rules')}
              className="w-full text-right"
              variant="outline"
              devinid="admin-rules-button"
            >
              تعديل قوانين وكالة العاصي
            </Button>

            <Button
              onClick={() => navigate('/admin/join-moderators')}
              className="w-full text-right"
              variant="outline"
              devinid="admin-moderators-button"
            >
              تعديل طريقة الانضمام للمشرفين
            </Button>

            <Button
              onClick={() => navigate('/admin/request-trend')}
              className="w-full text-right"
              variant="outline"
              devinid="admin-trend-button"
            >
              تعديل طريقة طلب الترند
            </Button>

            <Button
              onClick={() => navigate('/admin/team')}
              className="w-full text-right"
              variant="outline"
              devinid="admin-team-button"
            >
              إدارة فريق العمل
            </Button>

            <Button
              onClick={() => navigate('/admin/countdown')}
              className="w-full text-right"
              variant="outline"
              devinid="admin-countdown-button"
            >
              إعدادات العد التنازلي
            </Button>

            <Button
              onClick={() => navigate('/admin/updates')}
              className="w-full text-right"
              variant="outline"
              devinid="admin-updates-button"
            >
              إدارة التحديثات
            </Button>

            <hr className="my-4" />

            <Button
              onClick={handleLogout}
              className="w-full"
              variant="destructive"
              devinid="admin-logout-button"
            >
              تسجيل الخروج
            </Button>

            <Button
              onClick={() => navigate('/')}
              className="w-full mt-2"
              variant="secondary"
              devinid="admin-home-button"
            >
              الرجوع للصفحة الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
