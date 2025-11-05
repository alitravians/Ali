import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, push } from 'firebase/database';
import { ArrowLeft, Send, Loader, Calendar, Clock, Users, Trophy, CheckCircle2, Copy, Check } from 'lucide-react';

function SubmitChallenge({ onNavigate }) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    playerName: '',
    opponentName: '',
    date: '',
    time: ''
  });
  const [uploading, setUploading] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

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
    setUploading(true);
    
    const code = generateTrackingCode();
    const requestsRef = ref(database, 'challengeRequests');
    
    const dateTime = `${formData.date}T${formData.time}:00`;
    
    try {
      await push(requestsRef, {
        playerName: formData.playerName,
        opponentName: formData.opponentName,
        opponent1: formData.playerName,
        opponent2: formData.opponentName,
        opponent1PlatformId: formData.playerName,
        opponent2PlatformId: formData.opponentName,
        opponent1Avatar: '/default-avatar.png',
        opponent2Avatar: '/default-avatar.png',
        dateTime: dateTime,
        roundType: 'BO1',
        trackingCode: code,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      
      setTrackingCode(code);
      setSubmitted(true);
      setFormData({ 
        playerName: '', 
        opponentName: '', 
        date: '', 
        time: ''
      });
    } catch (error) {
      console.error('Error submitting challenge:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إرسال الطلب' : 'Error submitting request');
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => onNavigate('home')}
              className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 backdrop-blur-sm"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {language === 'ar' ? 'التقدم بطلب تحدي رسمي' : 'Submit Official Challenge Request'}
            </h1>
          </div>

          {/* Success Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-white/10 px-8 py-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-40"></div>
                  <div className="relative p-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full shadow-xl">
                    <CheckCircle2 size={64} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                {language === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Request Submitted Successfully!'}
              </h2>
              <div className="h-1 w-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
            </div>

            {/* Success Body */}
            <div className="px-8 py-10 space-y-8">
              {/* Tracking Code */}
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-xl p-8 border border-blue-500/30">
                <p className="text-slate-300 text-center mb-4 font-semibold">
                  {language === 'ar' ? 'كود المراجعة الخاص بك:' : 'Your Tracking Code:'}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <p className="text-3xl md:text-4xl font-bold text-white tracking-wider">
                    {trackingCode}
                  </p>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20"
                    title={language === 'ar' ? 'نسخ' : 'Copy'}
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-white/5 text-center">
                <p className="text-slate-300 leading-relaxed">
                  {language === 'ar' 
                    ? 'احتفظ بهذا الكود لمراجعة حالة طلبك. سيتم مراجعة طلبك من قبل الإدارة وسيتم إشعارك بالنتيجة.'
                    : 'Keep this code to check your request status. Your request will be reviewed by administration and you will be notified of the result.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => onNavigate('status')}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transform"
                >
                  {language === 'ar' ? 'التحقق من الحالة' : 'Check Status'}
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setTrackingCode('');
                    setCopied(false);
                  }}
                  className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl transition-all border border-white/10 hover:border-white/20 hover:scale-105 transform"
                >
                  {language === 'ar' ? 'تقديم طلب جديد' : 'Submit New Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 backdrop-blur-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {language === 'ar' ? 'التقدم بطلب تحدي رسمي' : 'Submit Official Challenge Request'}
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-white/10 px-8 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-xl">
                <Trophy size={48} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {language === 'ar' ? 'احجز تحديك الرسمي' : 'Book Your Official Challenge'}
            </h2>
            <p className="text-slate-300">
              {language === 'ar' 
                ? 'املأ البيانات التالية لحجز موعد تحديك الرسمي'
                : 'Fill in the following details to book your official challenge'}
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="px-8 py-10 space-y-8">
            {/* Players Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users size={24} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {language === 'ar' ? 'معلومات اللاعبين' : 'Players Information'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Player Name */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">
                    {language === 'ar' ? 'اسم الايدي الخاص بك' : 'Your ID Name'}
                    <span className="text-red-400 mr-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="playerName"
                    value={formData.playerName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm placeholder-slate-400 transition-all"
                    placeholder={language === 'ar' ? 'أدخل اسم الايدي الخاص بك' : 'Enter your ID name'}
                  />
                </div>

                {/* Opponent Name */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">
                    {language === 'ar' ? 'اسم الايدي للخصم' : 'Opponent ID Name'}
                    <span className="text-red-400 mr-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="opponentName"
                    value={formData.opponentName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent backdrop-blur-sm placeholder-slate-400 transition-all"
                    placeholder={language === 'ar' ? 'أدخل اسم الايدي للخصم' : 'Enter opponent ID name'}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10"></div>

            {/* Challenge Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Calendar size={24} className="text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {language === 'ar' ? 'تفاصيل التحدي' : 'Challenge Details'}
                </h3>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">
                    {language === 'ar' ? 'تاريخ التحدي' : 'Challenge Date'}
                    <span className="text-red-400 mr-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      dir="ltr"
                      className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">
                    {language === 'ar' ? 'وقت التحدي' : 'Challenge Time'}
                    <span className="text-red-400 mr-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      dir="ltr"
                      step="60"
                      className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {uploading ? (
                <>
                  <Loader size={24} className="animate-spin" />
                  {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Send size={24} />
                  {language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Footer */}
        <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <p className="text-slate-300 text-center text-sm leading-relaxed">
            {language === 'ar'
              ? 'سيتم مراجعة طلبك من قبل الإدارة خلال 24 ساعة. ستحصل على كود مراجعة لمتابعة حالة طلبك.'
              : 'Your request will be reviewed by administration within 24 hours. You will receive a tracking code to follow up on your request status.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SubmitChallenge;
