import { useState, useEffect } from 'react';
import axios from 'axios';

interface BanAppealPageProps {
  banInfo: any;
  language: 'ar' | 'en';
  apiUrl: string;
  onBack: () => void;
}

const BanAppealPage = ({ banInfo: propBanInfo, language, apiUrl, onBack }: BanAppealPageProps) => {
  const [banInfo, setBanInfo] = useState<any>(null);
  const [appealText, setAppealText] = useState('');
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  const texts = {
    ar: {
      banned: 'تم حظرك',
      reason: 'السبب',
      originalDuration: 'مدة الحظر الأصلية',
      remainingTime: 'الوقت المتبقي',
      minutes: 'دقيقة',
      minutes2to10: 'دقائق',
      submitAppeal: 'تقديم طلب اعتراض',
      appealText: 'اكتب طلب الاعتراض',
      submit: 'إرسال',
      back: 'رجوع',
      yourAppeals: 'طلبات الاعتراض الخاصة بك',
      status: 'الحالة',
      pending: 'قيد المراجعة',
      resolved: 'تم الحل',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      response: 'الرد',
      appealSubmitted: 'تم تقديم طلب الاعتراض بنجاح',
      noAppeals: 'لم يتم تقديم أي طلبات اعتراض بعد',
      appeal: 'الطلب',
      action: 'الإجراء',
    },
    en: {
      banned: 'You are Banned',
      reason: 'Reason',
      originalDuration: 'Original Ban Duration',
      remainingTime: 'Time Remaining',
      minutes: 'minute',
      minutes2to10: 'minutes',
      submitAppeal: 'Submit Ban Appeal',
      appealText: 'Write your appeal',
      submit: 'Submit',
      back: 'Back',
      yourAppeals: 'Your Appeals',
      status: 'Status',
      pending: 'Pending',
      resolved: 'Resolved',
      accepted: 'Accepted',
      rejected: 'Rejected',
      response: 'Response',
      appealSubmitted: 'Appeal submitted successfully',
      noAppeals: 'No appeals submitted yet',
      appeal: 'Appeal',
      action: 'Action',
    }
  };

  const t = texts[language];

  const pluralizeMinutes = (num: number) => {
    if (language === 'en') {
      return num === 1 ? t.minutes : t.minutes2to10;
    }
    if (num === 1) return 'دقيقة';
    if (num === 2) return 'دقيقتان';
    if (num >= 3 && num <= 10) return 'دقائق';
    return 'دقيقة';
  };

  useEffect(() => {
    const loadBanInfo = async () => {
      if (propBanInfo) {
        setBanInfo(propBanInfo);
        setRemainingMinutes(propBanInfo.remaining_minutes || 0);
        return;
      }

      const storedBanInfo = localStorage.getItem('banInfo');
      if (storedBanInfo) {
        const parsed = JSON.parse(storedBanInfo);
        setBanInfo(parsed);
        setRemainingMinutes(parsed.remaining_minutes || 0);
        return;
      }

      try {
        const userId = localStorage.getItem('user');
        if (userId) {
          const user = JSON.parse(userId);
          const response = await axios.get(`${apiUrl}/api/ban/${user.user_id}`);
          setBanInfo(response.data);
          setRemainingMinutes(response.data.remaining_minutes || 0);
          localStorage.setItem('banInfo', JSON.stringify(response.data));
        }
      } catch (err) {
        console.error('Failed to load ban info', err);
      }
    };

    loadBanInfo();
    loadAppeals();
  }, [propBanInfo, apiUrl]);

  useEffect(() => {
    if (!banInfo) return;

    const interval = setInterval(() => {
      setRemainingMinutes(prev => {
        const newValue = Math.max(0, prev - 1);
        if (newValue === 0) {
          clearInterval(interval);
        }
        return newValue;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [banInfo]);

  const loadAppeals = async () => {
    try {
      const userId = localStorage.getItem('user');
      if (userId) {
        const user = JSON.parse(userId);
        const response = await axios.get(`${apiUrl}/api/appeals/${user.user_id}`);
        setAppeals(response.data.appeals);
      }
    } catch (err) {
      console.error('Failed to load appeals', err);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!appealText.trim()) return;

    setLoading(true);
    try {
      const userId = localStorage.getItem('user');
      if (userId) {
        const user = JSON.parse(userId);
        await axios.post(`${apiUrl}/api/appeals`, {
          user_id: user.user_id,
          appeal_text: appealText
        });

        setShowSuccess(true);
        setAppealText('');
        setTimeout(() => setShowSuccess(false), 3000);
        loadAppeals();
      }
    } catch (err) {
      alert('Failed to submit appeal');
    } finally {
      setLoading(false);
    }
  };

  if (!banInfo) {
    return (
      <div className="ban-appeal-page">
        <div className="ban-appeal-container">
          <p>Loading ban information...</p>
        </div>
      </div>
    );
  }

  const getStatusClass = (status: string, action?: string) => {
    if (status === 'pending') return 'status-pending';
    if (action === 'accept') return 'status-accepted';
    if (action === 'reject') return 'status-rejected';
    return 'status-resolved';
  };

  const getStatusText = (status: string, action?: string) => {
    if (status === 'pending') return t.pending;
    if (action === 'accept') return t.accepted;
    if (action === 'reject') return t.rejected;
    return t.resolved;
  };

  return (
    <div className="ban-appeal-page">
      <div className="ban-appeal-container">
        {/* Ban Info Card */}
        <div className="ban-info-card">
          <div className="ban-header">
            <h2>{t.banned}</h2>
          </div>
          
          <div className="ban-details">
            <div className="detail-row">
              <span className="detail-label">{t.reason}:</span>
              <span className="detail-value">{banInfo.reason}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">{t.originalDuration}:</span>
              <span className="detail-value">
                {banInfo.duration_minutes} {pluralizeMinutes(banInfo.duration_minutes)}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">{t.remainingTime}:</span>
              <span className="detail-value remaining-time">
                {remainingMinutes} {pluralizeMinutes(remainingMinutes)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${(remainingMinutes / banInfo.duration_minutes) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Appeal Form */}
        <div className="appeal-form-card">
          <h3>{t.submitAppeal}</h3>
          <textarea
            value={appealText}
            onChange={(e) => setAppealText(e.target.value)}
            placeholder={t.appealText}
            rows={5}
            className="appeal-textarea"
          />
          <button 
            onClick={handleSubmitAppeal} 
            disabled={loading || !appealText.trim()}
            className="submit-appeal-btn"
          >
            {loading ? '...' : t.submit}
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="success-toast">
            ✓ {t.appealSubmitted}
          </div>
        )}

        {/* Appeals List */}
        <div className="appeals-list-card">
          <h3>{t.yourAppeals}</h3>
          {appeals.length === 0 ? (
            <p className="no-appeals">{t.noAppeals}</p>
          ) : (
            <div className="appeals-grid">
              {appeals.map(appeal => (
                <div key={appeal.id} className="appeal-item-card">
                  <div className="appeal-status-badge">
                    <span className={getStatusClass(appeal.status, appeal.action)}>
                      {getStatusText(appeal.status, appeal.action)}
                    </span>
                  </div>
                  
                  <div className="appeal-content">
                    <p className="appeal-label">{t.appeal}:</p>
                    <p className="appeal-text">{appeal.appeal_text}</p>
                  </div>
                  
                  {appeal.response && (
                    <div className="appeal-response">
                      <p className="response-label">{t.response}:</p>
                      <p className="response-text">{appeal.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={onBack} className="back-btn">{t.back}</button>
      </div>
    </div>
  );
};

export default BanAppealPage;
