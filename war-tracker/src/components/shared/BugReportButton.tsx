import { useState } from 'react';
import { Bug, Send, X, CheckCircle, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { BACKEND_API_URL } from '../../config/api';

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const location = useLocation();

  const handleSubmit = async () => {
    if (!description.trim() || description.trim().length < 5) {
      setErrorMsg('يرجى كتابة وصف المشكلة (5 أحرف على الأقل)');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(`${BACKEND_API_URL}/api/bug-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          page: location.pathname,
          browser: navigator.userAgent,
        }),
      });

      if (res.ok) {
        setStatus('success');
        setDescription('');
        setTimeout(() => {
          setIsOpen(false);
          setStatus('idle');
        }, 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.detail || 'حدث خطأ أثناء إرسال البلاغ');
        setStatus('error');
      }
    } catch {
      setErrorMsg('تعذر الاتصال بالخادم');
      setStatus('error');
    }
  };

  return (
    <>
      {/* Floating bug report button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[9998] flex items-center gap-2 px-3 py-2.5 rounded-full shadow-lg shadow-black/30 border transition-all duration-300 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          borderColor: 'rgba(239, 68, 68, 0.5)',
        }}
        title="الإبلاغ عن مشكلة تقنية"
      >
        <Bug className="w-4 h-4 text-white" />
        <span className="text-[11px] font-bold text-white hidden sm:inline">إبلاغ عن مشكلة</span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (status !== 'sending') {
                setIsOpen(false);
                setStatus('idle');
                setErrorMsg('');
              }
            }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[#12121a] border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50 bg-gradient-to-l from-red-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Bug className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">الإبلاغ عن مشكلة تقنية</h3>
                  <p className="text-[10px] text-gray-400">سيتم إرسال البلاغ للفريق التقني مباشرة</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (status !== 'sending') {
                    setIsOpen(false);
                    setStatus('idle');
                    setErrorMsg('');
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {status === 'success' ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-green-400" />
                  </div>
                  <p className="text-sm font-bold text-green-400">تم إرسال البلاغ بنجاح!</p>
                  <p className="text-xs text-gray-400 text-center">الفريق التقني سيراجع المشكلة ويعمل على حلها</p>
                </div>
              ) : (
                <>
                  {/* Current page indicator */}
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-white/5 border border-gray-700/30">
                    <span className="text-[10px] text-gray-500">الصفحة الحالية:</span>
                    <span className="text-[11px] text-blue-400 font-mono" dir="ltr">{location.pathname}</span>
                  </div>

                  {/* Description textarea */}
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="اكتب وصف المشكلة بالتفصيل... مثال: الخريطة مو ظاهرة بالشكل الصحيح على فايرفوكس"
                    className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-gray-700/50 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 resize-none transition-colors"
                    dir="rtl"
                    disabled={status === 'sending'}
                  />

                  {/* Error message */}
                  {errorMsg && (
                    <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={status === 'sending' || !description.trim()}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: status === 'sending'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    }}
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        إرسال البلاغ للفريق التقني
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-[10px] text-gray-500 text-center">
                    البلاغ سيُرسل مباشرة للفريق التقني وسيتم مراجعته وحله بأسرع وقت
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
