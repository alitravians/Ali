import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { ArrowLeft, Search, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import BannerCard from '../components/BannerCard';

function CheckStatus({ onNavigate }) {
  const { t } = useLanguage();
  const [trackingCode, setTrackingCode] = useState('');
  const [request, setRequest] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all shadow-lg border border-white/10 backdrop-blur-sm"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent">{t('checkStatus')}</h1>
      </div>

      <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label className="block text-white font-bold mb-2">
              {t('trackingCode')}
            </label>
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm placeholder-gray-400"
              placeholder="أدخل كود المراجعة"
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 disabled:opacity-50"
          >
            <Search size={20} />
            {searching ? 'جاري البحث...' : t('checkStatus')}
          </button>
        </form>

        {notFound && (
          <div className="mt-6 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl text-center backdrop-blur-sm">
            <p className="text-red-300 font-bold">لم يتم العثور على طلب بهذا الكود</p>
          </div>
        )}

        {request && (
          <div className="mt-6 space-y-6">
            {/* Status Header with Icon */}
            <div className={`p-8 ${getStatusColor(request.status)} rounded-2xl text-center shadow-2xl`}>
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

            {/* Visual Timeline */}
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border-2 border-white/10">
              <h3 className="text-white font-bold text-xl mb-6 text-center">مراحل الطلب</h3>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute right-1/2 top-0 bottom-0 w-1 bg-white/20 transform translate-x-1/2"></div>
                
                {/* Timeline Steps */}
                <div className="space-y-8">
                  {/* Step 1: Submitted */}
                  <div className="relative flex items-center gap-4">
                    <div className="flex-1 text-left">
                      <p className="text-white font-bold">تم التقديم</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(request.submittedAt).toLocaleString('ar-EG')}
                      </p>
                    </div>
                    <div className="relative z-10 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle size={24} className="text-white" />
                    </div>
                    <div className="flex-1"></div>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className="relative flex items-center gap-4">
                    <div className="flex-1"></div>
                    <div className={`relative z-10 w-12 h-12 ${request.status === 'pending' ? 'bg-red-600 animate-pulse' : 'bg-green-600'} rounded-full flex items-center justify-center shadow-lg`}>
                      {request.status === 'pending' ? (
                        <Clock size={24} className="text-white" />
                      ) : (
                        <CheckCircle size={24} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-white font-bold">قيد المراجعة</p>
                      <p className="text-gray-400 text-sm">
                        {request.status === 'pending' ? 'جاري المراجعة...' : 'تمت المراجعة'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Final Decision */}
                  <div className="relative flex items-center gap-4">
                    <div className="flex-1 text-left">
                      <p className="text-white font-bold">
                        {request.status === 'approved' ? 'تمت الموافقة' : request.status === 'rejected' ? 'مرفوض' : 'في انتظار القرار'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {request.status === 'approved' || request.status === 'rejected' ? 'اكتمل' : 'قريباً'}
                      </p>
                    </div>
                    <div className={`relative z-10 w-12 h-12 ${
                      request.status === 'approved' ? 'bg-green-600' : 
                      request.status === 'rejected' ? 'bg-red-600' : 
                      'bg-gray-600'
                    } rounded-full flex items-center justify-center shadow-lg`}>
                      {request.status === 'approved' ? (
                        <CheckCircle size={24} className="text-white" />
                      ) : request.status === 'rejected' ? (
                        <XCircle size={24} className="text-white" />
                      ) : (
                        <AlertCircle size={24} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Challenge Details */}
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border-2 border-white/10 space-y-4">
              <h3 className="text-white font-bold text-xl mb-4">تفاصيل التحدي</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-500/30">
                  <p className="text-orange-400 font-semibold mb-2">الخصم الأول</p>
                  <p className="text-white font-bold text-lg">{request.opponent1}</p>
                  {request.opponent1PlatformId && (
                    <p className="text-gray-400 text-sm mt-1">ID: {request.opponent1PlatformId}</p>
                  )}
                  {request.opponent1Avatar && request.opponent1Avatar !== '/default-avatar.png' && (
                    <img 
                      src={request.opponent1Avatar} 
                      alt={request.opponent1}
                      className="w-16 h-16 rounded-full mt-2 border-2 border-orange-500 object-cover"
                    />
                  )}
                </div>

                <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 rounded-xl border border-cyan-500/30">
                  <p className="text-cyan-400 font-semibold mb-2">الخصم الثاني</p>
                  <p className="text-white font-bold text-lg">{request.opponent2}</p>
                  {request.opponent2PlatformId && (
                    <p className="text-gray-400 text-sm mt-1">ID: {request.opponent2PlatformId}</p>
                  )}
                  {request.opponent2Avatar && request.opponent2Avatar !== '/default-avatar.png' && (
                    <img 
                      src={request.opponent2Avatar} 
                      alt={request.opponent2}
                      className="w-16 h-16 rounded-full mt-2 border-2 border-cyan-500 object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 font-semibold">نوع الجولة:</span>
                  <span className="text-white font-bold">{request.roundType || 'BO1'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 font-semibold">التاريخ والوقت:</span>
                  <span className="text-white font-bold">
                    {new Date(request.dateTime).toLocaleString('ar-EG')}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400 font-semibold">كود التتبع:</span>
                <span className="text-purple-400 font-bold">{request.trackingCode}</span>
              </div>
            </div>

            {/* Banner Preview */}
            {request.opponent1 && request.opponent2 && request.dateTime && (
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border-2 border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBanner(!showBanner)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg mb-4"
                >
                  <Eye size={20} />
                  {showBanner ? 'إخفاء معاينة البنر' : 'معاينة البنر'}
                </button>
                
                {showBanner && (
                  <div>
                    <h3 className="text-white font-bold mb-4 text-center">معاينة البنر</h3>
                    <BannerCard challenge={request} />
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            {request.status === 'approved' && (
              <div className="bg-green-500/20 border-2 border-green-500/50 p-6 rounded-2xl text-center backdrop-blur-sm">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <p className="text-green-300 font-bold text-lg mb-2">تم الموافقة على طلبك!</p>
                <p className="text-green-200">يمكنك متابعة التحدي في صفحة العرض المباشر</p>
              </div>
            )}

            {request.status === 'rejected' && (
              <div className="bg-red-500/20 border-2 border-red-500/50 p-6 rounded-2xl backdrop-blur-sm">
                <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                <p className="text-red-300 font-bold text-lg mb-2">تم رفض الطلب</p>
                {request.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-500/10 rounded-xl">
                    <p className="text-red-300 font-bold mb-2">سبب الرفض:</p>
                    <p className="text-red-200">{request.rejectionReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckStatus;
