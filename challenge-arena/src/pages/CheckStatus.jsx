import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { ArrowLeft, Search, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Users, Loader } from 'lucide-react';

function CheckStatus({ onNavigate }) {
  const { t, language } = useLanguage();
  const [trackingCode, setTrackingCode] = useState('');
  const [request, setRequest] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setNotFound(false);
    setRequest(null);

    try {
      const requestsRef = ref(database, 'challengeRequests');
      const snapshot = await get(requestsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const foundRequest = Object.entries(data).find(
          ([key, value]) => value.trackingCode === trackingCode
        );
        
        if (foundRequest) {
          setRequest({ id: foundRequest[0], ...foundRequest[1] });
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error searching for request:', error);
      alert('حدث خطأ أثناء البحث');
    } finally {
      setSearching(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-600';
      case 'rejected':
        return 'bg-red-600';
      default:
        return 'bg-red-600'; // Under Review is red per user note
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'تمت الموافقة';
      case 'rejected':
        return 'مرفوض';
      default:
        return 'قيد المراجعة';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={32} className="text-green-400" />;
      case 'rejected':
        return <XCircle size={32} className="text-red-400" />;
      default:
        return <Clock size={32} className="text-red-400" />;
    }
  };

  const getEstimatedTime = (status, submittedAt) => {
    if (status === 'approved' || status === 'rejected') {
      return null;
    }
    
    const submitted = new Date(submittedAt);
    const now = new Date();
    const hoursPassed = Math.floor((now - submitted) / (1000 * 60 * 60));
    const estimatedHours = 24; // Estimated review time
    const remaining = Math.max(0, estimatedHours - hoursPassed);
    
    if (remaining === 0) {
      return 'سيتم المراجعة قريباً';
    }
    return `الوقت المتوقع للمراجعة: ${remaining} ساعة`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 backdrop-blur-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {language === 'ar' ? 'مراجعة حالة الطلب' : 'Check Request Status'}
          </h1>
        </div>

        {/* Search Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-white/10 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Search size={24} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {language === 'ar' ? 'أدخل كود المراجعة' : 'Enter Tracking Code'}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSearch} className="px-8 py-8 space-y-6">
            <div className="space-y-3">
              <label className="block text-white font-semibold">
                {language === 'ar' ? 'كود المراجعة' : 'Tracking Code'}
                <span className="text-red-400 mr-1">*</span>
              </label>
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
                className="w-full px-6 py-4 bg-white/10 text-white text-center text-2xl font-bold tracking-widest border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm placeholder-slate-400 transition-all uppercase"
                placeholder={language === 'ar' ? 'XXXXXXXX' : 'XXXXXXXX'}
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {searching ? (
                <>
                  <Loader size={24} className="animate-spin" />
                  {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
                </>
              ) : (
                <>
                  <Search size={24} />
                  {language === 'ar' ? 'بحث' : 'Search'}
                </>
              )}
            </button>
          </form>
        </div>

        {notFound && (
          <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl border-2 border-red-500/30 p-8 text-center">
            <XCircle size={64} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-300 font-bold text-xl">
              {language === 'ar' ? 'لم يتم العثور على طلب بهذا الكود' : 'No request found with this code'}
            </p>
            <p className="text-red-200 mt-2">
              {language === 'ar' ? 'تأكد من إدخال الكود بشكل صحيح' : 'Please verify the code is entered correctly'}
            </p>
          </div>
        )}

        {request && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
              <div className={`${getStatusColor(request.status)} p-8 text-center`}>
                <div className="flex flex-col items-center gap-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="text-white font-bold text-3xl mb-2">
                      {getStatusText(request.status)}
                    </p>
                    {getEstimatedTime(request.status, request.submittedAt) && (
                      <p className="text-white/80 text-sm">
                        {getEstimatedTime(request.status, request.submittedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Challenge Details */}
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {language === 'ar' ? 'معلومات اللاعبين' : 'Players Information'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/30">
                    <p className="text-blue-400 font-semibold mb-2">
                      {language === 'ar' ? 'اللاعب الأول' : 'Player 1'}
                    </p>
                    <p className="text-white font-bold text-xl">{request.playerName || request.opponent1}</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-xl border border-cyan-500/30">
                    <p className="text-cyan-400 font-semibold mb-2">
                      {language === 'ar' ? 'اللاعب الثاني' : 'Player 2'}
                    </p>
                    <p className="text-white font-bold text-xl">{request.opponentName || request.opponent2}</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Calendar size={24} className="text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {language === 'ar' ? 'تفاصيل الموعد' : 'Schedule Details'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-slate-400 text-sm mb-1">
                        {language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}
                      </p>
                      <p className="text-white font-bold">
                        {new Date(request.dateTime).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-slate-400 text-sm mb-1">
                        {language === 'ar' ? 'كود التتبع' : 'Tracking Code'}
                      </p>
                      <p className="text-blue-400 font-bold text-lg tracking-wider">{request.trackingCode}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-slate-400 text-sm mb-1">
                    {language === 'ar' ? 'تاريخ التقديم' : 'Submitted At'}
                  </p>
                  <p className="text-white font-semibold">
                    {new Date(request.submittedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>

                {/* Status Messages */}
                {request.status === 'approved' && (
                  <div className="bg-green-500/10 border-2 border-green-500/30 p-6 rounded-xl text-center">
                    <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                    <p className="text-green-300 font-bold text-lg">
                      {language === 'ar' ? 'تم الموافقة على طلبك!' : 'Your request has been approved!'}
                    </p>
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div className="bg-red-500/10 border-2 border-red-500/30 p-6 rounded-xl">
                    <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <p className="text-red-300 font-bold text-lg mb-2 text-center">
                      {language === 'ar' ? 'تم رفض الطلب' : 'Request Rejected'}
                    </p>
                    {request.rejectionReason && (
                      <div className="mt-4 p-4 bg-red-500/10 rounded-xl">
                        <p className="text-red-300 font-bold mb-2">
                          {language === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}
                        </p>
                        <p className="text-red-200">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckStatus;
