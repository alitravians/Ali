import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { database } from '../utils/firebase';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { ArrowLeft, Users, Image, Power, Trophy, X, Check, Edit, Trash2, Upload, Sparkles, RefreshCw, Database, Layout, Wand2, Loader2 } from 'lucide-react';
import { uploadImageToCloudinary } from '../utils/uploadImage';
import BannerCard from '../components/BannerCard';
import BannerLayoutEditor from '../components/BannerLayoutEditor';
import BannerImageManager from '../components/BannerImageManager';
import { useBannerSettings } from '../hooks/useBannerSettings';
import { versionManager } from '../utils/versionManager';
import { generateChangelog, getLastUpdateDate } from '../utils/changelogGenerator';

function AdminPanel({ onNavigate, onLogout }) {
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [activeTab, setActiveTab] = useState('opponents');
  const [opponents, setOpponents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [approvedChallenges, setApprovedChallenges] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ isOpen: true, closureReason: '' });
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    agencyName: 'أرض التحديات',
    logoEmoji: '⭐',
    tagline: 'نُعيد ضبط التجربة — تحديثات جودة وأداء',
    until: '',
    theme: {
      glow1: '#60a5fa',
      glow2: '#22d3ee',
      glow3: '#a78bfa',
      ink: '#e6e9ef',
      muted: '#9aa3b2',
      bg: '#0b0f1a',
      bg2: '#101628'
    }
  });
  
  const {
    settings: bannerSettings, 
    getActivePreset, 
    setActivePreset, 
    saveSettings: saveBannerSettings,
    DEFAULT_PRESETS 
  } = useBannerSettings();

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

  const [tournaments, setTournaments] = useState([]);
  const [tournamentForm, setTournamentForm] = useState({ name: '', game: '', date: '', status: 'open' });
  const [editingTournament, setEditingTournament] = useState(null);

  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardForm, setLeaderboardForm] = useState({ name: '', points: '' });
  const [editingPlayer, setEditingPlayer] = useState(null);

  const [rules, setRules] = useState([]);
  const [ruleForm, setRuleForm] = useState({ textAr: '', textEn: '', order: 0 });
  const [editingRule, setEditingRule] = useState(null);

  const [updates, setUpdates] = useState([]);
  const [updateForm, setUpdateForm] = useState({ date: '', textAr: '', textEn: '' });
  const [editingUpdate, setEditingUpdate] = useState(null);
  
  const [aiGeneratorState, setAiGeneratorState] = useState({
    isGenerating: false,
    error: null,
    preview: null,
    owner: 'alitravians',
    repo: 'Ali',
    path: 'challenge-arena',
    branch: 'challenge-arena-implementation',
    version: versionManager.getCurrentVersion()
  });

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
    const maintenanceRef = ref(database, 'siteSettings/maintenance');
    const tournamentsRef = ref(database, 'tournaments');
    const leaderboardRef = ref(database, 'leaderboard');
    const rulesRef = ref(database, 'rules');
    const updatesRef = ref(database, 'updates');

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

    const unsubscribe5 = onValue(maintenanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setMaintenanceSettings(snapshot.val());
      }
    });

    const unsubscribe6 = onValue(tournamentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTournaments(Object.entries(data).map(([id, value]) => ({ id, ...value })));
      } else {
        setTournaments([]);
      }
    });

    const unsubscribe7 = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLeaderboard(Object.entries(data).map(([id, value]) => ({ id, ...value })).sort((a, b) => b.points - a.points));
      } else {
        setLeaderboard([]);
      }
    });

    const unsubscribe8 = onValue(rulesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setRules(Object.entries(data).map(([id, value]) => ({ id, ...value })).sort((a, b) => a.order - b.order));
      } else {
        setRules([]);
      }
    });

    const unsubscribe9 = onValue(updatesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUpdates(Object.entries(data).map(([id, value]) => ({ id, ...value })).sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else {
        setUpdates([]);
      }
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
      unsubscribe5();
      unsubscribe6();
      unsubscribe7();
      unsubscribe8();
      unsubscribe9();
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

  const handleMaintenanceSettings = async () => {
    const maintenanceRef = ref(database, 'siteSettings/maintenance');
    await set(maintenanceRef, maintenanceSettings);
    alert('تم حفظ إعدادات صفحة الصيانة بنجاح!');
  };

  const handleClearCache = () => {
    if (confirm('هل أنت متأكد من حذف الذاكرة المؤقتة؟ سيتم تحديث الموقع تلقائياً.')) {
      versionManager.clearCacheAndReload();
    }
  };

  const handleForceRefresh = () => {
    versionManager.softRefresh();
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

  const handleAddTournament = async (e) => {
    e.preventDefault();
    if (!tournamentForm.name) return;
    
    const tournamentsRef = ref(database, 'tournaments');
    await push(tournamentsRef, {
      name: tournamentForm.name,
      game: tournamentForm.game,
      date: tournamentForm.date,
      status: tournamentForm.status,
      createdAt: Date.now()
    });
    
    setTournamentForm({ name: '', game: '', date: '', status: 'open' });
    alert('تم إضافة البطولة بنجاح ✅');
  };

  const handleUpdateTournament = async () => {
    if (!editingTournament) return;
    
    const tournamentRef = ref(database, `tournaments/${editingTournament.id}`);
    await update(tournamentRef, {
      name: editingTournament.name,
      game: editingTournament.game,
      date: editingTournament.date,
      status: editingTournament.status
    });
    
    setEditingTournament(null);
    alert('تم تحديث البطولة بنجاح ✅');
  };

  const handleDeleteTournament = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذه البطولة؟')) {
      const tournamentRef = ref(database, `tournaments/${id}`);
      await remove(tournamentRef);
      alert('تم حذف البطولة بنجاح ✅');
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!leaderboardForm.name || !leaderboardForm.points) return;
    
    const playersRef = ref(database, 'leaderboard');
    await push(playersRef, {
      name: leaderboardForm.name,
      points: parseInt(leaderboardForm.points),
      createdAt: Date.now()
    });
    
    setLeaderboardForm({ name: '', points: '' });
    alert('تم إضافة اللاعب بنجاح ✅');
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;
    
    const playerRef = ref(database, `leaderboard/${editingPlayer.id}`);
    await update(playerRef, {
      name: editingPlayer.name,
      points: parseInt(editingPlayer.points)
    });
    
    setEditingPlayer(null);
    alert('تم تحديث اللاعب بنجاح ✅');
  };

  const handleDeletePlayer = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا اللاعب؟')) {
      const playerRef = ref(database, `leaderboard/${id}`);
      await remove(playerRef);
      alert('تم حذف اللاعب بنجاح ✅');
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.textAr || !ruleForm.textEn) return;
    
    const rulesRef = ref(database, 'rules');
    await push(rulesRef, {
      textAr: ruleForm.textAr,
      textEn: ruleForm.textEn,
      order: parseInt(ruleForm.order) || rules.length,
      createdAt: Date.now()
    });
    
    setRuleForm({ textAr: '', textEn: '', order: 0 });
    alert('تم إضافة القاعدة بنجاح ✅');
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    
    const ruleRef = ref(database, `rules/${editingRule.id}`);
    await update(ruleRef, {
      textAr: editingRule.textAr,
      textEn: editingRule.textEn,
      order: parseInt(editingRule.order)
    });
    
    setEditingRule(null);
    alert('تم تحديث القاعدة بنجاح ✅');
  };

  const handleDeleteRule = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذه القاعدة؟')) {
      const ruleRef = ref(database, `rules/${id}`);
      await remove(ruleRef);
      alert('تم حذف القاعدة بنجاح ✅');
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.date || !updateForm.textAr || !updateForm.textEn) return;
    
    const updatesRef = ref(database, 'updates');
    await push(updatesRef, {
      date: updateForm.date,
      textAr: updateForm.textAr,
      textEn: updateForm.textEn,
      createdAt: Date.now()
    });
    
    setUpdateForm({ date: '', textAr: '', textEn: '' });
    alert('تم إضافة التحديث بنجاح ✅');
  };

  const handleUpdateUpdate = async () => {
    if (!editingUpdate) return;
    
    const updateRef = ref(database, `updates/${editingUpdate.id}`);
    await update(updateRef, {
      date: editingUpdate.date,
      textAr: editingUpdate.textAr,
      textEn: editingUpdate.textEn
    });
    
    setEditingUpdate(null);
    alert('تم تحديث التحديث بنجاح ✅');
  };

  const handleDeleteUpdate = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا التحديث؟')) {
      const updateRef = ref(database, `updates/${id}`);
      await remove(updateRef);
      alert('تم حذف التحديث بنجاح ✅');
    }
  };

  const handleGenerateAIChangelog = async () => {
    setAiGeneratorState(prev => ({ ...prev, isGenerating: true, error: null, preview: null }));
    
    try {
      const since = getLastUpdateDate(updates);
      
      const changelog = await generateChangelog({
        owner: aiGeneratorState.owner,
        repo: aiGeneratorState.repo,
        since: since,
        path: aiGeneratorState.path,
        branch: aiGeneratorState.branch,
        version: aiGeneratorState.version
      });
      
      setAiGeneratorState(prev => ({
        ...prev,
        isGenerating: false,
        preview: changelog
      }));
    } catch (error) {
      setAiGeneratorState(prev => ({
        ...prev,
        isGenerating: false,
        error: error.message || 'فشل توليد التحديثات. يرجى المحاولة مرة أخرى.'
      }));
    }
  };

  const handleApplyAIChangelog = (mode = 'replace') => {
    if (!aiGeneratorState.preview) return;
    
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16); // Format for datetime-local input
    
    if (mode === 'replace') {
      setUpdateForm({
        date: formattedDate,
        textAr: aiGeneratorState.preview.textAr,
        textEn: aiGeneratorState.preview.textEn
      });
    } else if (mode === 'prepend') {
      setUpdateForm(prev => ({
        date: formattedDate,
        textAr: aiGeneratorState.preview.textAr + '\n\n' + prev.textAr,
        textEn: aiGeneratorState.preview.textEn + '\n\n' + prev.textEn
      }));
    }
    
    setAiGeneratorState(prev => ({ ...prev, preview: null }));
    alert('تم تطبيق التحديثات المولدة! يمكنك تعديلها قبل الحفظ.');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => onNavigate('home')}
              className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 backdrop-blur-sm"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white">لوحة التحكم</h1>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-white/10 px-8 py-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-xl">
                  <Users size={48} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">تسجيل دخول الإدارة</h2>
              <p className="text-slate-300">أدخل رمز الإدارة للوصول إلى لوحة التحكم</p>
            </div>

            <form onSubmit={handleLogin} className="px-8 py-8 space-y-6">
              <div className="space-y-3">
                <label className="block text-white font-semibold">
                  رمز الإدارة
                  <span className="text-red-400 mr-1">*</span>
                </label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm placeholder-slate-400 transition-all"
                  placeholder="أدخل رمز الإدارة"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50"
              >
                دخول
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('home')}
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">لوحة التحكم</h1>
                <p className="text-slate-300 text-sm mt-1">إدارة كاملة للموقع والتحديات</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl transition-all shadow-lg shadow-red-500/30 font-bold"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            onClick={() => setActiveTab('opponents')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'opponents'
                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-blue-500/50'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
            }`}
          >
            <Users size={32} />
            <span className="text-center text-sm md:text-base">إدارة الخصوم</span>
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
            <span className="text-center text-sm md:text-base">طلبات التحديات</span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'results'
                ? 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-green-500/50'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
            }`}
          >
            <Trophy size={32} />
            <span className="text-center text-sm md:text-base">إدارة النتائج</span>
          </button>
          <button
            onClick={() => setActiveTab('bannerLayout')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'bannerLayout'
                ? 'bg-gradient-to-br from-pink-600 to-rose-500 text-white shadow-pink-500/50'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
            }`}
          >
            <Layout size={32} />
            <span className="text-center text-sm md:text-base">تعديل البنرات و اضافة بنرات جديدة</span>
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'tournaments'
                ? 'bg-gradient-to-br from-yellow-600 to-yellow-500 text-white shadow-yellow-500/50'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
            }`}
          >
            <Trophy size={32} />
            <span className="text-center text-sm md:text-base">إدارة البطولات</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-orange-500/50'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
            }`}
          >
            <Users size={32} />
            <span className="text-center text-sm md:text-base">إدارة المتصدرين</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'rules'
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-indigo-500/50'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
            }`}
          >
            <Database size={32} />
            <span className="text-center text-sm md:text-base">إدارة القواعد</span>
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'updates'
                ? 'bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-teal-500/50'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
            }`}
          >
            <Sparkles size={32} />
            <span className="text-center text-sm md:text-base">إدارة التحديثات</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
              activeTab === 'settings'
                ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-purple-500/50'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm'
            }`}
          >
            <Power size={32} />
            <span className="text-center text-sm md:text-base">التحكم بالموقع</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-white/10">
        {activeTab === 'opponents' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">إدارة الخصوم</h2>
            <form onSubmit={handleAddOpponent} className="space-y-4 bg-white/5 p-6 rounded-xl border border-white/10">
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

        {activeTab === 'bannerLayout' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-6">تعديل البنرات و اضافة بنرات جديدة</h2>
            
            {/* Banner Image Management Section */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">إدارة البنرات</h3>
              <BannerImageManager />
            </div>

            {/* Banner Layout Editor Section */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">تخصيص تصميم البنر</h3>
              {bannerSettings ? (
                <BannerLayoutEditor
                initialLayout={getActivePreset()?.base || DEFAULT_PRESETS.default.base}
                onSave={async (newLayout) => {
                  const activePresetId = bannerSettings?.global?.activePresetId || 'default';
                  const currentPreset = bannerSettings?.global?.presets?.[activePresetId] || DEFAULT_PRESETS.default;
                  
                  const updatedSettings = {
                    ...bannerSettings,
                    global: {
                      ...bannerSettings.global,
                      presets: {
                        ...bannerSettings.global.presets,
                        [activePresetId]: {
                          ...currentPreset,
                          base: newLayout
                        }
                      }
                    }
                  };
                  
                  const result = await saveBannerSettings(updatedSettings);
                  if (result.success) {
                    alert('✓ تم حفظ التصميم بنجاح!');
                  } else {
                    alert('خطأ في الحفظ: ' + result.error);
                  }
                }}
                presets={bannerSettings?.global?.presets || DEFAULT_PRESETS}
                activePresetId={bannerSettings?.global?.activePresetId || 'default'}
                onPresetChange={async (presetId) => {
                  const result = await setActivePreset(presetId);
                  if (!result.success) {
                    alert('خطأ في تغيير القالب: ' + result.error);
                  }
                }}
                challenges={approvedChallenges}
              />
              ) : (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                  <p className="text-white text-lg">جاري تحميل إعدادات البنر...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">إدارة البطولات</h2>
            
            {editingTournament ? (
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white">تعديل البطولة</h3>
                <input
                  type="text"
                  placeholder="اسم البطولة"
                  value={editingTournament.name}
                  onChange={(e) => setEditingTournament({ ...editingTournament, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <input
                  type="text"
                  placeholder="اسم اللعبة"
                  value={editingTournament.game}
                  onChange={(e) => setEditingTournament({ ...editingTournament, game: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <input
                  type="date"
                  value={editingTournament.date}
                  onChange={(e) => setEditingTournament({ ...editingTournament, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  dir="ltr"
                />
                <select
                  value={editingTournament.status}
                  onChange={(e) => setEditingTournament({ ...editingTournament, status: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="open">مفتوحة</option>
                  <option value="upcoming">قادمة</option>
                  <option value="closed">مغلقة</option>
                </select>
                <div className="flex gap-4">
                  <button
                    onClick={handleUpdateTournament}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
                  >
                    حفظ التعديلات
                  </button>
                  <button
                    onClick={() => setEditingTournament(null)}
                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddTournament} className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white">إضافة بطولة جديدة</h3>
                <input
                  type="text"
                  placeholder="اسم البطولة"
                  value={tournamentForm.name}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <input
                  type="text"
                  placeholder="اسم اللعبة"
                  value={tournamentForm.game}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, game: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <input
                  type="date"
                  value={tournamentForm.date}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  dir="ltr"
                />
                <select
                  value={tournamentForm.status}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, status: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="open">مفتوحة</option>
                  <option value="upcoming">قادمة</option>
                  <option value="closed">مغلقة</option>
                </select>
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold transition-all"
                >
                  إضافة البطولة
                </button>
              </form>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">البطولات الحالية ({tournaments.length})</h3>
              {tournaments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">لا توجد بطولات حالياً</p>
              ) : (
                tournaments.map((tournament) => (
                  <div key={tournament.id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-bold text-lg">{tournament.name}</p>
                        <p className="text-gray-400">{tournament.game}</p>
                        <p className="text-gray-500 text-sm">{tournament.date}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        tournament.status === 'open' ? 'bg-green-600 text-white' :
                        tournament.status === 'upcoming' ? 'bg-blue-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {tournament.status === 'open' ? 'مفتوحة' : tournament.status === 'upcoming' ? 'قادمة' : 'مغلقة'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setEditingTournament(tournament)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteTournament(tournament.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        حذف
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">إدارة المتصدرين</h2>
            
            {editingPlayer ? (
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white">تعديل اللاعب</h3>
                <input
                  type="text"
                  placeholder="اسم اللاعب"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  placeholder="النقاط"
                  value={editingPlayer.points}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, points: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleUpdatePlayer}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
                  >
                    حفظ التعديلات
                  </button>
                  <button
                    onClick={() => setEditingPlayer(null)}
                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddPlayer} className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white">إضافة لاعب جديد</h3>
                <input
                  type="text"
                  placeholder="اسم اللاعب"
                  value={leaderboardForm.name}
                  onChange={(e) => setLeaderboardForm({ ...leaderboardForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  placeholder="النقاط"
                  value={leaderboardForm.points}
                  onChange={(e) => setLeaderboardForm({ ...leaderboardForm, points: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all"
                >
                  إضافة اللاعب
                </button>
              </form>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">المتصدرون الحاليون ({leaderboard.length})</h3>
              {leaderboard.length === 0 ? (
                <p className="text-gray-400 text-center py-8">لا يوجد متصدرون حالياً</p>
              ) : (
                leaderboard.map((player, index) => (
                  <div key={player.id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-500' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-bold text-lg">{player.name}</p>
                          <p className="text-gray-400">{player.points} نقطة</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setEditingPlayer(player)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        حذف
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">إدارة القواعد</h2>
            
            {editingRule ? (
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white">تعديل القاعدة</h3>
                <textarea
                  placeholder="النص بالعربية"
                  value={editingRule.textAr}
                  onChange={(e) => setEditingRule({ ...editingRule, textAr: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  placeholder="النص بالإنجليزية"
                  value={editingRule.textEn}
                  onChange={(e) => setEditingRule({ ...editingRule, textEn: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  placeholder="الترتيب"
                  value={editingRule.order}
                  onChange={(e) => setEditingRule({ ...editingRule, order: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleUpdateRule}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
                  >
                    حفظ التعديلات
                  </button>
                  <button
                    onClick={() => setEditingRule(null)}
                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddRule} className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white">إضافة قاعدة جديدة</h3>
                <textarea
                  placeholder="النص بالعربية"
                  value={ruleForm.textAr}
                  onChange={(e) => setRuleForm({ ...ruleForm, textAr: e.target.value })}
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  placeholder="النص بالإنجليزية"
                  value={ruleForm.textEn}
                  onChange={(e) => setRuleForm({ ...ruleForm, textEn: e.target.value })}
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  placeholder="الترتيب (اختياري)"
                  value={ruleForm.order}
                  onChange={(e) => setRuleForm({ ...ruleForm, order: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
                >
                  إضافة القاعدة
                </button>
              </form>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">القواعد الحالية ({rules.length})</h3>
              {rules.length === 0 ? (
                <p className="text-gray-400 text-center py-8">لا توجد قواعد حالياً</p>
              ) : (
                rules.map((rule, index) => (
                  <div key={rule.id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white mb-2"><strong>عربي:</strong> {rule.textAr}</p>
                        <p className="text-gray-300"><strong>English:</strong> {rule.textEn}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingRule(rule)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        حذف
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">إدارة التحديثات</h2>
            
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-6 rounded-xl border border-purple-500/30 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="text-purple-400" size={28} />
                <h3 className="text-xl font-bold text-white">🤖 توليد التحديثات بالذكاء الاصطناعي</h3>
              </div>
              
              <p className="text-gray-300 text-sm">
                يقوم النظام بتحليل آخر التغييرات في المشروع (Git Commits) وتوليد سجل تحديثات احترافي تلقائياً
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">رقم الإصدار</label>
                  <input
                    type="text"
                    value={aiGeneratorState.version}
                    onChange={(e) => setAiGeneratorState(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="2025.11.06.5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">الفرع (Branch)</label>
                  <input
                    type="text"
                    value={aiGeneratorState.branch}
                    onChange={(e) => setAiGeneratorState(prev => ({ ...prev, branch: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="challenge-arena-implementation"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">مسار المشروع</label>
                  <input
                    type="text"
                    value={aiGeneratorState.path}
                    onChange={(e) => setAiGeneratorState(prev => ({ ...prev, path: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="challenge-arena"
                  />
                </div>
              </div>
              
              <button
                onClick={handleGenerateAIChangelog}
                disabled={aiGeneratorState.isGenerating}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {aiGeneratorState.isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    توليد التحديثات تلقائياً
                  </>
                )}
              </button>
              
              {aiGeneratorState.error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-200 text-sm">{aiGeneratorState.error}</p>
                </div>
              )}
              
              {aiGeneratorState.preview && (
                <div className="bg-white/10 border border-white/20 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white">معاينة التحديثات المولدة</h4>
                    <span className="text-sm text-gray-400">
                      {aiGeneratorState.preview.commitCount} تغيير
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">العربية:</label>
                      <div className="bg-slate-800 p-3 rounded-lg text-white text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {aiGeneratorState.preview.textAr}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">English:</label>
                      <div className="bg-slate-800 p-3 rounded-lg text-white text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {aiGeneratorState.preview.textEn}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApplyAIChangelog('replace')}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
                    >
                      استبدال النص الحالي
                    </button>
                    <button
                      onClick={() => handleApplyAIChangelog('prepend')}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
                    >
                      إضافة أعلى النص
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {editingUpdate ? (
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white">تعديل التحديث</h3>
                <input
                  type="datetime-local"
                  value={editingUpdate.date}
                  onChange={(e) => setEditingUpdate({ ...editingUpdate, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  dir="ltr"
                />
                <textarea
                  placeholder="النص بالعربية"
                  value={editingUpdate.textAr}
                  onChange={(e) => setEditingUpdate({ ...editingUpdate, textAr: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <textarea
                  placeholder="النص بالإنجليزية"
                  value={editingUpdate.textEn}
                  onChange={(e) => setEditingUpdate({ ...editingUpdate, textEn: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleUpdateUpdate}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
                  >
                    حفظ التعديلات
                  </button>
                  <button
                    onClick={() => setEditingUpdate(null)}
                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddUpdate} className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white">إضافة تحديث جديد</h3>
                <input
                  type="datetime-local"
                  value={updateForm.date}
                  onChange={(e) => setUpdateForm({ ...updateForm, date: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  dir="ltr"
                />
                <textarea
                  placeholder="النص بالعربية"
                  value={updateForm.textAr}
                  onChange={(e) => setUpdateForm({ ...updateForm, textAr: e.target.value })}
                  required
                  rows="4"
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <textarea
                  placeholder="النص بالإنجليزية"
                  value={updateForm.textEn}
                  onChange={(e) => setUpdateForm({ ...updateForm, textEn: e.target.value })}
                  required
                  rows="4"
                  className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-all"
                >
                  إضافة التحديث
                </button>
              </form>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">التحديثات الحالية ({updates.length})</h3>
              {updates.length === 0 ? (
                <p className="text-gray-400 text-center py-8">لا توجد تحديثات حالياً</p>
              ) : (
                updates.map((update) => (
                  <div key={update.id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">{update.date}</p>
                      <p className="text-white mb-2"><strong>عربي:</strong> {update.textAr}</p>
                      <p className="text-gray-300"><strong>English:</strong> {update.textEn}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingUpdate(update)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(update.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        حذف
                      </button>
                    </div>
                  </div>
                ))
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

            {/* Maintenance Page Customization Section */}
            <div className="space-y-4 bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-xl border-2 border-purple-500/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4">تخصيص صفحة الصيانة</h3>
              
              {/* Identity Settings */}
              <div className="space-y-3">
                <label className="block text-white font-bold text-sm">اسم الموقع:</label>
                <input
                  type="text"
                  value={maintenanceSettings.agencyName}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, agencyName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="أرض التحديات"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-white font-bold text-sm">رمز الشعار (Emoji):</label>
                <input
                  type="text"
                  value={maintenanceSettings.logoEmoji}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, logoEmoji: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="⭐"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-white font-bold text-sm">الرسالة التوضيحية:</label>
                <input
                  type="text"
                  value={maintenanceSettings.tagline}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, tagline: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="نُعيد ضبط التجربة — تحديثات جودة وأداء"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-white font-bold text-sm">وقت العودة المتوقع (اختياري):</label>
                <input
                  type="datetime-local"
                  value={maintenanceSettings.until}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, until: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400">سيظهر عداد تنازلي إذا تم تحديد وقت العودة</p>
              </div>

              {/* Theme Colors */}
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-lg font-bold text-white mb-3">ألوان التصميم:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="block text-white text-xs">Glow 1:</label>
                    <input
                      type="color"
                      value={maintenanceSettings.theme.glow1}
                      onChange={(e) => setMaintenanceSettings({ 
                        ...maintenanceSettings, 
                        theme: { ...maintenanceSettings.theme, glow1: e.target.value }
                      })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white text-xs">Glow 2:</label>
                    <input
                      type="color"
                      value={maintenanceSettings.theme.glow2}
                      onChange={(e) => setMaintenanceSettings({ 
                        ...maintenanceSettings, 
                        theme: { ...maintenanceSettings.theme, glow2: e.target.value }
                      })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white text-xs">Glow 3:</label>
                    <input
                      type="color"
                      value={maintenanceSettings.theme.glow3}
                      onChange={(e) => setMaintenanceSettings({ 
                        ...maintenanceSettings, 
                        theme: { ...maintenanceSettings.theme, glow3: e.target.value }
                      })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white text-xs">Text Color:</label>
                    <input
                      type="color"
                      value={maintenanceSettings.theme.ink}
                      onChange={(e) => setMaintenanceSettings({ 
                        ...maintenanceSettings, 
                        theme: { ...maintenanceSettings.theme, ink: e.target.value }
                      })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white text-xs">Muted Text:</label>
                    <input
                      type="color"
                      value={maintenanceSettings.theme.muted}
                      onChange={(e) => setMaintenanceSettings({ 
                        ...maintenanceSettings, 
                        theme: { ...maintenanceSettings.theme, muted: e.target.value }
                      })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white text-xs">Background 1:</label>
                    <input
                      type="color"
                      value={maintenanceSettings.theme.bg}
                      onChange={(e) => setMaintenanceSettings({ 
                        ...maintenanceSettings, 
                        theme: { ...maintenanceSettings.theme, bg: e.target.value }
                      })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white text-xs">Background 2:</label>
                    <input
                      type="color"
                      value={maintenanceSettings.theme.bg2}
                      onChange={(e) => setMaintenanceSettings({ 
                        ...maintenanceSettings, 
                        theme: { ...maintenanceSettings.theme, bg2: e.target.value }
                      })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleMaintenanceSettings}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all shadow-lg"
              >
                حفظ إعدادات صفحة الصيانة
              </button>
            </div>

            {/* Cache Management Section */}
            <div className="space-y-4 bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-xl border-2 border-cyan-500/30 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                  <Database size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">إدارة الذاكرة المؤقتة</h3>
                  <p className="text-sm text-gray-300">تحديث وتنظيف الموقع بشكل احترافي</p>
                </div>
              </div>

              <div className="bg-slate-600/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">الإصدار الحالي:</span>
                  <span className="px-3 py-1 bg-cyan-500 text-white font-bold rounded-lg text-sm">
                    {versionManager.getCurrentVersion()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">حالة الكاش:</span>
                  <span className="text-gray-300 text-sm">
                    {versionManager.needsUpdate() ? 'يحتاج تحديث' : 'محدث'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={handleClearCache}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl transition-all shadow-lg transform hover:scale-105"
                >
                  <RefreshCw size={20} />
                  حذف الكاش الكامل
                </button>
                <button
                  onClick={handleForceRefresh}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg transform hover:scale-105"
                >
                  <Sparkles size={20} />
                  تحديث سريع
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                <p className="text-sm text-blue-200 leading-relaxed">
                  <strong className="text-blue-100">💡 نصيحة:</strong> استخدم "حذف الكاش الكامل" عند نشر تحديثات جديدة لضمان رؤية المستخدمين للتغييرات. "التحديث السريع" يحدث الصفحة فقط.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default AdminPanel;
