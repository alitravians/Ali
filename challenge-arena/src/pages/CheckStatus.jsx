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
          className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-white">{t('checkStatus')}</h1>
      </div>

      <div className="max-w-2xl mx-auto bg-slate-800 rounded-xl p-8 shadow-lg">
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
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="أدخل كود المراجعة"
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50"
          >
            <Search size={20} />
            {searching ? 'جاري البحث...' : t('checkStatus')}
          </button>
        </form>

        {notFound && (
          <div className="mt-6 p-4 bg-red-600 rounded-lg text-center">
            <p className="text-white font-bold">لم يتم العثور على طلب بهذا الكود</p>
          </div>
        )}

        {request && (
          <div className="mt-6 space-y-4">
            <div className={`p-4 ${getStatusColor(request.status)} rounded-lg text-center`}>
              <p className="text-white font-bold text-xl">
                {t('status')}: {getStatusText(request.status)}
              </p>
            </div>

            <div className="bg-slate-700 p-6 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">الخصم الأول:</span>
                <span className="text-white font-bold">{request.opponent1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">الخصم الثاني:</span>
                <span className="text-white font-bold">{request.opponent2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">التاريخ والوقت:</span>
                <span className="text-white font-bold">
                  {new Date(request.dateTime).toLocaleString('ar-EG')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">تاريخ التقديم:</span>
                <span className="text-white font-bold">
                  {new Date(request.submittedAt).toLocaleString('ar-EG')}
                </span>
              </div>
            </div>

            {request.status === 'approved' && (
              <div className="bg-green-600 p-4 rounded-lg text-center">
                <p className="text-white">تم الموافقة على طلبك! يمكنك متابعة التحدي في صفحة العرض المباشر</p>
              </div>
            )}

            {request.status === 'rejected' && request.rejectionReason && (
              <div className="bg-red-600 p-4 rounded-lg">
                <p className="text-white font-bold mb-2">سبب الرفض:</p>
                <p className="text-white">{request.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckStatus;
