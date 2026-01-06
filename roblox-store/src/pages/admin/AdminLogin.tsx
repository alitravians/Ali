import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Lock, AlertCircle, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/admin');
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.loginTitle')}</h1>
          <p className="text-gray-500 mt-2">
            {i18n.language === 'ar' ? 'أدخل كلمة المرور للوصول' : 'Enter password to access'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {t('admin.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={20} />
              <span>{t('admin.invalidPassword')}</span>
            </div>
          )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                  {t('admin.loginButton')}
                </button>

                <Link
                  to="/"
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600 py-3 rounded-lg font-medium transition-colors mt-4"
                >
                  <Home size={20} />
                  {i18n.language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
                </Link>
              </form>

            </div>
    </div>
  );
};

export default AdminLogin;
