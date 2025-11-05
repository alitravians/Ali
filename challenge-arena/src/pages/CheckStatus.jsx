import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { ArrowLeft, Search } from 'lucide-react';

function CheckStatus({ onNavigate }) {
  const { t } = useLanguage();
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
        return 'bg-orange-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return t('approved');
      case 'rejected':
        return t('rejected');
      default:
        return t('pending');
    }
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
          <div className="mt-6 space-y-4">
            <div className={`p-6 ${getStatusColor(request.status)} rounded-xl text-center shadow-lg`}>
              <p className="text-white font-bold text-2xl">
                {t('status')}: {getStatusText(request.status)}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border-2 border-white/10 space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400 font-semibold">الخصم الأول:</span>
                <span className="text-white font-bold">{request.opponent1}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400 font-semibold">الخصم الثاني:</span>
                <span className="text-white font-bold">{request.opponent2}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400 font-semibold">التاريخ والوقت:</span>
                <span className="text-white font-bold">
                  {new Date(request.dateTime).toLocaleString('ar-EG')}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400 font-semibold">تاريخ التقديم:</span>
                <span className="text-white font-bold">
                  {new Date(request.submittedAt).toLocaleString('ar-EG')}
                </span>
              </div>
            </div>

            {request.status === 'approved' && (
              <div className="bg-green-500/20 border-2 border-green-500/50 p-6 rounded-xl text-center backdrop-blur-sm">
                <p className="text-green-300 font-bold">تم الموافقة على طلبك! يمكنك متابعة التحدي في صفحة العرض المباشر</p>
              </div>
            )}

            {request.status === 'rejected' && request.rejectionReason && (
              <div className="bg-red-500/20 border-2 border-red-500/50 p-6 rounded-xl backdrop-blur-sm">
                <p className="text-red-300 font-bold mb-2">سبب الرفض:</p>
                <p className="text-red-200">{request.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckStatus;
