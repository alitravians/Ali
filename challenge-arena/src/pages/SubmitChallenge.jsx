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
            className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors shadow-md"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{t('submitChallenge')}</h1>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-xl">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <div className="text-green-600 text-5xl">✓</div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">تم إرسال طلبك بنجاح!</h2>
            <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
              <p className="text-gray-700 mb-2 font-semibold">كود المراجعة الخاص بك:</p>
              <p className="text-4xl font-bold text-purple-600">{trackingCode}</p>
            </div>
            <p className="text-gray-600">
              احتفظ بهذا الكود لمراجعة حالة طلبك
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setTrackingCode('');
                }}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shadow-md"
              >
                تقديم طلب جديد
              </button>
              <button
                onClick={() => onNavigate('status')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-md"
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
          className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors shadow-md"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{t('submitChallenge')}</h1>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-800 font-bold mb-2">
              {t('opponent1')}
            </label>
            <input
              type="text"
              name="opponent1"
              value={formData.opponent1}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="أدخل اسم الخصم الأول"
            />
          </div>

          <div>
            <label className="block text-gray-800 font-bold mb-2">
              {t('opponent2')}
            </label>
            <input
              type="text"
              name="opponent2"
              value={formData.opponent2}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="أدخل اسم الخصم الثاني"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-800 font-bold mb-2">
                تاريخ التحدي
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                dir="ltr"
                className="w-full px-4 py-3 bg-gray-50 text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-800 font-bold mb-2">
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
                className="w-full px-4 py-3 bg-gray-50 text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
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
