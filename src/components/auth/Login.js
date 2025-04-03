import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/LocalAuthContext';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import TermsAndConditions from './TermsAndConditions';
import PrivacyPolicy from './PrivacyPolicy';
import BannedPage from './BannedPage';
import FrozenPage from './FrozenPage';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [banInfo, setBanInfo] = useState(null);
  const [freezeInfo, setFreezeInfo] = useState(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (isRegistering) {
        if (!agreeToTerms) {
          setError(t('auth.agreeToTerms'));
          setLoading(false);
          return;
        }
        
        const result = await register(username, email, password);
        if (result.success) {
          setSuccess(result.message);
          setLoading(false);
          navigate('/chat');
        } else {
          setError(result.message);
          setLoading(false);
        }
      } else {
        const result = await login(username, password);
        if (result.success) {
          setSuccess(result.message);
          setLoading(false);
          navigate('/chat');
        } else {
          if (result.banInfo) {
            setBanInfo(result.banInfo);
          } else if (result.freezeInfo) {
            setFreezeInfo(result.freezeInfo);
          } else {
            setError(result.message);
          }
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || t('auth.unknownError'));
      setLoading(false);
    }
  };

  if (banInfo) {
    return <BannedPage banInfo={banInfo} />;
  }

  if (freezeInfo) {
    return <FrozenPage freezeInfo={freezeInfo} />;
  }

  if (showTerms) {
    return <TermsAndConditions onClose={() => setShowTerms(false)} />;
  }

  if (showPrivacy) {
    return <PrivacyPolicy onClose={() => setShowPrivacy(false)} />;
  }

  return (
    <div className="login-container">
      <div className="language-selector">
        <button 
          className={i18n.language === 'ar' ? 'active' : ''} 
          onClick={() => handleLanguageChange('ar')}
        >
          العربية
        </button>
        <button 
          className={i18n.language === 'en' ? 'active' : ''} 
          onClick={() => handleLanguageChange('en')}
        >
          English
        </button>
      </div>

      <div className="login-form-container">
        <h1>{t('app.title')}</h1>
        <h2>{isRegistering ? t('auth.register') : t('auth.login')}</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <div className="checkbox">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                />
                <label htmlFor="agreeToTerms">
                  {t('auth.agreeToTerms')}{' '}
                  <button 
                    type="button" 
                    className="link-button"
                    onClick={() => setShowTerms(true)}
                  >
                    {t('auth.termsAndConditions')}
                  </button>{' '}
                  {t('common.and')}{' '}
                  <button 
                    type="button" 
                    className="link-button"
                    onClick={() => setShowPrivacy(true)}
                  >
                    {t('auth.privacyPolicy')}
                  </button>
                </label>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            disabled={loading}
          >
            {loading ? t('common.loading') : isRegistering ? t('auth.register') : t('auth.login')}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button 
            type="button" 
            className="link-button"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? t('auth.login') : t('auth.register')}
          </button>
        </div>

        <div className="chat-rules mt-4">
          <h3>{t('auth.termsAndConditions')}</h3>
          <ul>
            <li>{t('rules.respectOthers')}</li>
            <li>{t('rules.noHarassment')}</li>
            <li>{t('rules.noSpam')}</li>
            <li>{t('rules.noInappropriateContent')}</li>
            <li>{t('rules.followModeratorInstructions')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
