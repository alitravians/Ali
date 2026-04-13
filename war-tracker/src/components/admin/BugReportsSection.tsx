import { useState, useEffect } from 'react';
import {
  MessageSquare, Clock, Loader2, RefreshCw, ExternalLink,
} from 'lucide-react';
import { BACKEND_API_URL } from '../../config/api';
import { SectionHeader } from './AdminUI';

interface BugReport {
  id: number;
  ticket_id: string;
  description: string;
  page: string;
  browser: string;
  timestamp: string;
  ip: string;
}

export default function BugReportsSection() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('warscope_admin_token') || '';

  const fetchReports = async () => {
    try {
      const resp = await fetch(`${BACKEND_API_URL}/api/bug-reports`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.warn('[BugReports] Failed to fetch:', err instanceof Error ? err.message : err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>;

  return (
    <div>
      <SectionHeader
        title="بلاغات المستخدمين"
        description="البلاغات الواردة من المستخدمين عبر نظام الإبلاغ عن المشاكل"
        action={
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
              {reports.length} بلاغ
            </span>
            <button onClick={fetchReports} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {reports.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-[#12121a] p-12 text-center">
          <MessageSquare className="w-10 h-10 text-blue-400/30 mx-auto mb-3" />
          <p className="text-sm text-gray-400">لا توجد بلاغات حالياً</p>
          <p className="text-[10px] text-gray-600 mt-1">ستظهر هنا البلاغات المرسلة من المستخدمين</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="rounded-xl border border-gray-800 bg-[#12121a] p-4 hover:border-gray-700 transition-colors">
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-mono">
                      {report.ticket_id}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(report.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-white mb-2 leading-relaxed">{report.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {report.page || 'غير محدد'}
                    </span>
                    {report.browser && (
                      <span className="truncate max-w-[200px]">{report.browser.split(' ').slice(0, 3).join(' ')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
