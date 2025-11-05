import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, push } from 'firebase/database';
import { ArrowLeft, Send } from 'lucide-react';

function SubmitChallenge({ onNavigate }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    opponent1: '',
    opponent2: '',
    date: '',
    time: ''
  });
  const [trackingCode, setTrackingCode] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const code = generateTrackingCode();
    const requestsRef = ref(database, 'challengeRequests');
    
    const dateTime = `${formData.date}T${formData.time}:00`;
    
    try {
      await push(requestsRef, {
        opponent1: formData.opponent1,
        opponent2: formData.opponent2,
        dateTime: dateTime,
        trackingCode: code,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      
      setTrackingCode(code);
      setSubmitted(true);
      setFormData({ opponent1: '', opponent2: '', date: '', time: '' });
    } catch (error) {
      console.error('Error submitting challenge:', error);
      alert('حدث خطأ أثناء إرسال الطلب');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all shadow-lg border border-white/10 backdrop-blur-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent">{t('submitChallenge')}</h1>
        </div>

        <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/50">
              <div className="text-white text-5xl">✓</div>
            </div>
            <h2 className="text-3xl font-bold text-white">تم إرسال طلبك بنجاح!</h2>
            <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 p-6 rounded-xl border-2 border-purple-500/50 backdrop-blur-sm">
              <p className="text-gray-300 mb-2 font-semibold">كود المراجعة الخاص بك:</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{trackingCode}</p>
            </div>
            <p className="text-gray-300">
              احتفظ بهذا الكود لمراجعة حالة طلبك
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setTrackingCode('');
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl transition-all shadow-lg shadow-purple-500/50"
              >
                تقديم طلب جديد
              </button>
              <button
                onClick={() => onNavigate('status')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl transition-all shadow-lg shadow-cyan-500/50"
              >
                التحقق من الحالة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all shadow-lg border border-white/10 backdrop-blur-sm"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent">{t('submitChallenge')}</h1>
      </div>

      <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-bold mb-2">
              {t('opponent1')}
            </label>
            <input
              type="text"
              name="opponent1"
              value={formData.opponent1}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm placeholder-gray-400"
              placeholder="أدخل اسم الخصم الأول"
            />
          </div>

          <div>
            <label className="block text-white font-bold mb-2">
              {t('opponent2')}
            </label>
            <input
              type="text"
              name="opponent2"
              value={formData.opponent2}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent backdrop-blur-sm placeholder-gray-400"
              placeholder="أدخل اسم الخصم الثاني"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-bold mb-2">
                تاريخ التحدي
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                dir="ltr"
                className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-white font-bold mb-2">
                وقت التحدي
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                dir="ltr"
                step="60"
                className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-orange-500/50"
          >
            <Send size={20} />
            {t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SubmitChallenge;
