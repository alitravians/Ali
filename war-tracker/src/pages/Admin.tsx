import { useState } from 'react';
import { sources, mapLayers } from '../data/mockData';
import { useLiveData } from '../context/LiveDataContext';
import { timeAgo, sourceTypeAr } from '../utils/helpers';
import TrustBadge from '../components/shared/TrustBadge';
import {
  Shield, Database, Layers, FileSearch, Bell,
  Brain, Wifi, AlertTriangle, Settings, Server, BarChart3,
  Eye, EyeOff, Plus, Trash2, Edit3, RefreshCw, Search, CheckCircle2, XCircle,
  Lock, LogOut
} from 'lucide-react';

const ADMIN_PASSWORD = 'warscope2024';

type AdminTab = 'sources' | 'layers' | 'events' | 'alerts' | 'ai' | 'system';

export default function Admin() {
  const { events, alerts } = useLiveData();
  const [activeTab, setActiveTab] = useState<AdminTab>('sources');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('warscope_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('warscope_admin_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('warscope_admin_auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-gray-800 bg-[#12121a] p-8 shadow-2xl">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-lg font-bold text-white">لوحة الإدارة</h1>
              <p className="text-xs text-gray-500 mt-1">أدخل كلمة المرور للوصول</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(false); }}
                  placeholder="كلمة المرور"
                  className={`w-full bg-[#0a0a0f] border ${loginError ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-center`}
                  autoFocus
                  dir="ltr"
                />
                {loginError && (
                  <p className="text-xs text-red-400 text-center mt-2">كلمة المرور غير صحيحة</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-bold hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                دخول
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: typeof Shield }[] = [
    { id: 'sources', label: 'إدارة المصادر', icon: Database },
    { id: 'layers', label: 'طبقات الخريطة', icon: Layers },
    { id: 'events', label: 'مراجعة الأحداث', icon: FileSearch },
    { id: 'alerts', label: 'التنبيهات', icon: Bell },
    { id: 'ai', label: 'التحليلات الذكية', icon: Brain },
    { id: 'system', label: 'النظام', icon: Server },
  ];

  const pendingReviewEvents = events.filter(e => e.trustLevel === 'low' || e.trustLevel === 'medium');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          لوحة الإدارة
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-semibold text-green-400">النظام يعمل</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            خروج
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">المصادر النشطة</span>
          </div>
          <span className="text-xl font-black text-white">{sources.filter(s => s.isActive).length}/{sources.length}</span>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileSearch className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">بانتظار المراجعة</span>
          </div>
          <span className="text-xl font-black text-yellow-400">{pendingReviewEvents.length}</span>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">تنبيهات غير مقروءة</span>
          </div>
          <span className="text-xl font-black text-red-400">{alerts.filter(a => !a.isRead).length}</span>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">إجمالي الأحداث</span>
          </div>
          <span className="text-xl font-black text-green-400">{events.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-[#12121a] rounded-xl border border-gray-800 p-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-gray-800 bg-[#12121a]">
        {/* Sources Management */}
        {activeTab === 'sources' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">إدارة المصادر</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-[#0a0a0f] border border-gray-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none w-40"
                  />
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  إضافة مصدر
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">المصدر</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">النوع</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">الثقة</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">الحالة</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">آخر تحديث</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">الأخبار</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {sources
                    .filter(s => !searchQuery || s.nameAr.includes(searchQuery) || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(source => (
                    <tr key={source.id} className="border-b border-gray-800/50 hover:bg-white/2">
                      <td className="py-2.5 px-3">
                        <div>
                          <div className="font-semibold text-white">{source.nameAr}</div>
                          <div className="text-[10px] text-gray-500">{source.name}</div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-gray-800 rounded-full text-gray-300">{sourceTypeAr(source.type)}</span>
                      </td>
                      <td className="py-2.5 px-3"><TrustBadge level={source.trustLevel} /></td>
                      <td className="py-2.5 px-3">
                        <span className={`flex items-center gap-1 ${source.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {source.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {source.isActive ? 'نشط' : 'متوقف'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400">{timeAgo(source.lastUpdate)}</td>
                      <td className="py-2.5 px-3 text-white font-semibold">{source.eventCount}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1 text-gray-500 hover:text-blue-400 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 text-gray-500 hover:text-green-400 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Map Layers */}
        {activeTab === 'layers' && (
          <div className="p-5">
            <h2 className="text-sm font-bold text-white mb-4">إدارة طبقات الخريطة</h2>
            <div className="space-y-2">
              {mapLayers.map(layer => (
                <div key={layer.id} className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: layer.color }} />
                    <span className="text-sm font-medium text-white">{layer.nameAr}</span>
                    <span className="text-[11px] text-gray-500">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500">
                      {events.filter(e => e.category === layer.id).length} أحداث
                    </span>
                    <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      layer.isActive
                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                        : 'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}>
                      {layer.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {layer.isActive ? 'مفعّل' : 'معطّل'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Review */}
        {activeTab === 'events' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">مراجعة الأحداث</h2>
              <span className="text-[11px] text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                {pendingReviewEvents.length} بانتظار المراجعة
              </span>
            </div>
            <div className="space-y-3">
              {pendingReviewEvents.map(event => (
                <div key={event.id} className="flex items-start gap-4 p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TrustBadge level={event.trustLevel} reason={event.trustReasonAr} />
                      <span className="text-[10px] text-gray-500">{timeAgo(event.timestamp)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{event.titleAr}</h3>
                    <p className="text-xs text-gray-400 mb-2">{event.descriptionAr}</p>
                    <div className="text-[10px] text-gray-500">
                      المصادر: {event.sources.map(s => s.sourceNameAr).join('، ')}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition-colors flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      تأكيد
                    </button>
                    <button className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      رفض
                    </button>
                    <button className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-xs hover:bg-gray-600 transition-colors flex items-center gap-1">
                      <Edit3 className="w-3 h-3" />
                      تعديل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Management */}
        {activeTab === 'alerts' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">إدارة التنبيهات والإشعارات</h2>
              <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                تنبيه جديد
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
                  <h3 className="text-xs font-bold text-white mb-3">إعدادات التنبيهات</h3>
                  <div className="space-y-2">
                    {['تنبيهات الأحداث العاجلة', 'تنبيهات التصعيد', 'تنبيهات التغييرات الكبيرة', 'تنبيهات المصادر الجديدة', 'تنبيهات أخطاء النظام'].map((label, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <span className="text-[11px] text-gray-300">{label}</span>
                        <div className="w-9 h-5 bg-green-500 rounded-full relative cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
                  <h3 className="text-xs font-bold text-white mb-3">الكلمات المفتاحية للمراقبة</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['صاروخ', 'قبة حديدية', 'مضيق هرمز', 'نووي', 'حرس ثوري', 'حزب الله', 'تصعيد'].map((kw, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-lg text-[11px] text-gray-300">
                        {kw}
                        <button className="text-gray-500 hover:text-red-400">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="كلمة مفتاحية جديدة..."
                      className="flex-1 bg-[#12121a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Management */}
        {activeTab === 'ai' && (
          <div className="p-5">
            <h2 className="text-sm font-bold text-white mb-4">إدارة التحليلات الذكية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-400" />
                  حالة محرك AI
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">الحالة:</span>
                    <span className="flex items-center gap-1 text-[11px] text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      نشط
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">المحرك:</span>
                    <span className="text-[11px] text-white">Google Gemini</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">آخر تحليل:</span>
                    <span className="text-[11px] text-gray-300">منذ 5 دقائق</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">التحليلات اليوم:</span>
                    <span className="text-[11px] text-white font-bold">47</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-gray-400" />
                  إعدادات AI
                </h3>
                <div className="space-y-2">
                  {[
                    'الملخصات التلقائية',
                    'كشف التضارب',
                    'تقييم الأهمية',
                    'رصد التصعيد',
                    'دمج الأحداث المتشابهة',
                  ].map((label, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <span className="text-[11px] text-gray-300">{label}</span>
                      <div className="w-9 h-5 bg-green-500 rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System */}
        {activeTab === 'system' && (
          <div className="p-5">
            <h2 className="text-sm font-bold text-white mb-4">مراقبة النظام</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-white">الخادم</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">الحالة:</span>
                    <span className="text-green-400">يعمل</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">وقت التشغيل:</span>
                    <span className="text-white">99.9%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">الاستجابة:</span>
                    <span className="text-white">45ms</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">قاعدة البيانات</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">الحالة:</span>
                    <span className="text-green-400">متصلة</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">النوع:</span>
                    <span className="text-white">Firestore</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">السجلات:</span>
                    <span className="text-white">1,247</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">WebSocket</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">الحالة:</span>
                    <span className="text-green-400">متصل</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">المتصلون:</span>
                    <span className="text-white">12</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">الرسائل/ثانية:</span>
                    <span className="text-white">3.2</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Log */}
            <div className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                سجل الأخطاء الأخيرة
              </h3>
              <div className="space-y-2">
                {[
                  { time: 'منذ 15 دقيقة', msg: 'تأخر في الاستجابة من مصدر IRNA (> 5 ثوانٍ)', level: 'warning' },
                  { time: 'منذ 45 دقيقة', msg: 'فشل في تحليل AI لحدث #e234 - تمت إعادة المحاولة بنجاح', level: 'info' },
                  { time: 'منذ ساعتين', msg: 'تعذر الوصول لمصدر OSINT مؤقتاً - تم إعادة الاتصال', level: 'warning' },
                ].map((log, i) => (
                  <div key={i} className={`flex items-start gap-3 p-2 rounded-lg ${
                    log.level === 'warning' ? 'bg-yellow-500/5' : 'bg-blue-500/5'
                  }`}>
                    <span className={`text-[10px] mt-0.5 ${
                      log.level === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {log.level === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-300">{log.msg}</p>
                      <span className="text-[10px] text-gray-500">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
