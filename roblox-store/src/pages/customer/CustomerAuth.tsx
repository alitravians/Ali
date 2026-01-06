import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, Gamepad2, LogIn, UserPlus, Hash } from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';

type AuthMode = 'login' | 'register';

const CustomerAuth: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, register } = useCustomerAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');
  const [robloxId, setRobloxId] = useState('');

  const isArabic = i18n.language === 'ar';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/my-orders');
    } else {
      setError(result.error || (isArabic ? 'فشل تسجيل الدخول' : 'Login failed'));
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(isArabic ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError(isArabic ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    const result = await register({
      username,
      email,
      robloxUsername,
      robloxId,
      password
    });

    if (result.success) {
      navigate('/my-orders');
    } else {
      setError(result.error || (isArabic ? 'فشل التسجيل' : 'Registration failed'));
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {mode === 'login' ? (
              <LogIn size={32} className="text-white" />
            ) : (
              <UserPlus size={32} className="text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'login' 
              ? (isArabic ? 'تسجيل الدخول' : 'Login')
              : (isArabic ? 'إنشاء حساب جديد' : 'Create Account')
            }
          </h1>
          <p className="text-purple-200 mt-2">
            {mode === 'login'
              ? (isArabic ? 'أدخل بياناتك للوصول لحسابك' : 'Enter your credentials to access your account')
              : (isArabic ? 'سجل الآن لتتبع طلباتك' : 'Register now to track your orders')
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <>
              {/* Username */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  {isArabic ? 'اسم المستخدم' : 'Username'}
                </label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={isArabic ? 'أدخل اسم المستخدم' : 'Enter username'}
                  />
                </div>
              </div>

              {/* Roblox Username */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  {isArabic ? 'اسم مستخدم روبلوكس' : 'Roblox Username'}
                </label>
                <div className="relative">
                  <Gamepad2 size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={robloxUsername}
                    onChange={(e) => setRobloxUsername(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={isArabic ? 'أدخل اسم مستخدم روبلوكس' : 'Enter Roblox username'}
                  />
                </div>
              </div>

              {/* Roblox ID */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  {isArabic ? 'رقم حساب روبلوكس (ID)' : 'Roblox Account ID'}
                </label>
                <div className="relative">
                  <Hash size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={robloxId}
                    onChange={(e) => setRobloxId(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={isArabic ? 'أدخل رقم حساب روبلوكس' : 'Enter Roblox account ID'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isArabic ? 'يمكنك إيجاد رقم حسابك من صفحة الملف الشخصي في روبلوكس' : 'You can find your ID from your Roblox profile page'}
                </p>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {isArabic ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={isArabic ? 'أدخل البريد الإلكتروني' : 'Enter email'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {isArabic ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={isArabic ? 'أدخل كلمة المرور' : 'Enter password'}
              />
            </div>
          </div>

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={isArabic ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? (isArabic ? 'جاري التحميل...' : 'Loading...')
              : mode === 'login'
                ? (isArabic ? 'تسجيل الدخول' : 'Login')
                : (isArabic ? 'إنشاء حساب' : 'Create Account')
            }
          </button>

          {/* Toggle Mode */}
          <div className="text-center pt-4 border-t">
            <p className="text-gray-600">
              {mode === 'login'
                ? (isArabic ? 'ليس لديك حساب؟' : "Don't have an account?")
                : (isArabic ? 'لديك حساب بالفعل؟' : 'Already have an account?')
              }
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                }}
                className="text-purple-600 font-bold hover:underline mr-2"
              >
                {mode === 'login'
                  ? (isArabic ? 'سجل الآن' : 'Register')
                  : (isArabic ? 'سجل دخول' : 'Login')
                }
              </button>
            </p>
          </div>

          {/* Back to Store */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
          >
            {isArabic ? '← العودة للمتجر' : '← Back to Store'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerAuth;
