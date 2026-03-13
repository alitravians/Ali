import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import {
  CheckCircle2, XCircle, Clock, Trash2, Filter,
  MessageSquare, ChevronDown, ChevronUp, BarChart3
} from 'lucide-react';

type FilterType = 'all' | 'success' | 'failed';

export default function LogsPage() {
  const { logs, rules, clearLogs } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const filteredLogs = logs.filter(l => {
    if (filter === 'success') return l.status === 'success';
    if (filter === 'failed') return l.status === 'failed';
    return true;
  });

  const successCount = logs.filter(l => l.status === 'success').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;

  // Rule usage stats
  const ruleStats = rules.map(rule => ({
    name: rule.keywords[0] || 'غير محدد',
    count: rule.usageCount,
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Header
        title="السجل والإحصائيات"
        rightAction={
          logs.length > 0 ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          ) : null
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Stats Toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full bg-gray-900 rounded-2xl border border-gray-800 p-4 text-right"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showStats ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-400" />
              <span className="text-sm font-bold text-white">الإحصائيات</span>
            </div>
          </div>
        </button>

        {showStats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <p className="text-lg font-bold text-white">{logs.length}</p>
                <p className="text-[10px] text-gray-500">إجمالي</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <p className="text-lg font-bold text-emerald-400">{successRate}%</p>
                <p className="text-[10px] text-gray-500">نسبة النجاح</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                <p className="text-lg font-bold text-red-400">{failedCount}</p>
                <p className="text-[10px] text-gray-500">فشل</p>
              </div>
            </div>

            {/* Top Rules */}
            {ruleStats.length > 0 && (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                <h3 className="text-sm font-bold text-white mb-3">أكثر الردود استخداماً</h3>
                <div className="space-y-2">
                  {ruleStats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-300 truncate">{stat.name}</span>
                          <span className="text-xs text-emerald-400">{stat.count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{
                              width: `${ruleStats[0].count > 0 ? (stat.count / ruleStats[0].count) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: 'الكل', count: logs.length },
            { key: 'success' as const, label: 'نجاح', count: successCount },
            { key: 'failed' as const, label: 'فشل', count: failedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                filter === tab.key
                  ? tab.key === 'failed'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : tab.key === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gray-800 text-white border border-gray-700'
                  : 'bg-gray-900 text-gray-500 border border-gray-800'
              }`}
            >
              <Filter size={10} />
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">لا توجد سجلات</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="w-full p-3 text-right"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1 text-gray-500 shrink-0">
                      <Clock size={10} />
                      <span className="text-[10px]">{formatTime(log.timestamp)}</span>
                      {expandedLog === log.id
                        ? <ChevronUp size={12} className="mr-1" />
                        : <ChevronDown size={12} className="mr-1" />
                      }
                    </div>
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-2 justify-end">
                        {log.status === 'success' ? (
                          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={12} className="text-red-400 shrink-0" />
                        )}
                        <span className="text-xs text-gray-400 truncate" dir="ltr">{log.senderNumber}</span>
                      </div>
                      <p className="text-sm text-white mt-1 truncate text-right">
                        ← {log.incomingMessage}
                      </p>
                    </div>
                  </div>
                </button>

                {expandedLog === log.id && (
                  <div className="px-3 pb-3 pt-0 border-t border-gray-800/50 space-y-2">
                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={12} className="text-gray-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 mb-1">الرسالة الواردة</p>
                          <p className="text-xs text-gray-300">{log.incomingMessage}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-emerald-500/5 rounded-lg p-2.5">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-emerald-400 mb-1">الرد المرسل</p>
                          <p className="text-xs text-gray-300">{log.sentReply}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full ${
                        log.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {log.status === 'success' ? 'تم بنجاح' : 'فشل'}
                      </span>
                      <span className="text-gray-500">
                        القاعدة: {log.ruleName}
                      </span>
                    </div>
                    {log.errorMessage && (
                      <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                        <p className="text-[10px] text-red-400">{log.errorMessage}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-sm p-5">
            <h3 className="text-lg font-bold text-white mb-2">مسح السجل</h3>
            <p className="text-sm text-gray-400 mb-5">هل أنت متأكد من مسح جميع السجلات؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { clearLogs(); setShowClearConfirm(false); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                مسح الكل
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `أمس ${time}`;

  return `${date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })} ${time}`;
}
