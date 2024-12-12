import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setAdminAuthenticated, clearAdminAuth, isAdminAuthenticated } from '@/utils/localStorage';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === '3131') {
      setAdminAuthenticated(password);
      if (isAdminAuthenticated()) {
        navigate('/admin');  // Changed from '/admin/dashboard' to '/admin' to match routes
      }
    } else {
      setError('كلمة المرور غير صحيحة');
      clearAdminAuth();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">تسجيل الدخول للوحة التحكم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              className="text-right"
              dir="rtl"
              devinid="password-input"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
              className="w-full"
              onClick={handleLogin}
              devinid="login-button"
            >
              دخول
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
