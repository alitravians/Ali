import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { Bot, AlertTriangle, MapPin, ShieldCheck, Clock, Sparkles, RefreshCw, Brain } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';
import type { AISummary } from '../../types';

import { BACKEND_API_URL } from '../../config/api';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AISummaryModal({ isOpen, onClose }: AISummaryModalProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!isOpen || fetched) return;
    async function fetchAnalysis() {
      try {
        const resp = await fetch(`${BACKEND_API_URL}/api/analysis`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.summaries && data.summaries.length > 0) {
            const s = data.summaries[0];
            setSummary({ ...s, timestamp: new Date(s.timestamp) });
          }
        }
      } catch {
        // Analysis fetch failed silently
      }
      setFetched(true);
    }
    fetchAnalysis();
  }, [isOpen, fetched]);

  const triggerAnalysis = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('warscope_admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch(`${BACKEND_API_URL}/api/analysis/trigger`, { method: 'POST', headers });
      if (resp.ok) {
        const data = await resp.json();
        if (data && !data.error) {
          setSummary({ ...data, timestamp: new Date(data.timestamp) });
        }
      }
    } catch {
      // Analysis trigger failed silently
    }
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تحليل الذكاء الاصطناعي"
      titleIcon={
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      }
      size="lg"
    >
      <div className="space-y-4">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-semibold text-purple-400">إدارة النظام</span>
          </div>
          <button
            onClick={triggerAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 border border-purple-500/30 rounded-lg text-[11px] text-purple-400 hover:bg-purple-500/25 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'جاري التحليل...' : 'تحليل جديد'}
          </button>
        </div>

        {summary ? (
          <>
            {/* Timestamp */}
            <div className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              آخر تحديث: {timeAgo(summary.timestamp)}
            </div>

            {/* What happened */}
            {summary.whatHappenedAr && (
              <div className="rounded-xl border border-gray-800 bg-[#0a0a0f] p-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                  ماذا حدث؟
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">{summary.whatHappenedAr}</p>
              </div>
            )}

            {/* What's new */}
            {summary.whatsNewAr && (
              <div className="rounded-xl border border-gray-800 bg-[#0a0a0f] p-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-green-400" />
                  </span>
                  ما الجديد؟
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{summary.whatsNewAr}</p>
              </div>
            )}

            {/* Escalation */}
            {summary.isEscalation && summary.escalationDetailsAr && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  تنبيه تصعيد
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">{summary.escalationDetailsAr}</p>
              </div>
            )}

            {/* Hotspots */}
            {summary.hotspotsAr && summary.hotspotsAr.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-[#0a0a0f] p-4">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  المناطق الأكثر نشاطاً
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summary.hotspotsAr.map((spot, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-lg">
                      {spot}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed only */}
            {summary.confirmedOnlyAr && summary.confirmedOnlyAr.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-[#0a0a0f] p-4">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  الأحداث المؤكدة فقط
                </h4>
                <div className="space-y-2">
                  {summary.confirmedOnlyAr.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا يوجد تحليل ذكاء اصطناعي حالياً</p>
            <p className="text-xs mt-1 text-gray-600">اضغط "تحليل جديد" لإنشاء تحليل من الأحداث الحالية</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
