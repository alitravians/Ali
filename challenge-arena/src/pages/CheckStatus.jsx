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
          className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors shadow-md"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{t('checkStatus')}</h1>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label className="block text-gray-800 font-bold mb-2">
              {t('trackingCode')}
            </label>
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-3 bg-gray-50 text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="أدخل كود المراجعة"
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
          >
            <Search size={20} />
            {searching ? 'جاري البحث...' : t('checkStatus')}
          </button>
        </form>

        {notFound && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-center">
            <p className="text-red-700 font-bold">لم يتم العثور على طلب بهذا الكود</p>
          </div>
        )}

        {request && (
          <div className="mt-6 space-y-4">
            <div className={`p-6 ${getStatusColor(request.status)} rounded-xl text-center shadow-lg`}>
              <p className="text-white font-bold text-2xl">
                {t('status')}: {getStatusText(request.status)}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600 font-semibold">الخصم الأول:</span>
                <span className="text-gray-800 font-bold">{request.opponent1}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600 font-semibold">الخصم الثاني:</span>
                <span className="text-gray-800 font-bold">{request.opponent2}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600 font-semibold">التاريخ والوقت:</span>
                <span className="text-gray-800 font-bold">
                  {new Date(request.dateTime).toLocaleString('ar-EG')}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600 font-semibold">تاريخ التقديم:</span>
                <span className="text-gray-800 font-bold">
                  {new Date(request.submittedAt).toLocaleString('ar-EG')}
                </span>
              </div>
            </div>

            {request.status === 'approved' && (
              <div className="bg-green-50 border-2 border-green-200 p-6 rounded-xl text-center">
                <p className="text-green-700 font-bold">تم الموافقة على طلبك! يمكنك متابعة التحدي في صفحة العرض المباشر</p>
              </div>
            )}

            {request.status === 'rejected' && request.rejectionReason && (
              <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl">
                <p className="text-red-700 font-bold mb-2">سبب الرفض:</p>
                <p className="text-red-600">{request.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckStatus;
