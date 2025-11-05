import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { ArrowLeft, Users, Image, Power, Trophy, X, Check, Edit, Trash2, Upload } from 'lucide-react';
import { uploadImageToCloudinary } from '../utils/uploadImage';

function AdminPanel({ onNavigate, onLogout }) {
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [activeTab, setActiveTab] = useState('opponents');
  const [opponents, setOpponents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [approvedChallenges, setApprovedChallenges] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ isOpen: true, closureReason: '' });

  const [opponentForm, setOpponentForm] = useState({
    name1: '',
    name2: '',
    avatar1: '',
    avatar2: '',
    dateTime: ''
  });
  const [avatarFiles, setAvatarFiles] = useState({
    file1: null,
    file2: null,
    preview1: null,
    preview2: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('adminAuth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const opponentsRef = ref(database, 'opponents');
    const requestsRef = ref(database, 'challengeRequests');
    const challengesRef = ref(database, 'approvedChallenges');
    const settingsRef = ref(database, 'siteSettings');

    const unsubscribe1 = onValue(opponentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setOpponents(Object.entries(data).map(([id, value]) => ({ id, ...value })));
      } else {
        setOpponents([]);
      }
    });

    const unsubscribe2 = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setRequests(Object.entries(data).map(([id, value]) => ({ id, ...value })));
      } else {
        setRequests([]);
      }
    });

    const unsubscribe3 = onValue(challengesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setApprovedChallenges(Object.entries(data).map(([id, value]) => ({ id, ...value })));
      } else {
        setApprovedChallenges([]);
      }
    });

    const unsubscribe4 = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings(snapshot.val());
      }
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
    };
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminCode === '3131') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
    } else {
      alert('رمز الإدارة غير صحيح');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    onLogout();
  };

  const handleAvatarFileChange = (fileNumber, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    setUploadError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      if (fileNumber === 1) {
        setAvatarFiles(prev => ({ ...prev, file1: file, preview1: reader.result }));
      } else {
        setAvatarFiles(prev => ({ ...prev, file2: file, preview2: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddOpponent = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError('');

    try {
      const opponentsRef = ref(database, 'opponents');
      const newOpponentRef = push(opponentsRef);
      const opponentKey = newOpponentRef.key;

      let avatar1Url = opponentForm.avatar1;
      let avatar2Url = opponentForm.avatar2;

      if (avatarFiles.file1) {
        try {
          avatar1Url = await uploadImageToCloudinary(
            avatarFiles.file1,
            `${opponentKey}_first`
          );
        } catch (error) {
          setUploadError(`خطأ في رفع صورة الخصم الأول: ${error.message}`);
          setIsUploading(false);
          return;
        }
      }

      if (avatarFiles.file2) {
        try {
          avatar2Url = await uploadImageToCloudinary(
            avatarFiles.file2,
            `${opponentKey}_second`
          );
        } catch (error) {
          setUploadError(`خطأ في رفع صورة الخصم الثاني: ${error.message}`);
          setIsUploading(false);
          return;
        }
      }

      await set(newOpponentRef, {
        name1: opponentForm.name1,
        name2: opponentForm.name2,
        avatar1: avatar1Url,
        avatar2: avatar2Url,
        dateTime: opponentForm.dateTime
      });

      setOpponentForm({ name1: '', name2: '', avatar1: '', avatar2: '', dateTime: '' });
      setAvatarFiles({ file1: null, file2: null, preview1: null, preview2: null });
      setIsUploading(false);
    } catch (error) {
      console.error('Error adding opponent:', error);
      setUploadError('حدث خطأ أثناء إضافة الخصم. يرجى المحاولة مرة أخرى');
      setIsUploading(false);
    }
  };

  const handleDeleteOpponent = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا الخصم؟')) {
      const opponentRef = ref(database, `opponents/${id}`);
      await remove(opponentRef);
    }
  };

  const handleApproveRequest = async (request) => {
    const challengesRef = ref(database, 'approvedChallenges');
    await push(challengesRef, {
      opponent1: request.opponent1,
      opponent2: request.opponent2,
      dateTime: request.dateTime,
      opponent1Avatar: request.opponent1Avatar || '',
      opponent2Avatar: request.opponent2Avatar || '',
      approvedAt: new Date().toISOString()
    });

    const requestRef = ref(database, `challengeRequests/${request.id}`);
    await update(requestRef, { status: 'approved' });
  };

  const handleRejectRequest = async (id, reason) => {
    const requestRef = ref(database, `challengeRequests/${id}`);
    await update(requestRef, { 
      status: 'rejected',
      rejectionReason: reason || 'لم يتم تحديد سبب'
    });
  };

  const handleUpdateResult = async (id, result) => {
    const challengeRef = ref(database, `approvedChallenges/${id}`);
    await update(challengeRef, { result });
  };

  const handleSiteSettings = async () => {
    const settingsRef = ref(database, 'siteSettings');
    await set(settingsRef, siteSettings);
    alert('تم حفظ الإعدادات');
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-white">{t('adminPanel')}</h1>
        </div>

        <div className="max-w-md mx-auto bg-slate-800 rounded-xl p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white font-bold mb-2">
                {t('adminCode')}
              </label>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="أدخل رمز الإدارة"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all"
            >
              {t('login')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-white">{t('adminPanel')}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          تسجيل الخروج
        </button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => setActiveTab('opponents')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
            activeTab === 'opponents'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          <Users size={20} />
          {t('manageOpponents')}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
            activeTab === 'requests'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          <Image size={20} />
          طلبات التحديات
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
            activeTab === 'results'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          <Trophy size={20} />
          {t('resultsManagement')}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          <Power size={20} />
          {t('siteControl')}
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
        {activeTab === 'opponents' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">إدارة الخصوم</h2>
            <form onSubmit={handleAddOpponent} className="space-y-4 bg-slate-700 p-6 rounded-lg">
              {uploadError && (
                <div className="p-3 bg-red-600 text-white rounded-lg">
                  {uploadError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="اسم الخصم الأول"
                  value={opponentForm.name1}
                  onChange={(e) => setOpponentForm({ ...opponentForm, name1: e.target.value })}
                  required
                  className="px-4 py-3 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="اسم الخصم الثاني"
                  value={opponentForm.name2}
                  onChange={(e) => setOpponentForm({ ...opponentForm, name2: e.target.value })}
                  required
                  className="px-4 py-3 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                
                <div className="space-y-2">
                  <label className="block text-white font-bold text-sm">صورة الخصم الأول</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload size={20} />
                      <span>{avatarFiles.file1 ? avatarFiles.file1.name : 'اختر صورة من الجهاز'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => handleAvatarFileChange(1, e)}
                        className="hidden"
                      />
                    </label>
                    {avatarFiles.preview1 && (
                      <img
                        src={avatarFiles.preview1}
                        alt="معاينة"
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-white font-bold text-sm">صورة الخصم الثاني</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload size={20} />
                      <span>{avatarFiles.file2 ? avatarFiles.file2.name : 'اختر صورة من الجهاز'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => handleAvatarFileChange(2, e)}
                        className="hidden"
                      />
                    </label>
                    {avatarFiles.preview2 && (
                      <img
                        src={avatarFiles.preview2}
                        alt="معاينة"
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                      />
                    )}
                  </div>
                </div>

                <input
                  type="datetime-local"
                  value={opponentForm.dateTime}
                  onChange={(e) => setOpponentForm({ ...opponentForm, dateTime: e.target.value })}
                  required
                  className="px-4 py-3 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className={`w-full px-6 py-3 font-bold rounded-lg transition-colors ${
                  isUploading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isUploading ? 'جاري الرفع...' : 'إضافة خصم'}
              </button>
            </form>

            <div className="space-y-4">
              {opponents.map((opponent) => (
                <div key={opponent.id} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-white font-bold">
                      {opponent.name1} VS {opponent.name2}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(opponent.dateTime).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteOpponent(opponent.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">طلبات التحديات</h2>
            <div className="space-y-4">
              {requests.filter(r => r.status === 'pending').map((request) => (
                <div key={request.id} className="bg-slate-700 p-6 rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-bold text-lg">
                        {request.opponent1} VS {request.opponent2}
                      </p>
                      <p className="text-gray-400">
                        {new Date(request.dateTime).toLocaleString('ar-EG')}
                      </p>
                      <p className="text-gray-500 text-sm">
                        كود المراجعة: {request.trackingCode}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm">
                      قيد المراجعة
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApproveRequest(request)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Check size={20} />
                      موافقة
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('أدخل سبب الرفض:');
                        if (reason) handleRejectRequest(request.id, reason);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <X size={20} />
                      رفض
                    </button>
                  </div>
                </div>
              ))}
              {requests.filter(r => r.status === 'pending').length === 0 && (
                <p className="text-gray-400 text-center py-8">لا توجد طلبات قيد المراجعة</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">إدارة نتائج التحديات</h2>
            <div className="space-y-4">
              {approvedChallenges.map((challenge) => (
                <div key={challenge.id} className="bg-slate-700 p-6 rounded-lg space-y-4">
                  <div>
                    <p className="text-white font-bold text-lg">
                      {challenge.opponent1} VS {challenge.opponent2}
                    </p>
                    <p className="text-gray-400">
                      {new Date(challenge.dateTime).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  {challenge.result ? (
                    <div className="p-3 bg-green-600 rounded-lg">
                      <p className="text-white font-bold">الفائز: {challenge.result}</p>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleUpdateResult(challenge.id, challenge.opponent1)}
                        className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                      >
                        {challenge.opponent1} فاز
                      </button>
                      <button
                        onClick={() => handleUpdateResult(challenge.id, challenge.opponent2)}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        {challenge.opponent2} فاز
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">إعدادات الموقع</h2>
            <div className="space-y-4 bg-slate-700 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">حالة الموقع:</span>
                <button
                  onClick={() => setSiteSettings({ ...siteSettings, isOpen: !siteSettings.isOpen })}
                  className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                    siteSettings.isOpen
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {siteSettings.isOpen ? 'مفتوح' : 'مغلق'}
                </button>
              </div>
              {!siteSettings.isOpen && (
                <div>
                  <label className="block text-white font-bold mb-2">
                    سبب الإغلاق:
                  </label>
                  <textarea
                    value={siteSettings.closureReason}
                    onChange={(e) => setSiteSettings({ ...siteSettings, closureReason: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="4"
                    placeholder="أدخل سبب إغلاق الموقع"
                  />
                </div>
              )}
              <button
                onClick={handleSiteSettings}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
