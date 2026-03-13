import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Toggle from '../components/Toggle';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquareReply, Zap, CheckCircle2, TrendingUp,
  Plus, Clock, ArrowLeft, Moon, Coffee, Plane, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const awayPresets = [
  { id: 'busy', icon: Coffee, label: 'مشغول', message: 'أنا مشغول حالياً، أرد عليك أول ما أفضى' },
  { id: 'sleeping', icon: Moon, label: 'نايم', message: 'أنا نايم الحين، أرد عليك لما أصحى إن شاء الله' },
  { id: 'traveling', icon: Plane, label: 'مسافر', message: 'أنا مسافر حالياً، أرد عليك لما أوصل' },
  { id: 'studying', icon: BookOpen, label: 'أدرس', message: 'أنا في المحاضرة/أدرس، أكلمك بعدين' },
];

export default function Dashboard() {
  const { rules, logs, settings, updateSettings } = useApp();
  const navigate = useNavigate();
  const [showAwayPresets, setShowAwayPresets] = useState(false);

  const activeRules = rules.filter(r => r.isEnabled).length;
  const totalReplies = logs.length;
  const successCount = logs.filter(l => l.status === 'success').length;
  const successRate = totalReplies > 0 ? Math.round((successCount / totalReplies) * 100) : 0;

  const today = new Date().toDateString();
  const todayReplies = logs.filter(l => new Date(l.timestamp).toDateString() === today).length;

  const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const weeklyData = weekDays.map((day, i) => {
    const targetDate = new Date();
    const currentDay = targetDate.getDay();
    const diff = i - currentDay;
    targetDate.setDate(targetDate.getDate() + diff);
    const dateStr = targetDate.toDateString();
    const count = logs.filter(l => new Date(l.timestamp).toDateString() === dateStr).length;
    return { day, count };
  });

  const recentLogs = logs.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Header
        title="الردود التلقائية"
        rightAction={
          <button
            onClick={() => navigate('/replies/new')}
            className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus size={22} />
          </button>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Main Toggle Card */}
        <div className={`rounded-2xl p-4 border transition-all animate-slideUp ${
          settings.isServiceEnabled
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-gray-900 border-gray-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                settings.isServiceEnabled ? 'bg-emerald-500/20' : 'bg-gray-800'
              }`}>
                <Zap size={20} className={settings.isServiceEnabled ? 'text-emerald-400' : 'text-gray-500'} />
              </div>
              <div>
                <p className="font-bold text-white text-sm">الخدمة التلقائية</p>
                <p className={`text-xs ${settings.isServiceEnabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {settings.isServiceEnabled ? 'نشطة ● تعمل الآن' : 'متوقفة'}
                </p>
              </div>
            </div>
            <Toggle
              enabled={settings.isServiceEnabled}
              onChange={(val) => updateSettings({ ...settings, isServiceEnabled: val })}
              size="lg"
            />
          </div>
        </div>

        {/* Away Mode Quick Presets */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden animate-slideUp" style={{ animationDelay: '0.05s' }}>
          <button
            onClick={() => setShowAwayPresets(!showAwayPresets)}
            className="w-full flex items-center justify-between p-4"
          >
            <ArrowLeft size={14} className={`text-gray-500 transition-transform ${showAwayPresets ? 'rotate-90' : ''}`} />
            <div className="flex items-center gap-2">
              <Coffee size={16} className="text-amber-400" />
              <span className="text-sm font-bold text-white">وضع عدم التواجد</span>
            </div>
          </button>
          {showAwayPresets && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {awayPresets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      navigate('/replies/new', { state: { presetMessage: preset.message, presetKeywords: [preset.label] } });
                    }}
                    className="flex items-center gap-2 p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-all text-right"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">{preset.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{preset.message}</p>
                    </div>
                    <Icon size={18} className="text-gray-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<MessageSquareReply size={18} />}
            label="إجمالي الردود"
            value={totalReplies}
            color="blue"
            delay="0.1s"
          />
          <StatCard
            icon={<Zap size={18} />}
            label="القواعد النشطة"
            value={`${activeRules}/${rules.length}`}
            color="emerald"
            delay="0.15s"
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="نسبة النجاح"
            value={`${successRate}%`}
            color="purple"
            delay="0.2s"
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="ردود اليوم"
            value={todayReplies}
            color="amber"
            delay="0.25s"
          />
        </div>

        {/* Weekly Chart */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-sm font-bold text-white mb-3">نشاط الأسبوع</h3>
          <div className="h-40" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [value, 'ردود']}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden animate-slideUp" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center justify-between p-4 pb-2">
            <button
              onClick={() => navigate('/logs')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft size={12} />
            </button>
            <h3 className="text-sm font-bold text-white">آخر النشاطات</h3>
          </div>
          {recentLogs.length === 0 ? (
            <div className="px-4 pb-4">
              <p className="text-gray-500 text-sm text-center py-4">لا يوجد نشاط بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {recentLogs.map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1 text-gray-500 shrink-0">
                      <Clock size={10} />
                      <span className="text-[10px]">
                        {formatTimeAgo(log.timestamp)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          log.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                        }`} />
                        <span className="text-xs text-gray-400 truncate" dir="ltr">{log.senderNumber}</span>
                      </div>
                      <p className="text-sm text-white mt-1 truncate text-right">&larr; {log.incomingMessage}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate text-right">&rarr; {log.sentReply}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add */}
        <button
          onClick={() => navigate('/replies/new')}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 animate-slideUp"
          style={{ animationDelay: '0.4s' }}
        >
          <Plus size={20} />
          إضافة رد تلقائي جديد
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  delay: string;
}) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', text: 'text-blue-400' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', text: 'text-emerald-400' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', text: 'text-purple-400' },
    amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', text: 'text-amber-400' },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 animate-slideUp" style={{ animationDelay: delay }}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.bg}`}>
          <span className={c.icon}>{icon}</span>
        </div>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} س`;
  const days = Math.floor(hours / 24);
  return `${days} ي`;
}
