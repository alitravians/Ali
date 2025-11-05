import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { ArrowLeft, Users, Image, Power, Trophy, X, Check, Edit, Trash2, Upload, Sparkles } from 'lucide-react';
import { uploadImageToCloudinary } from '../utils/uploadImage';
import BannerCard from '../components/BannerCard';

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
    platformId1: '',
    platformId2: '',
    roundType: '',
    date: '',
    time: '',
    score1: 0,
    score2: 0
  });
  const [avatarFiles, setAvatarFiles] = useState({
    file1: null,
    file2: null,
    preview1: null,
    preview2: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const [bannerForm, setBannerForm] = useState({
    opponent1Id: '',
    opponent2Id: '',
    opponent1PlatformId: '',
    opponent2PlatformId: '',
    roundType: '',
    date: '',
    time: '',
    score1: 0,
    score2: 0
  });

  const [editingChallenge, setEditingChallenge] = useState(null);

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

      const dateTime = `${opponentForm.date}T${opponentForm.time}:00`;

      await set(newOpponentRef, {
        name1: opponentForm.name1,
        name2: opponentForm.name2,
        avatar1: avatar1Url,
        avatar2: avatar2Url,
        platformId1: opponentForm.platformId1,
        platformId2: opponentForm.platformId2,
        roundType: opponentForm.roundType,
        dateTime: dateTime,
        score1: parseInt(opponentForm.score1) || 0,
        score2: parseInt(opponentForm.score2) || 0
      });

      const challengesRef = ref(database, 'approvedChallenges');
      await push(challengesRef, {
        opponent1: opponentForm.name1,
        opponent2: opponentForm.name2,
        opponent1Avatar: avatar1Url,
        opponent2Avatar: avatar2Url,
        opponent1PlatformId: opponentForm.platformId1,
        opponent2PlatformId: opponentForm.platformId2,
        roundType: opponentForm.roundType,
        dateTime: dateTime,
        score1: parseInt(opponentForm.score1) || 0,
        score2: parseInt(opponentForm.score2) || 0,
        status: 'approved',
        createdAt: new Date().toISOString()
      });

      setOpponentForm({ 
        name1: '', 
        name2: '', 
        avatar1: '', 
        avatar2: '', 
        platformId1: '',
        platformId2: '',
        roundType: '',
        date: '', 
        time: '',
        score1: 0,
        score2: 0
      });
      setAvatarFiles({ file1: null, file2: null, preview1: null, preview2: null });
      setIsUploading(false);
      alert('تم إضافة الخصم وتوليد البنر تلقائياً ✅');
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

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge);
  };

  const handleSaveEditChallenge = async () => {
    if (!editingChallenge) return;
    
    const challengeRef = ref(database, `approvedChallenges/${editingChallenge.id}`);
    await update(challengeRef, {
      opponent1: editingChallenge.opponent1,
      opponent2: editingChallenge.opponent2,
      opponent1PlatformId: editingChallenge.opponent1PlatformId,
      opponent2PlatformId: editingChallenge.opponent2PlatformId,
      roundType: editingChallenge.roundType,
      score1: parseInt(editingChallenge.score1) || 0,
      score2: parseInt(editingChallenge.score2) || 0,
      dateTime: editingChallenge.dateTime
    });
    
    setEditingChallenge(null);
    alert('تم تحديث التحدي بنجاح ✅');
  };

  const handleDeleteChallenge = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا التحدي؟')) {
      const challengeRef = ref(database, `approvedChallenges/${id}`);
      await remove(challengeRef);
      alert('تم حذف التحدي بنجاح ✅');
    }
  };

  const handleSiteSettings = async () => {
    const settingsRef = ref(database, 'siteSettings');
    await set(settingsRef, siteSettings);
    alert('تم حفظ الإعدادات');
  };

  const handleGenerateBanner = async (e) => {
    e.preventDefault();
    
    const opponent1 = opponents.find(o => o.id === bannerForm.opponent1Id);
    const opponent2 = opponents.find(o => o.id === bannerForm.opponent2Id);
    
    if (!opponent1 || !opponent2) {
      alert('يرجى اختيار الخصمين');
      return;
    }

    const dateTime = new Date(`${bannerForm.date}T${bannerForm.time}`).toISOString();
    
    const bannerData = {
      opponent1: opponent1.name1,
      opponent2: opponent2.name2,
      opponent1Avatar: opponent1.avatar1,
      opponent2Avatar: opponent2.avatar2,
      opponent1PlatformId: bannerForm.opponent1PlatformId,
      opponent2PlatformId: bannerForm.opponent2PlatformId,
      roundType: bannerForm.roundType,
      dateTime: dateTime,
      score1: parseInt(bannerForm.score1) || 0,
      score2: parseInt(bannerForm.score2) || 0,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    const challengesRef = ref(database, 'approvedChallenges');
    await push(challengesRef, bannerData);
    
    setBannerForm({
      opponent1Id: '',
      opponent2Id: '',
      opponent1PlatformId: '',
      opponent2PlatformId: '',
      roundType: '',
      date: '',
      time: '',
      score1: 0,
      score2: 0
    });
    
    alert('تم توليد البنر بنجاح!');
  };

  const getPreviewBanner = () => {
    const opponent1 = opponents.find(o => o.id === bannerForm.opponent1Id);
    const opponent2 = opponents.find(o => o.id === bannerForm.opponent2Id);
    
    if (!opponent1 || !opponent2 || !bannerForm.date || !bannerForm.time) {
      return null;
    }

    return {
      opponent1: opponent1.name1,
      opponent2: opponent2.name2,
      opponent1Avatar: opponent1.avatar1,
      opponent2Avatar: opponent2.avatar2,
      opponent1PlatformId: bannerForm.opponent1PlatformId,
      opponent2PlatformId: bannerForm.opponent2PlatformId,
      roundType: bannerForm.roundType,
      dateTime: new Date(`${bannerForm.date}T${bannerForm.time}`).toISOString(),
      score1: parseInt(bannerForm.score1) || 0,
      score2: parseInt(bannerForm.score2) || 0
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all shadow-lg border border-white/10 backdrop-blur-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent">{t('adminPanel')}</h1>
        </div>

        <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50">
              <Users size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">تسجيل دخول الإدارة</h2>
            <p className="text-gray-300">أدخل رمز الإدارة للوصول إلى لوحة التحكم</p>
          </div>
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
                className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm placeholder-gray-400"
                placeholder="أدخل رمز الإدارة"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/50 transform hover:scale-105"
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
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/10"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent">{t('adminPanel')}</h1>
              <p className="text-gray-300 text-sm">إدارة كاملة للموقع والتحديات</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl transition-all shadow-lg shadow-red-500/50 font-bold"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('opponents')}
          className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
            activeTab === 'opponents'
              ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-purple-500/50'
              : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
          }`}
        >
          <Users size={32} />
          <span className="text-center">{t('manageOpponents')}</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
            activeTab === 'requests'
              ? 'bg-gradient-to-br from-cyan-600 to-cyan-500 text-white shadow-cyan-500/50'
              : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
          }`}
        >
          <Image size={32} />
          <span className="text-center">طلبات التحديات</span>
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
            activeTab === 'results'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Trophy size={32} />
          <span className="text-center">{t('resultsManagement')}</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
            activeTab === 'settings'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Power size={32} />
          <span className="text-center">{t('siteControl')}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-xl">
        {activeTab === 'opponents' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">إدارة الخصوم</h2>
            <form onSubmit={handleAddOpponent} className="space-y-4 bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
              {uploadError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border-2 border-red-200">
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
                  className="px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="اسم الخصم الثاني"
                  value={opponentForm.name2}
                  onChange={(e) => setOpponentForm({ ...opponentForm, name2: e.target.value })}
                  required
                  className="px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                
                <div className="space-y-2">
                  <label className="block text-gray-800 font-bold text-sm">صورة الخصم الأول</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl cursor-pointer transition-colors">
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
                  <label className="block text-gray-800 font-bold text-sm">صورة الخصم الثاني</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl cursor-pointer transition-colors">
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

                <div className="space-y-2">
                  <label className="block text-gray-800 font-bold text-sm">أدي الخصم الأول (Platform ID)</label>
                  <input
                    type="text"
                    placeholder="مثال: 964666912"
                    value={opponentForm.platformId1}
                    onChange={(e) => setOpponentForm({ ...opponentForm, platformId1: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-800 font-bold text-sm">أدي الخصم الثاني (Platform ID)</label>
                  <input
                    type="text"
                    placeholder="مثال: 1057920970"
                    value={opponentForm.platformId2}
                    onChange={(e) => setOpponentForm({ ...opponentForm, platformId2: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-800 font-bold text-sm">نوع الجولة</label>
                  <input
                    type="text"
                    placeholder="مثال: الجولة 1"
                    value={opponentForm.roundType}
                    onChange={(e) => setOpponentForm({ ...opponentForm, roundType: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-800 font-bold text-sm">تاريخ التحدي</label>
                  <input
                    type="date"
                    value={opponentForm.date}
                    onChange={(e) => setOpponentForm({ ...opponentForm, date: e.target.value })}
                    required
                    dir="ltr"
                    className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-800 font-bold text-sm">وقت التحدي</label>
                  <input
                    type="time"
                    value={opponentForm.time}
                    onChange={(e) => setOpponentForm({ ...opponentForm, time: e.target.value })}
                    required
                    dir="ltr"
                    step="60"
                    className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-800 font-bold text-sm">النتيجة - الخصم الأول</label>
                  <input
                    type="number"
                    min="0"
                    value={opponentForm.score1}
                    onChange={(e) => setOpponentForm({ ...opponentForm, score1: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-800 font-bold text-sm">النتيجة - الخصم الثاني</label>
                  <input
                    type="number"
                    min="0"
                    value={opponentForm.score2}
                    onChange={(e) => setOpponentForm({ ...opponentForm, score2: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className={`w-full px-6 py-4 font-bold rounded-xl transition-all shadow-lg ${
                  isUploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
                } text-white`}
              >
                {isUploading ? 'جاري الرفع...' : 'إضافة خصم وتوليد البنر تلقائياً'}
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
            <h2 className="text-3xl font-bold text-gray-800 mb-6">إدارة نتائج التحديات</h2>
            <div className="space-y-8">
              {approvedChallenges.map((challenge) => (
                <div key={challenge.id} className="space-y-4">
                  {editingChallenge?.id === challenge.id ? (
                    <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-8 space-y-6">
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">تعديل التحدي</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">اسم الخصم الأول</label>
                          <input
                            type="text"
                            value={editingChallenge.opponent1}
                            onChange={(e) => setEditingChallenge({...editingChallenge, opponent1: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">اسم الخصم الثاني</label>
                          <input
                            type="text"
                            value={editingChallenge.opponent2}
                            onChange={(e) => setEditingChallenge({...editingChallenge, opponent2: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">معرف المنصة - الخصم الأول</label>
                          <input
                            type="text"
                            value={editingChallenge.opponent1PlatformId || ''}
                            onChange={(e) => setEditingChallenge({...editingChallenge, opponent1PlatformId: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">معرف المنصة - الخصم الثاني</label>
                          <input
                            type="text"
                            value={editingChallenge.opponent2PlatformId || ''}
                            onChange={(e) => setEditingChallenge({...editingChallenge, opponent2PlatformId: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">نوع الجولة</label>
                          <input
                            type="text"
                            value={editingChallenge.roundType || ''}
                            onChange={(e) => setEditingChallenge({...editingChallenge, roundType: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">النتيجة 1</label>
                            <input
                              type="number"
                              value={editingChallenge.score1 || 0}
                              onChange={(e) => setEditingChallenge({...editingChallenge, score1: e.target.value})}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">النتيجة 2</label>
                            <input
                              type="number"
                              value={editingChallenge.score2 || 0}
                              onChange={(e) => setEditingChallenge({...editingChallenge, score2: e.target.value})}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={handleSaveEditChallenge}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
                        >
                          حفظ التعديلات ✓
                        </button>
                        <button
                          onClick={() => setEditingChallenge(null)}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-xl transition-all shadow-lg"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <BannerCard challenge={challenge} />
                      <div className="max-w-5xl mx-auto space-y-4">
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleEditChallenge(challenge)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg"
                          >
                            <Edit size={20} />
                            تعديل التحدي
                          </button>
                          <button
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl transition-all shadow-lg"
                          >
                            <Trash2 size={20} />
                            حذف التحدي
                          </button>
                        </div>
                        {!challenge.result && (
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleUpdateResult(challenge.id, challenge.opponent1)}
                              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg transform hover:scale-105"
                            >
                              {challenge.opponent1} فاز 🏆
                            </button>
                            <button
                              onClick={() => handleUpdateResult(challenge.id, challenge.opponent2)}
                              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all shadow-lg transform hover:scale-105"
                            >
                              {challenge.opponent2} فاز 🏆
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {approvedChallenges.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl shadow-xl">
                  <p className="text-gray-600 text-xl">لا توجد تحديات معتمدة حالياً</p>
                </div>
              )}
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
