import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, push } from 'firebase/database';
import { ArrowLeft, Send, Upload, Eye, CheckCircle, Loader } from 'lucide-react';
import { uploadImageToCloudinary } from '../utils/uploadImage';
import BannerCard from '../components/BannerCard';

function SubmitChallenge({ onNavigate }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    opponent1: '',
    opponent2: '',
    opponent1PlatformId: '',
    opponent2PlatformId: '',
    date: '',
    time: '',
    roundType: 'BO1'
  });
  const [opponent1Avatar, setOpponent1Avatar] = useState(null);
  const [opponent2Avatar, setOpponent2Avatar] = useState(null);
  const [opponent1AvatarPreview, setOpponent1AvatarPreview] = useState('');
  const [opponent2AvatarPreview, setOpponent2AvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleAvatarChange = (opponent, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (opponent === 1) {
          setOpponent1Avatar(file);
          setOpponent1AvatarPreview(reader.result);
        } else {
          setOpponent2Avatar(file);
          setOpponent2AvatarPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    const code = generateTrackingCode();
    const requestsRef = ref(database, 'challengeRequests');
    
    const dateTime = `${formData.date}T${formData.time}:00`;
    
    try {
      let opponent1AvatarUrl = '/default-avatar.png';
      let opponent2AvatarUrl = '/default-avatar.png';

      if (opponent1Avatar) {
        try {
          opponent1AvatarUrl = await uploadImageToCloudinary(opponent1Avatar, `opponent1_${code}`);
        } catch (error) {
          console.error('Error uploading opponent 1 avatar:', error);
        }
      }

      if (opponent2Avatar) {
        try {
          opponent2AvatarUrl = await uploadImageToCloudinary(opponent2Avatar, `opponent2_${code}`);
        } catch (error) {
          console.error('Error uploading opponent 2 avatar:', error);
        }
      }

      await push(requestsRef, {
        opponent1: formData.opponent1,
        opponent2: formData.opponent2,
        opponent1PlatformId: formData.opponent1PlatformId,
        opponent2PlatformId: formData.opponent2PlatformId,
        opponent1Avatar: opponent1AvatarUrl,
        opponent2Avatar: opponent2AvatarUrl,
        dateTime: dateTime,
        roundType: formData.roundType,
        trackingCode: code,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      
      setTrackingCode(code);
      setSubmitted(true);
      setFormData({ 
        opponent1: '', 
        opponent2: '', 
        opponent1PlatformId: '',
        opponent2PlatformId: '',
        date: '', 
        time: '',
        roundType: 'BO1'
      });
      setOpponent1Avatar(null);
      setOpponent2Avatar(null);
      setOpponent1AvatarPreview('');
      setOpponent2AvatarPreview('');
    } catch (error) {
      console.error('Error submitting challenge:', error);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setUploading(false);
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

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Preview Toggle */}
        {formData.opponent1 && formData.opponent2 && formData.date && formData.time && (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              <Eye size={20} />
              {showPreview ? 'إخفاء المعاينة' : 'معاينة البنر'}
            </button>
            
            {showPreview && (
              <div className="mt-6">
                <h3 className="text-white font-bold mb-4 text-center">معاينة البنر</h3>
                <BannerCard
                  challenge={{
                    opponent1: formData.opponent1,
                    opponent2: formData.opponent2,
                    opponent1PlatformId: formData.opponent1PlatformId,
                    opponent2PlatformId: formData.opponent2PlatformId,
                    opponent1Avatar: opponent1AvatarPreview || '/default-avatar.png',
                    opponent2Avatar: opponent2AvatarPreview || '/default-avatar.png',
                    dateTime: `${formData.date}T${formData.time}:00`,
                    roundType: formData.roundType,
                    status: 'pending'
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Opponent 1 Section */}
            <div className="space-y-4 p-6 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-2xl border-2 border-orange-500/30">
              <h3 className="text-xl font-bold text-orange-400 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm">1</span>
                الخصم الأول
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">
                    اسم الخصم *
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
                    معرف المنصة (اختياري)
                  </label>
                  <input
                    type="text"
                    name="opponent1PlatformId"
                    value={formData.opponent1PlatformId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm placeholder-gray-400"
                    placeholder="مثال: Player#1234"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  صورة الخصم (اختياري)
                </label>
                <div className="flex items-center gap-4">
                  {opponent1AvatarPreview && (
                    <img
                      src={opponent1AvatarPreview}
                      alt="معاينة"
                      className="w-20 h-20 rounded-full object-cover border-4 border-orange-500 shadow-lg"
                    />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white border-2 border-dashed border-white/30 rounded-xl transition-all">
                      <Upload size={20} />
                      <span>{opponent1Avatar ? 'تغيير الصورة' : 'رفع صورة'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarChange(1, e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Opponent 2 Section */}
            <div className="space-y-4 p-6 bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 rounded-2xl border-2 border-cyan-500/30">
              <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                <span className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm">2</span>
                الخصم الثاني
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">
                    اسم الخصم *
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

                <div>
                  <label className="block text-white font-bold mb-2">
                    معرف المنصة (اختياري)
                  </label>
                  <input
                    type="text"
                    name="opponent2PlatformId"
                    value={formData.opponent2PlatformId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent backdrop-blur-sm placeholder-gray-400"
                    placeholder="مثال: Player#5678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  صورة الخصم (اختياري)
                </label>
                <div className="flex items-center gap-4">
                  {opponent2AvatarPreview && (
                    <img
                      src={opponent2AvatarPreview}
                      alt="معاينة"
                      className="w-20 h-20 rounded-full object-cover border-4 border-cyan-500 shadow-lg"
                    />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white border-2 border-dashed border-white/30 rounded-xl transition-all">
                      <Upload size={20} />
                      <span>{opponent2Avatar ? 'تغيير الصورة' : 'رفع صورة'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarChange(2, e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Challenge Details Section */}
            <div className="space-y-4 p-6 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-2xl border-2 border-purple-500/30">
              <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">3</span>
                تفاصيل التحدي
              </h3>

              <div>
                <label className="block text-white font-bold mb-2">
                  نوع الجولة *
                </label>
                <select
                  name="roundType"
                  value={formData.roundType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                >
                  <option value="BO1" className="bg-gray-900">Best of 1 (BO1)</option>
                  <option value="BO3" className="bg-gray-900">Best of 3 (BO3)</option>
                  <option value="BO5" className="bg-gray-900">Best of 5 (BO5)</option>
                  <option value="BO7" className="bg-gray-900">Best of 7 (BO7)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">
                    تاريخ التحدي *
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
                    وقت التحدي *
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
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {uploading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send size={20} />
                  {t('submit')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitChallenge;
