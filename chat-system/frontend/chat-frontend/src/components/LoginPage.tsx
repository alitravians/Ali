import { useState } from 'react';
import axios from 'axios';

interface LoginPageProps {
  onLogin: (user: any, token: string) => void;
  onBanned: (banData: any) => void;
  language: 'ar' | 'en';
  apiUrl: string;
}

const LoginPage = ({ onLogin, onBanned, language, apiUrl }: LoginPageProps) => {
  const [mode, setMode] = useState<'user' | 'admin' | 'register'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [bigoName, setBigoName] = useState('');
  const [userId, setUserId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const texts = {
    ar: {
      userLogin: 'تسجيل دخول مستخدم',
      adminLogin: 'تسجيل دخول مسؤول',
      register: 'تسجيل حساب جديد',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      email: 'البريد الإلكتروني',
      bigoName: 'اسمك في بيجو لايف',
      userId: 'المعرف',
      accessCode: 'رمز الدخول',
      loginBtn: 'تسجيل الدخول',
      registerBtn: 'تسجيل',
      switchToRegister: 'ليس لديك حساب؟ سجل الآن',
      switchToLogin: 'لديك حساب؟ سجل الدخول',
      switchToAdmin: 'دخول المسؤول',
      switchToUser: 'دخول المستخدم',
    },
    en: {
      userLogin: 'User Login',
      adminLogin: 'Admin Login',
      register: 'Register New Account',
      username: 'Username',
      password: 'Password',
      email: 'Email',
      bigoName: 'Your Bigo Live Name',
      userId: 'ID',
      accessCode: 'Access Code',
      loginBtn: 'Login',
      registerBtn: 'Register',
      switchToRegister: "Don't have an account? Register now",
      switchToLogin: 'Have an account? Login',
      switchToAdmin: 'Admin Login',
      switchToUser: 'User Login',
    }
  };

  const t = texts[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await axios.post(`${apiUrl}/api/register`, {
          username,
          password,
          email,
          bigo_name: bigoName,
          user_id: userId
        });
        
        const loginResponse = await axios.post(`${apiUrl}/api/login`, {
          username,
          password
        });
        
        onLogin(loginResponse.data.user, loginResponse.data.access_token);
      } else if (mode === 'admin') {
        const response = await axios.post(`${apiUrl}/api/admin/login`, {
          username,
          access_code: accessCode
        });
        
        onLogin(response.data.user, response.data.access_token);
      } else {
        const response = await axios.post(`${apiUrl}/api/login`, {
          username,
          password
        });
        
        onLogin(response.data.user, response.data.access_token);
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.detail?.type === 'banned') {
        const banData = { ...err.response.data.detail, username };
        localStorage.setItem('banInfo', JSON.stringify(banData));
        onBanned(banData);
      } else {
        setError(err.response?.data?.detail || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">
          {mode === 'register' ? t.register : mode === 'admin' ? t.adminLogin : t.userLogin}
        </h1>

        <div className="mode-switcher">
          <button
            className={mode === 'user' ? 'active' : ''}
            onClick={() => setMode('user')}
          >
            {t.userLogin}
          </button>
          <button
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => setMode('admin')}
          >
            {t.adminLogin}
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            {t.register}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>{t.username}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              required
            />
          </div>

          {mode !== 'admin' && (
            <div className="form-group">
              <label>{t.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
              />
            </div>
          )}

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.bigoName}</label>
                <input
                  type="text"
                  value={bigoName}
                  onChange={(e) => setBigoName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.userId}</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  required
                />
              </div>
            </>
          )}

          {mode === 'admin' && (
            <div className="form-group">
              <label>{t.accessCode}</label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                onKeyDown={handleKeyDown}
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '...' : mode === 'register' ? t.registerBtn : t.loginBtn}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
