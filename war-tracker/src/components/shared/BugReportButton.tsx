import { useEffect, useRef, useState } from 'react';
import { Bug, Send, X, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { BACKEND_API_URL } from '../../config/api';
import RepairTracker3D from './RepairTracker3D';

// ── Global in-memory diagnostic buffers ──
//
// These are module-level so the buffers survive across route changes and
// multiple <BugReportButton/> mounts, but the listeners that populate them
// are installed exactly once from within a React effect (see
// ``installTelemetryListeners``). Previously this file installed a
// ``MutationObserver`` on ``document.body`` with
// ``{childList: true, subtree: true}`` at module load — it fires on
// *every* DOM mutation anywhere in the app, which on a real-time dashboard
// with WebSocket updates, map tile churn and event re-renders runs its
// callback hundreds of times per second just to check
// ``window.location.pathname``. That was a measurable performance hit and
// also leaked: the observer had no cleanup path. Navigation is now tracked
// via react-router's ``useLocation`` inside the component, which fires
// exactly once per route change.
const _collectedErrors: string[] = [];
const _userActions: string[] = [];
const MAX_ENTRIES = 30;

// Guard against double-installing listeners under Vite/React HMR, StrictMode
// double-invocation of effects in development, or multiple simultaneous
// <BugReportButton/> mounts. Without the guard a console.error monkey-patch
// chain would nest itself on every reload.
let _telemetryInstalled = false;

function _pushError(line: string): void {
  _collectedErrors.push(line);
  if (_collectedErrors.length > MAX_ENTRIES) _collectedErrors.shift();
}

function _pushAction(line: string): void {
  _userActions.push(line);
  if (_userActions.length > MAX_ENTRIES) _userActions.shift();
}

function installTelemetryListeners(): void {
  if (_telemetryInstalled) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  _telemetryInstalled = true;

  // Capture console errors. We keep a reference to the previous implementation
  // so any external wrapper (analytics, sentry) installed before us still runs.
  const origConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    _pushError(
      `[error] ${args
        .map(a => (typeof a === 'object' ? JSON.stringify(a, null, 0)?.slice(0, 300) : String(a)))
        .join(' ')}`,
    );
    origConsoleError.apply(console, args);
  };

  // Capture uncaught errors
  window.addEventListener('error', e => {
    _pushError(`[uncaught] ${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`);
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', e => {
    _pushError(`[promise] ${String(e.reason).slice(0, 300)}`);
  });

  // Track user clicks. Passive listener on ``document`` — cheap, the click
  // event bubbles up once per user click.
  document.addEventListener(
    'click',
    e => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName?.toLowerCase() || '?';
      const text = (target.textContent || '').trim().slice(0, 40);
      const cls = target.className?.toString().slice(0, 60) || '';
      _pushAction(
        `[click] <${tag}> "${text}" class="${cls}" @ ${new Date().toLocaleTimeString('ar-SA')}`,
      );
    },
    { passive: true },
  );
}

// ── Helper: collect browser & environment info ──
function collectBrowserInfo() {
  const nav = navigator;
  const screen = window.screen;
  return {
    userAgent: nav.userAgent,
    language: nav.language,
    platform: nav.platform,
    cookiesEnabled: nav.cookieEnabled,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    colorDepth: screen.colorDepth,
    online: nav.onLine,
    url: window.location.href,
    referrer: document.referrer || 'مباشر',
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    memoryMB: (performance as unknown as Record<string, Record<string, number>>)?.memory?.usedJSHeapSize
      ? Math.round((performance as unknown as Record<string, Record<string, number>>).memory.usedJSHeapSize / 1048576)
      : null,
  };
}

// ── Helper: collect DOM snapshot (lightweight alternative to screenshot) ──
function collectPageSnapshot(): string {
  try {
    const errors = document.querySelectorAll('.error, [class*="error"], [class*="fail"]');
    const visibleText: string[] = [];
    if (errors.length > 0) {
      errors.forEach(el => {
        const text = (el as HTMLElement).innerText?.trim().slice(0, 100);
        if (text) visibleText.push(`[visible-error] ${text}`);
      });
    }
    // Check for broken images
    const images = document.querySelectorAll('img');
    let brokenImages = 0;
    images.forEach(img => {
      if (!img.complete || img.naturalWidth === 0) brokenImages++;
    });
    if (brokenImages > 0) visibleText.push(`[broken-images] ${brokenImages} صور معطوبة`);
    
    // Check for empty map tiles
    const tiles = document.querySelectorAll('.leaflet-tile');
    let emptyTiles = 0;
    tiles.forEach(tile => {
      const img = tile as HTMLImageElement;
      if (!img.complete || img.naturalWidth === 0) emptyTiles++;
    });
    if (emptyTiles > 0) visibleText.push(`[empty-tiles] ${emptyTiles} tile خريطة فارغة`);
    
    return visibleText.join('\n') || 'لا توجد أخطاء مرئية';
  } catch {
    return 'تعذر جمع معلومات الصفحة';
  }
}

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showRepairTracker, setShowRepairTracker] = useState(false);
  const [submittedDescription, setSubmittedDescription] = useState('');
  const [submittedPage, setSubmittedPage] = useState('');
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);

  // Install telemetry listeners exactly once, after mount. Using an effect
  // (instead of module-level code) means the listeners can observe the live
  // DOM and window even in test/SSR environments where ``window`` is not
  // defined at import time, and the install guard prevents nested chains
  // across HMR reloads.
  useEffect(() => {
    installTelemetryListeners();
  }, []);

  // Track route changes via react-router. Fires exactly once per navigation
  // — the previous implementation used a MutationObserver on document.body
  // with subtree=true, which re-ran on every DOM mutation in the app.
  useEffect(() => {
    const path = location.pathname;
    const prev = prevPathRef.current;
    if (prev !== null && prev !== path) {
      _pushAction(`[nav] ${prev} → ${path} @ ${new Date().toLocaleTimeString('ar-SA')}`);
    }
    prevPathRef.current = path;
  }, [location.pathname]);

  const handleSubmit = async () => {
    if (!description.trim() || description.trim().length < 5) {
      setErrorMsg('يرجى كتابة وصف المشكلة (5 أحرف على الأقل)');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const browserInfo = collectBrowserInfo();
      const pageSnapshot = collectPageSnapshot();
      const desc = description.trim();
      const page = location.pathname;

      // Abort the fetch after 15 s so the user never sees an indefinite
      // spinner if the backend stalls on an upstream dependency. Before
      // this guard, a hung `/api/bug-report` left the submit button
      // frozen forever and surfaced a generic `TypeError: Failed to
      // fetch` after the browser's own (very long) timeout.
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 15000);

      let res: Response;
      try {
        res = await fetch(`${BACKEND_API_URL}/api/bug-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            description: desc,
            page,
            browser: navigator.userAgent,
            console_errors: _collectedErrors.slice(-15),
            user_actions: _userActions.slice(-15),
            browser_info: browserInfo,
            screenshot: pageSnapshot,
          }),
        });
      } finally {
        clearTimeout(abortTimer);
      }

      console.log('[BugReport] Response status:', res.status, 'ok:', res.ok);

      if (res.ok) {
        console.log('[BugReport] Success! Opening RepairTracker3D...');
        setSubmittedDescription(desc);
        setSubmittedPage(page);
        setDescription('');
        setIsOpen(false);
        setStatus('idle');
        // Small delay to ensure form modal unmounts before RepairTracker mounts
        setTimeout(() => {
          console.log('[BugReport] Setting showRepairTracker = true');
          setShowRepairTracker(true);
        }, 100);
      } else {
        const data = await res.json().catch(() => ({}));
        console.log('[BugReport] Error response:', data);
        setErrorMsg(data.detail || 'حدث خطأ أثناء إرسال البلاغ');
        setStatus('error');
      }
    } catch (err) {
      console.log('[BugReport] Fetch error:', err);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      setErrorMsg(
        isAbort
          ? 'انتهت مهلة الاتصال بالخادم — حاول مرة أخرى بعد قليل'
          : 'تعذر الاتصال بالخادم',
      );
      setStatus('error');
    }
  };

  return (
    <>
      {/* 3D Repair Tracker */}
      <RepairTracker3D
        isOpen={showRepairTracker}
        onClose={() => setShowRepairTracker(false)}
        problemDescription={submittedDescription}
        pagePath={submittedPage}
      />

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
                  {/* Current page indicator */}
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-white/5 border border-gray-700/30">
                    <span className="text-[10px] text-gray-500">الصفحة الحالية:</span>
                    <span className="text-[11px] text-blue-400 font-mono" dir="ltr">{location.pathname}</span>
                  </div>

                  {/* Diagnostic info badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {_collectedErrors.length > 0 && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                        🔴 {_collectedErrors.length} خطأ مسجّل
                      </span>
                    )}
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                      📋 {_userActions.length} إجراء مسجّل
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20">
                      🖥️ معلومات المتصفح
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                      🔍 فحص الصفحة
                    </span>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
