import { useState, useEffect } from 'react';
import axios from 'axios';

interface BanAppealPageProps {
  banInfo: any;
  language: 'ar' | 'en';
  apiUrl: string;
  onBack: () => void;
}

const BanAppealPage = ({ banInfo, language, apiUrl, onBack }: BanAppealPageProps) => {
  const [appealText, setAppealText] = useState('');
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const texts = {
    ar: {
      banned: 'تم حظرك',
      reason: 'السبب',
      duration: 'المدة',
      minutes: 'دقيقة',
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
      checkStatus: 'التحقق من الحالة',
    },
    en: {
      banned: 'You are Banned',
      reason: 'Reason',
      duration: 'Duration',
      minutes: 'minutes',
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
      checkStatus: 'Check Status',
    }
  };

  const t = texts[language];

  useEffect(() => {
    loadAppeals();
  }, []);

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

  const calculateRemainingTime = () => {
    if (!banInfo.expires_at) return 0;
    const now = new Date();
    const expiresAt = new Date(banInfo.expires_at);
    const diff = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / 60000));
  };

  return (
    <div className="ban-appeal-page">
      <div className="ban-appeal-container">
        <div className="ban-info">
          <h2>{t.banned}</h2>
          <div className="ban-details">
            <p><strong>{t.reason}:</strong> {banInfo.reason}</p>
            <p><strong>{t.duration}:</strong> {calculateRemainingTime()} {t.minutes}</p>
          </div>
        </div>

        <div className="appeal-form">
          <h3>{t.submitAppeal}</h3>
          <textarea
            value={appealText}
            onChange={(e) => setAppealText(e.target.value)}
            placeholder={t.appealText}
            rows={5}
          />
          <button onClick={handleSubmitAppeal} disabled={loading}>
            {loading ? '...' : t.submit}
          </button>
        </div>

        {showSuccess && (
          <div className="success-message">
            {t.appealSubmitted}
          </div>
        )}

        <div className="appeals-list">
          <h3>{t.yourAppeals}</h3>
          {appeals.length === 0 ? (
            <p>No appeals submitted yet</p>
          ) : (
            appeals.map(appeal => (
              <div key={appeal.id} className="appeal-item">
                <p><strong>{t.status}:</strong> {appeal.status === 'pending' ? t.pending : t.resolved}</p>
                <p><strong>Appeal:</strong> {appeal.appeal_text}</p>
                {appeal.response && (
                  <>
                    <p><strong>{t.response}:</strong> {appeal.response}</p>
                    <p><strong>Action:</strong> {appeal.action === 'accept' ? t.accepted : t.rejected}</p>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <button onClick={onBack} className="back-btn">{t.back}</button>
      </div>
    </div>
  );
};

export default BanAppealPage;
