import { useEffect, useState } from 'react';
import { Power, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './MaintenancePage.css';

function MaintenancePage({ settings, onNavigateToAdmin }) {
  const { language, toggleLanguage } = useLanguage();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    if (!settings?.until) {
      setShowCountdown(false);
      return;
    }

    try {
      const targetDate = new Date(settings.until).getTime();
      if (isNaN(targetDate) || targetDate <= Date.now()) {
        setShowCountdown(false);
        return;
      }

      setShowCountdown(true);

      const updateCountdown = () => {
        const now = Date.now();
        let delta = Math.max(0, targetDate - now);

        const days = Math.floor(delta / (1000 * 60 * 60 * 24));
        delta -= days * (1000 * 60 * 60 * 24);
        const hours = Math.floor(delta / (1000 * 60 * 60));
        delta -= hours * (1000 * 60 * 60);
        const minutes = Math.floor(delta / (1000 * 60));
        delta -= minutes * (1000 * 60);
        const seconds = Math.floor(delta / 1000);

        setCountdown({ days, hours, minutes, seconds });
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      setShowCountdown(false);
    }
  }, [settings?.until]);

  const agencyName = settings?.agencyName || (language === 'ar' ? 'أرض التحديات' : 'Challenge Arena');
  const logoEmoji = settings?.logoEmoji || '⭐';
  const tagline = settings?.tagline || (language === 'ar' ? 'نُعيد ضبط التجربة — تحديثات جودة وأداء' : 'Recalibrating the experience — quality and performance updates');
  const closureReason = settings?.closureReason || (language === 'ar' ? 'الموقع في وضع الصيانة المؤقتة لضبط الأداء وتحسين الجودة.' : 'The site is under temporary maintenance to improve performance and quality.');

  const theme = settings?.theme || {};
  const themeStyles = {
    '--glow1': theme.glow1 || '#60a5fa',
    '--glow2': theme.glow2 || '#22d3ee',
    '--glow3': theme.glow3 || '#a78bfa',
    '--ink': theme.ink || '#e6e9ef',
    '--muted': theme.muted || '#9aa3b2',
    '--bg': theme.bg || '#0b0f1a',
    '--bg2': theme.bg2 || '#101628'
  };

  return (
    <div className="maintenance-root" style={themeStyles} dir="rtl">
      <div className="maintenance-bg">
        <div className="maintenance-noise"></div>
        <div className="maintenance-aurora">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="maintenance-grid"></div>
      </div>

      <main className="maintenance-wrap">
        <section className="maintenance-glass">
          <div className="maintenance-brand">
            <div className="maintenance-logo">{logoEmoji}</div>
            <div className="maintenance-titles">
              <h1>{agencyName}</h1>
              <p className="maintenance-tagline">{tagline}</p>
            </div>
          </div>

          <p className="maintenance-lead">{closureReason}</p>

          {showCountdown && (
            <div className="maintenance-countdown" aria-live="polite">
              <div className="maintenance-countdown-box">
                <span>{String(countdown.days).padStart(2, '0')}</span>
                <label>{language === 'ar' ? 'يوم' : 'Day'}</label>
              </div>
              <div className="maintenance-countdown-box">
                <span>{String(countdown.hours).padStart(2, '0')}</span>
                <label>{language === 'ar' ? 'ساعة' : 'Hour'}</label>
              </div>
              <div className="maintenance-countdown-box">
                <span>{String(countdown.minutes).padStart(2, '0')}</span>
                <label>{language === 'ar' ? 'دقيقة' : 'Minute'}</label>
              </div>
              <div className="maintenance-countdown-box">
                <span>{String(countdown.seconds).padStart(2, '0')}</span>
                <label>{language === 'ar' ? 'ثانية' : 'Second'}</label>
              </div>
            </div>
          )}

          <div className="maintenance-loader">
            <div className="maintenance-loader-bar">
              <i></i>
            </div>
            <div className="maintenance-loader-dots">
              <b></b>
              <b></b>
              <b></b>
            </div>
          </div>

          <div className="maintenance-actions">
            <button
              onClick={onNavigateToAdmin}
              className="maintenance-btn maintenance-btn-primary"
            >
              <Power size={20} />
              <span>{language === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}</span>
            </button>
            <button
              onClick={toggleLanguage}
              className="maintenance-btn maintenance-btn-secondary"
            >
              <Globe size={20} />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
          </div>
        </section>

        <footer className="maintenance-minimal">
          <small>© {agencyName} — {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</small>
        </footer>
      </main>
    </div>
  );
}

export default MaintenancePage;
