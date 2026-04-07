import type { AISummary as AISummaryType } from '../../types';
import { timeAgo } from '../../utils/helpers';
import { Bot, AlertTriangle, MapPin, ShieldCheck, GitCompareArrows, Clock, Sparkles } from 'lucide-react';

interface AISummaryProps {
  summary: AISummaryType;
}

export default function AISummary({ summary }: AISummaryProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">تحليل الذكاء الاصطناعي</h3>
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              آخر تحديث: {timeAgo(summary.timestamp)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-semibold text-purple-400">Devin AI</span>
        </div>
      </div>

      {/* What happened */}
      <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-blue-400" />
          </span>
          ماذا حدث؟
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">{summary.whatHappenedAr}</p>
      </div>

      {/* What's new */}
      <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center">
            <Clock className="w-3 h-3 text-green-400" />
          </span>
          ما الجديد؟
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{summary.whatsNewAr}</p>
      </div>

      {/* Escalation */}
      {summary.isEscalation && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <h4 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            تنبيه تصعيد
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed">{summary.escalationDetailsAr}</p>
        </div>
      )}

      {/* Hotspots */}
      <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-orange-400" />
          المناطق الأكثر نشاطاً
        </h4>
        <div className="flex flex-wrap gap-2">
          {summary.hotspotsAr.map((spot, i) => (
            <span key={i} className="text-[11px] px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-lg">
              {spot}
            </span>
          ))}
        </div>
      </div>

      {/* Confirmed only */}
      <div className="rounded-xl border border-gray-800 bg-[#12121a] p-4">
        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          الأحداث المؤكدة فقط
        </h4>
        <div className="space-y-1.5">
          {summary.confirmedOnlyAr.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Conflicts */}
      {summary.conflictsDetected && summary.conflictsDetected.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <h4 className="text-xs font-bold text-yellow-400 mb-3 flex items-center gap-1.5">
            <GitCompareArrows className="w-4 h-4" />
            تضارب مكتشف بين المصادر ({summary.conflictsDetected.length})
          </h4>
          <div className="space-y-3">
            {summary.conflictsDetected.map(conflict => (
              <div key={conflict.id} className="bg-[#12121a] rounded-lg p-3 border border-gray-800">
                <p className="text-[11px] text-gray-300 mb-2">{conflict.descriptionAr}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1">
                  <span>المصادر:</span>
                  {conflict.sourcesAr.map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">{s}</span>
                  ))}
                </div>
                {conflict.resolutionAr && (
                  <p className="text-[10px] text-blue-400 mt-1">
                    التحقق: {conflict.resolutionAr}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
