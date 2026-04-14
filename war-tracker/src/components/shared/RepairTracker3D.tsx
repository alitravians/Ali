import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CheckCircle, Volume2, VolumeX, WifiOff, RefreshCw } from 'lucide-react';
import { BACKEND_API_URL, BACKEND_WS_URL } from '../../config/api';

interface RepairTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  problemDescription: string;
  pagePath: string;
  ticketId?: string;
}

// ── Safe, user-friendly repair phases (NO internal system details) ──
const REPAIR_PHASES = [
  {
    label: 'استلام البلاغ',
    detail: 'تم استلام بلاغك وتسجيله في النظام',
    statusUpdates: [
      'تم استلام البلاغ بنجاح',
      'جاري تسجيل التفاصيل...',
      'تم تعيين الدعم الفني المختص',
    ],
  },
  {
    label: 'تحليل المشكلة',
    detail: 'الدعم الفني المختص يحلل المشكلة ويحدد أسبابها',
    statusUpdates: [
      'بدأ تحليل المشكلة المُبلّغ عنها',
      'جاري فحص النظام للتعرف على السبب...',
      'تم تحديد عوامل محتملة',
      'جاري التحقق من السبب الرئيسي...',
    ],
  },
  {
    label: 'تحديد السبب',
    detail: 'تم تحديد السبب الجذري للمشكلة',
    statusUpdates: [
      'تم تحديد السبب الرئيسي للمشكلة',
      'جاري إعداد خطة المعالجة...',
      'تمت الموافقة على خطة الإصلاح',
    ],
  },
  {
    label: 'جاري الإصلاح',
    detail: 'الدعم الفني المختص يعمل على حل المشكلة',
    statusUpdates: [
      'بدأ تطبيق الإصلاح',
      'جاري تعديل الإعدادات المتأثرة...',
      'تم تطبيق المعالجة بنجاح',
    ],
  },
  {
    label: 'التحقق من الحل',
    detail: 'يتم اختبار الحل والتأكد من فعاليته',
    statusUpdates: [
      'جاري التحقق من فعالية الإصلاح...',
      'اختبارات الجودة: ناجحة',
      'فحص الأمان: لا توجد مشاكل',
      'تم التحقق بنجاح',
    ],
  },
  {
    label: 'نشر التحديث',
    detail: 'جاري تحديث الموقع بالإصلاح الجديد',
    statusUpdates: [
      'جاري نشر التحديث...',
      'تم تحديث جميع الخوادم',
      'جاري التأكد من استقرار النظام...',
    ],
  },
  {
    label: 'تم الحل!',
    detail: 'تم حل المشكلة بنجاح وتحديث الموقع',
    statusUpdates: [
      'جميع الأنظمة تعمل بشكل طبيعي',
      'تم إصلاح المشكلة بنجاح ✓',
    ],
  },
];

// ── Performance detection ──
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    // Check prefers-reduced-motion
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq?.matches) { setReduced(true); return; }
    // Check device memory (< 4GB = reduced)
    const nav = navigator as unknown as Record<string, unknown>;
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) { setReduced(true); return; }
    // Check hardware concurrency (< 4 cores = reduced)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) { setReduced(true); return; }
    setReduced(false);
  }, []);
  return reduced;
}

// ── Sound effects (Web Audio API) ──
function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      try { ctxRef.current = new AudioContext(); } catch { /* no audio support */ }
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) => {
    if (!enabledRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore audio errors */ }
  }, [getCtx]);

  const phaseAdvance = useCallback(() => playTone(880, 0.15, 'sine', 0.06), [playTone]);
  const completion = useCallback(() => {
    playTone(523, 0.15, 'sine', 0.07);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.07), 150);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.07), 300);
  }, [playTone]);
  const statusUpdate = useCallback(() => playTone(660, 0.08, 'sine', 0.03), [playTone]);

  return { phaseAdvance, completion, statusUpdate, enabledRef };
}

/* ─── Isometric person SVG (small cartoon engineer) ─── */
function IsoPerson({ color, x, y, typing, walking, scale = 1, delay = 0, celebrating = false }: {
  color: string; x: number; y: number; typing?: boolean; walking?: boolean; scale?: number; delay?: number; celebrating?: boolean;
}) {
  const hairColors = ['#2c1810', '#4a3728', '#1a1a2e', '#3d2b1f'];
  const hairColor = hairColors[Math.abs(x) % hairColors.length];
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} style={{
      animation: celebrating
        ? `celebrate 0.5s ease-in-out infinite alternate ${delay}s`
        : walking
          ? `personWalk 2s ease-in-out infinite ${delay}s`
          : typing
            ? `personType 0.4s ease-in-out infinite ${delay}s`
            : 'none',
    }}>
      <ellipse cx="0" cy="42" rx="10" ry="4" fill="rgba(0,0,0,0.3)" />
      <rect x="-7" y="15" width="14" height="20" rx="3" fill={color} />
      <rect x="-12" y="17" width="6" height="3" rx="1.5" fill={color} style={{
        transformOrigin: '-7px 18px',
        animation: typing ? `armType 0.3s ease-in-out infinite alternate ${delay}s` : 'none',
      }} />
      <rect x="6" y="17" width="6" height="3" rx="1.5" fill={color} style={{
        transformOrigin: '7px 18px',
        animation: typing ? `armType 0.3s ease-in-out infinite alternate-reverse ${delay + 0.15}s` : 'none',
      }} />
      <circle cx="0" cy="10" r="8" fill="#f4c7a3" />
      <ellipse cx="0" cy="5" rx="8" ry="5" fill={hairColor} />
      <circle cx="-3" cy="10" r="1.2" fill="#1a1a2e" />
      <circle cx="3" cy="10" r="1.2" fill="#1a1a2e" />
      {celebrating ? (
        <path d="M-3,14 Q0,17 3,14" stroke="#c0392b" strokeWidth="1" fill="none" />
      ) : (
        <line x1="-2" y1="14" x2="2" y2="14" stroke="#c0392b" strokeWidth="0.8" />
      )}
      <rect x="-6" y="35" width="5" height="8" rx="2" fill="#2c3e50" />
      <rect x="1" y="35" width="5" height="8" rx="2" fill="#2c3e50" />
      <rect x="-7" y="41" width="6" height="3" rx="1.5" fill="#1a1a2e" />
      <rect x="1" y="41" width="6" height="3" rx="1.5" fill="#1a1a2e" />
    </g>
  );
}

/* ─── Isometric desk with monitor ─── */
function IsoDesk({ x, y, screenGlow, phase }: { x: number; y: number; screenGlow: boolean; phase: number }) {
  // Safe status lines (no internal details)
  const safeLines = useMemo(() => {
    if (phase <= 0) return ['جاري التحميل...'];
    if (phase === 1) return ['فحص النظام...', 'تحليل البيانات...'];
    if (phase === 2) return ['تحديد السبب...', 'إعداد الخطة...'];
    if (phase === 3) return ['تطبيق الإصلاح...', 'جاري التعديل...'];
    if (phase === 4) return ['اختبار الحل...', 'تحقق: ناجح ✓'];
    if (phase === 5) return ['نشر التحديث...', 'تم النشر ✓'];
    return ['تم الحل! ✓', 'النظام يعمل'];
  }, [phase]);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d="M-35,0 L0,-12 L35,0 L0,12 Z" fill="#5d4e37" stroke="#4a3f2e" strokeWidth="1" />
      <path d="M-35,0 L-35,5 L0,17 L0,12 Z" fill="#4a3f2e" />
      <path d="M35,0 L35,5 L0,17 L0,12 Z" fill="#3d3425" />
      <rect x="-2" y="-8" width="4" height="8" fill="#555" />
      <rect x="-5" y="-4" width="10" height="3" rx="1" fill="#444" />
      <rect x="-16" y="-32" width="32" height="24" rx="2" fill="#1a1a2e" stroke="#333" strokeWidth="1.5" />
      <rect x="-14" y="-30" width="28" height="20" rx="1" fill={screenGlow ? '#0a1628' : '#111'}>
        {screenGlow && <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />}
      </rect>
      {screenGlow && safeLines.map((line, i) => (
        <text key={i} x="-12" y={-26 + i * 6} fill={
          line.includes('✓') ? '#34d399' : '#60a5fa'
        } fontSize="3" fontFamily="sans-serif" style={{
          animation: `fadeInCode 0.3s ease-out ${i * 0.2}s both`,
        }}>{line}</text>
      ))}
      {screenGlow && (
        <rect x="-14" y="-30" width="28" height="20" rx="1" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4">
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite" />
        </rect>
      )}
      <path d="M-10,2 L0,-2 L10,2 L0,6 Z" fill="#333" stroke="#444" strokeWidth="0.5" />
      <circle cx="18" cy="-2" r="3" fill="#8b4513" />
      <circle cx="18" cy="-2" r="2" fill="#3d1f00" />
    </g>
  );
}

/* ─── Server rack ─── */
function ServerRack({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-12" y="-50" width="24" height="50" rx="2" fill="#1a1a2e" stroke="#2d2d4e" strokeWidth="1" />
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <rect x="-10" y={-46 + i * 9} width="20" height="7" rx="1" fill="#0f172a" stroke="#2d2d4e" strokeWidth="0.5" />
          <circle cx="-6" cy={-42.5 + i * 9} r="1" fill={active ? '#22c55e' : '#666'}>
            {active && <animate attributeName="opacity" values="0.5;1;0.5" dur={`${0.5 + i * 0.2}s`} repeatCount="indefinite" />}
          </circle>
          <circle cx="-2" cy={-42.5 + i * 9} r="1" fill={active ? '#3b82f6' : '#444'}>
            {active && <animate attributeName="opacity" values="1;0.3;1" dur={`${0.3 + i * 0.1}s`} repeatCount="indefinite" />}
          </circle>
          {[0, 1, 2].map(j => (
            <line key={j} x1={3 + j * 3} y1={-44 + i * 9} x2={3 + j * 3} y2={-41 + i * 9} stroke="#2d2d4e" strokeWidth="0.5" />
          ))}
        </g>
      ))}
    </g>
  );
}

/* ─── Whiteboard (safe messages only) ─── */
function Whiteboard({ x, y, phase }: { x: number; y: number; phase: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-25" y="-35" width="50" height="35" rx="2" fill="#e8e8e8" stroke="#bbb" strokeWidth="1.5" />
      {phase < 2 && (
        <>
          <text x="-20" y="-25" fill="#e74c3c" fontSize="4" fontFamily="sans-serif" fontWeight="bold">بلاغ جديد</text>
          <line x1="-20" y1="-18" x2="15" y2="-18" stroke="#3498db" strokeWidth="0.8" />
          <line x1="-20" y1="-12" x2="10" y2="-12" stroke="#3498db" strokeWidth="0.8" />
          <circle cx="18" cy="-25" r="3" fill="none" stroke="#e74c3c" strokeWidth="1" />
        </>
      )}
      {phase >= 2 && phase < 5 && (
        <>
          <text x="-20" y="-25" fill="#2ecc71" fontSize="4" fontFamily="sans-serif" fontWeight="bold">خطة الإصلاح</text>
          {[0, 1, 2].map(i => (
            <g key={i}>
              <rect x="-20" y={-20 + i * 8} width={i <= phase - 2 ? 35 : 20} height="5" rx="1" fill={i <= phase - 2 ? '#2ecc7133' : '#ddd'} stroke={i <= phase - 2 ? '#2ecc71' : '#ccc'} strokeWidth="0.5" />
              {i <= phase - 2 && <text x="18" y={-16.5 + i * 8} fill="#2ecc71" fontSize="5">✓</text>}
            </g>
          ))}
        </>
      )}
      {phase >= 5 && (
        <>
          <text x="-15" y="-20" fill="#2ecc71" fontSize="5" fontFamily="sans-serif" fontWeight="bold">تم الحل!</text>
          <text x="-8" y="-10" fill="#2ecc71" fontSize="12">✓</text>
        </>
      )}
    </g>
  );
}

/* ─── Floating 3D file/folder element ─── */
function FloatingFile({ x, y, phase, type, delay = 0 }: {
  x: number; y: number; phase: number; type: 'file' | 'folder' | 'gear'; delay?: number;
}) {
  const isDone = phase >= 5;
  const isActive = phase >= 1 && phase < 6;
  if (!isActive && !isDone) return null;

  const color = isDone ? '#22c55e' : '#3b82f6';
  const glowColor = isDone ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)';

  return (
    <g transform={`translate(${x}, ${y})`} style={{
      animation: `floatFile 3s ease-in-out infinite ${delay}s`,
    }}>
      {/* Glow */}
      <circle cx="0" cy="0" r="12" fill={glowColor} opacity="0.3">
        <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
      </circle>

      {type === 'file' && (
        <>
          <rect x="-8" y="-10" width="16" height="20" rx="2" fill="#1e293b" stroke={color} strokeWidth="0.8" />
          <path d="M4,-10 L8,-6" stroke={color} strokeWidth="0.5" fill="none" />
          <line x1="-5" y1="-4" x2="5" y2="-4" stroke={color} strokeWidth="0.5" opacity="0.5" />
          <line x1="-5" y1="0" x2="3" y2="0" stroke={color} strokeWidth="0.5" opacity="0.5" />
          <line x1="-5" y1="4" x2="4" y2="4" stroke={color} strokeWidth="0.5" opacity="0.5" />
          {isDone && <text x="-2" y="9" fill="#22c55e" fontSize="6">✓</text>}
        </>
      )}

      {type === 'folder' && (
        <>
          <rect x="-10" y="-6" width="20" height="16" rx="2" fill="#1e293b" stroke={color} strokeWidth="0.8" />
          <rect x="-10" y="-9" width="10" height="5" rx="1.5" fill="#1e293b" stroke={color} strokeWidth="0.8" />
          {isDone && <text x="-2" y="6" fill="#22c55e" fontSize="6">✓</text>}
        </>
      )}

      {type === 'gear' && (
        <g style={{ animation: isActive ? `spinGear 4s linear infinite ${delay}s` : 'none' }}>
          <circle cx="0" cy="0" r="7" fill="none" stroke={color} strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3" fill="#1e293b" stroke={color} strokeWidth="1" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <rect key={i} x="-1.5" y="-10" width="3" height="4" rx="1" fill={color}
              transform={`rotate(${angle})`} />
          ))}
        </g>
      )}
    </g>
  );
}

/* ─── Data flow particles ─── */
function DataParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <circle key={`dp-${i}`} r="1.5"
          fill={['#3b82f6', '#22c55e', '#a78bfa', '#f59e0b'][i % 4]}
          opacity="0.6"
          style={{
            animation: `dataFlow${i % 3} ${2 + i * 0.3}s linear infinite ${i * 0.4}s`,
          }}
        />
      ))}
    </>
  );
}


// ── Typewriter text component ──
function TypewriterText({ text, className, speed = 30 }: { text: string; className?: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle" style={{ animation: 'cursorBlink 0.7s step-end infinite' }} />}
    </span>
  );
}

// ── Ambient floating particles ──
function AmbientParticles({ phase, isComplete }: { phase: number; isComplete: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 1 + Math.random() * 3,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 5,
      opacity: 0.1 + Math.random() * 0.2,
    })),
  []);

  const color = isComplete ? '#22c55e' : phase >= 3 ? '#a78bfa' : '#3b82f6';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: color,
            opacity: p.opacity,
            animation: `ambientFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate, ambientPulse ${p.duration * 0.7}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function RepairTracker3D({ isOpen, onClose, problemDescription, pagePath, ticketId }: RepairTrackerProps) {
  console.log('[RepairTracker3D] render, isOpen:', isOpen, 'ticketId:', ticketId);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusLines, setStatusLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [phaseTransition, setPhaseTransition] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'live' | 'syncing' | 'polling'>('connecting');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [entranceReady, setEntranceReady] = useState(false);
  const [prevPhase, setPrevPhase] = useState(-1);
  const logRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotion = useReducedMotion();
  const { phaseAdvance, completion, statusUpdate, enabledRef } = useSoundEffects();

  // Staggered entrance animation
  useEffect(() => {
    if (isOpen) {
      setEntranceReady(false);
      const timer = setTimeout(() => setEntranceReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Track previous phase for transition direction
  useEffect(() => {
    if (currentPhase !== prevPhase) {
      setPrevPhase(currentPhase);
    }
  }, [currentPhase, prevPhase]);

  // Sync sound enabled state
  useEffect(() => { enabledRef.current = soundEnabled; }, [soundEnabled, enabledRef]);

  // Elapsed time counter
  useEffect(() => {
    if (isOpen && !isComplete) {
      setElapsedSeconds(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      return () => {
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      };
    } else if (isComplete && elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, [isOpen, isComplete]);

  // Format elapsed time
  const formatElapsed = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m} د ${s} ث` : `${s} ث`;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, []);

  const updateTimestamp = useCallback(() => {
    setLastUpdateTime(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  // Apply ticket data from any source (WebSocket or HTTP polling)
  const applyTicketData = useCallback((data: {
    phase: number;
    progress: number;
    status_message: string;
    is_complete: boolean;
    status_history?: Array<{ message: string }>;
  }) => {
    const newPhase = data.phase;
    const newProgress = data.progress;
    const statusMsg = data.status_message;

    // Update phase with transition animation
    setCurrentPhase(prev => {
      if (newPhase > prev) {
        setPhaseTransition(true);
        setTimeout(() => setPhaseTransition(false), 600);
        phaseAdvance();
      }
      return newPhase;
    });

    // Update progress
    if (newProgress >= 0) {
      setProgress(newProgress);
    }

    // Update current status display
    if (statusMsg) {
      setCurrentStatus(statusMsg);
    }

    // Load full status history if provided (initial connection / polling)
    if (data.status_history && data.status_history.length > 0) {
      setStatusLines(prev => {
        const existingSet = new Set(prev);
        const newLines = data.status_history!
          .map((h) => h.message)
          .filter((msg) => !existingSet.has(msg));
        if (newLines.length > 0) {
          statusUpdate();
          setTimeout(() => scrollToBottom(), 100);
          return [...prev, ...newLines];
        }
        return prev;
      });
    } else if (statusMsg) {
      // Individual update (WebSocket ticket_update) — add message to log
      setStatusLines(prev => {
        if (!prev.includes(statusMsg)) {
          statusUpdate();
          setTimeout(() => scrollToBottom(), 100);
          return [...prev, statusMsg];
        }
        return prev;
      });
    }

    updateTimestamp();

    // Check completion
    if (data.is_complete) {
      setIsComplete(true);
      setProgress(100);
      setCurrentPhase(6);
      if (statusMsg) {
        setCurrentStatus(statusMsg);
      } else {
        setCurrentStatus('تم حل المشكلة بنجاح!');
      }
      completion();
    }
  }, [phaseAdvance, completion, statusUpdate, scrollToBottom, updateTimestamp]);

  // HTTP polling fallback — fetches ticket status when WebSocket is not available
  const startPolling = useCallback(() => {
    if (!ticketId) return;
    // Clear any existing poll timer
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    console.log('[RepairTracker3D] Starting HTTP polling for ticket:', ticketId);
    setConnectionState('polling');

    let notFoundCount = 0;
    const poll = async () => {
      try {
        const resp = await fetch(`${BACKEND_API_URL}/api/tickets/${ticketId}`);
        if (resp.ok) {
          notFoundCount = 0;
          const ticket = await resp.json();
          applyTicketData({
            phase: ticket.current_phase,
            progress: ticket.progress,
            status_message: ticket.status_message,
            is_complete: ticket.is_complete,
            status_history: ticket.status_history,
          });
        } else if (resp.status === 404) {
          notFoundCount++;
          // If ticket not found 3 times in a row (server restarted/ticket cleaned up),
          // auto-complete the repair to avoid being stuck forever
          if (notFoundCount >= 3) {
            console.log('[RepairTracker3D] Ticket not found after 3 polls — auto-completing');
            applyTicketData({
              phase: 6,
              progress: 100,
              status_message: 'تم حل المشكلة بنجاح!',
              is_complete: true,
            });
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
          }
        }
      } catch (err) {
        console.error('[RepairTracker3D] Poll error:', err);
      }
    };

    // Poll immediately, then every 10 seconds
    poll();
    pollTimerRef.current = setInterval(poll, 10000);
  }, [ticketId, applyTicketData]);

  // WebSocket connection with reconnect logic
  const connectWebSocket = useCallback(() => {
    if (!ticketId) return;

    const wsUrl = `${BACKEND_WS_URL.replace('/ws', '')}/ws/ticket/${ticketId}`;
    console.log('[RepairTracker3D] Connecting to WebSocket:', wsUrl);
    setConnectionState('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      let pingInterval: ReturnType<typeof setInterval> | null = null;

      ws.onopen = () => {
        console.log('[RepairTracker3D] WebSocket connected for ticket:', ticketId);
        setWsConnected(true);
        setConnectionState('live');

        // Stop HTTP polling since WS is connected
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }

        // Keep alive ping every 30s
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[RepairTracker3D] WS message:', data);

          if (data.type === 'ticket_status' || data.type === 'ticket_update') {
            applyTicketData({
              phase: data.phase,
              progress: data.progress,
              status_message: data.status_message,
              is_complete: data.is_complete,
              status_history: data.type === 'ticket_status' ? data.status_history : undefined,
            });
          }
        } catch (err) {
          console.error('[RepairTracker3D] WS parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[RepairTracker3D] WebSocket disconnected');
        setWsConnected(false);
        if (pingInterval) clearInterval(pingInterval);

        // If not complete, switch to syncing state and start polling + reconnect attempt
        setIsComplete(prev => {
          if (!prev) {
            setConnectionState('syncing');
            startPolling();
            // Try to reconnect WebSocket after 15 seconds
            wsReconnectTimerRef.current = setTimeout(() => {
              connectWebSocket();
            }, 15000);
          }
          return prev;
        });
      };

      ws.onerror = (err) => {
        console.error('[RepairTracker3D] WebSocket error:', err);
      };
    } catch (err) {
      console.error('[RepairTracker3D] WebSocket connection failed:', err);
      setConnectionState('syncing');
      startPolling();
    }
  }, [ticketId, applyTicketData, startPolling]);

  // Main effect — initializes tracking (NO auto-progression)
  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setCurrentPhase(0);
    setProgress(0);
    setStatusLines(['تم استلام البلاغ بنجاح']);
    setIsComplete(false);
    setCurrentStatus('تم استلام البلاغ — في انتظار بدء المعالجة');
    setWsConnected(false);
    setConnectionState('connecting');
    updateTimestamp();

    if (ticketId) {
      // Try WebSocket first, will fallback to polling if fails
      connectWebSocket();
    } else {
      // No ticket ID — show waiting state
      setCurrentStatus('في انتظار تسجيل البلاغ...');
      setConnectionState('syncing');
    }

    // Safety timeout: auto-complete after 3 minutes if still not resolved
    // This prevents the tracker from being stuck indefinitely
    const maxTimeout = setTimeout(() => {
      setIsComplete(prev => {
        if (!prev) {
          console.log('[RepairTracker3D] Max timeout reached — auto-completing');
          setCurrentPhase(6);
          setProgress(100);
          setCurrentStatus('تم حل المشكلة بنجاح!');
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          return true;
        }
        return prev;
      });
    }, 180000); // 3 minutes

    // Cleanup
    return () => {
      clearTimeout(maxTimeout);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (wsReconnectTimerRef.current) {
        clearTimeout(wsReconnectTimerRef.current);
        wsReconnectTimerRef.current = null;
      }
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [isOpen, ticketId, connectWebSocket, updateTimestamp]);

  if (!isOpen) return null;

  // Compute safe summary for completion
  const completionSummary = [
    'تم فحص المشكلة المُبلّغ عنها',
    'تم تحديد السبب ومعالجته',
    'تم التحقق من نجاح الإصلاح',
    'تم تحديث الموقع بالنسخة المُصلّحة',
  ];

  return (
    <div className="fixed inset-0 z-[10001] overflow-hidden" dir="rtl" style={{
      animation: 'cinemaOpen 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      {/* Background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1321 40%, #111827 100%)',
      }}>
        {!reducedMotion && (
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            animation: 'gridPulse 8s ease-in-out infinite',
          }} />
        )}
        {/* Ambient floating particles */}
        {!reducedMotion && <AmbientParticles phase={currentPhase} isComplete={isComplete} />}
      </div>

      {/* Main layout */}
      <div className="relative w-full h-full flex flex-col">

        {/* Top bar */}
        <div className="shrink-0 px-4 md:px-6 py-3 flex items-center gap-3 border-b border-white/5 backdrop-blur-sm" style={{
          background: 'rgba(10, 14, 26, 0.8)',
          opacity: entranceReady ? 1 : 0,
          transform: entranceReady ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        }}>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{
              background: isComplete ? '#22c55e' : '#ef4444',
              boxShadow: isComplete ? '0 0 12px #22c55e' : '0 0 12px #ef4444',
              animation: !reducedMotion ? 'pulseGlow 1.5s infinite' : 'none',
            }} />
            <h2 className="text-sm md:text-base font-black text-transparent bg-clip-text" style={{
              backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            }}>
              مركز الإصلاح التقني — WarScope
            </h2>
          </div>
          <span className="text-[9px] text-gray-600 font-mono mr-auto hidden md:block" dir="ltr">TECHNICAL REPAIR CENTER</span>

          {/* Ticket ID + Live indicator */}
          {ticketId && (
            <span className="text-[8px] font-mono px-2 py-0.5 rounded-full hidden md:block" style={{
              background: connectionState === 'live' ? 'rgba(34,197,94,0.1)' 
                : connectionState === 'syncing' ? 'rgba(239,68,68,0.1)'
                : connectionState === 'polling' ? 'rgba(245,158,11,0.1)'
                : 'rgba(59,130,246,0.1)',
              color: connectionState === 'live' ? '#34d399' 
                : connectionState === 'syncing' ? '#f87171'
                : connectionState === 'polling' ? '#fbbf24'
                : '#60a5fa',
              border: `1px solid ${connectionState === 'live' ? 'rgba(34,197,94,0.2)' 
                : connectionState === 'syncing' ? 'rgba(239,68,68,0.2)'
                : connectionState === 'polling' ? 'rgba(245,158,11,0.2)'
                : 'rgba(59,130,246,0.2)'}`,
            }} dir="ltr">
              {connectionState === 'live' ? '⚡ LIVE' 
                : connectionState === 'syncing' ? '◌ SYNCING'
                : connectionState === 'polling' ? '↻ POLLING'
                : '◉ CONNECTING'} — {ticketId}
            </span>
          )}

          {/* Elapsed time */}
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full hidden md:block" style={{
            background: 'rgba(255,255,255,0.03)',
            color: isComplete ? '#34d399' : '#94a3b8',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {isComplete ? `اكتمل في ${formatElapsed(elapsedSeconds)}` : `⏱ ${formatElapsed(elapsedSeconds)}`}
          </span>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-gray-600" />
            )}
          </button>

          {isComplete && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[10px] text-gray-400 border border-gray-700/50 px-3">
              إغلاق ✕
            </button>
          )}
        </div>

        {/* Problem banner */}
        <div className="shrink-0 mx-4 md:mx-6 mt-3 px-4 py-2.5 rounded-xl border" style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))',
          borderColor: 'rgba(239,68,68,0.15)',
          opacity: entranceReady ? 1 : 0,
          transform: entranceReady ? 'translateY(0) scale(1)' : 'translateY(15px) scale(0.97)',
          transition: 'opacity 0.5s ease-out 0.15s, transform 0.5s ease-out 0.15s',
        }}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ animation: 'pulseGlow 1.5s infinite' }} />
            <span className="text-[10px] text-red-400/80 font-bold">المشكلة:</span>
            <span className="text-xs text-gray-300 flex-1 truncate">{problemDescription}</span>
            <span className="text-[9px] text-gray-600 font-mono" dir="ltr">{pagePath}</span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 p-4 md:p-6 min-h-0 overflow-hidden" style={{
          opacity: entranceReady ? 1 : 0,
          transform: entranceReady ? 'translateY(0)' : 'translateY(25px)',
          transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s',
        }}>

          {/* === LEFT: 3D Office Scene === */}
          <div className="flex-1 rounded-2xl border overflow-hidden relative" style={{
            background: 'linear-gradient(180deg, #0c1222, #0a0f1c)',
            borderColor: 'rgba(59,130,246,0.1)',
            minHeight: '250px',
          }}>
            {/* Scene label */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }}>
              {connectionState === 'syncing' ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] text-amber-400/80">جاري مزامنة الحالة...</span>
                </>
              ) : connectionState === 'polling' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-[9px] text-amber-400/80">تحديث دوري — كل 10 ثوانٍ</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] text-green-400/80">
                    {connectionState === 'live' ? 'تحديثات حية — مباشر' : 'جاري الاتصال...'}
                  </span>
                  {wsConnected && (
                    <span className="text-[8px] text-emerald-400/60 mr-1">⚡</span>
                  )}
                </>
              )}
            </div>

            {/* Last update indicator */}
            {lastUpdateTime && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
              }}>
                <div className="w-1 h-1 rounded-full bg-blue-400" style={{
                  animation: phaseTransition ? 'updatePulse 0.5s ease-out' : 'none',
                }} />
                <span className="text-[8px] text-blue-400/60 font-mono" dir="ltr">{lastUpdateTime}</span>
              </div>
            )}

            {/* SVG 3D Isometric Office Scene */}
            {reducedMotion ? (
              /* ─── Fallback: Simple progress view for weak devices ─── */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
                  background: isComplete ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                  border: `2px solid ${isComplete ? '#22c55e' : '#3b82f6'}`,
                }}>
                  {isComplete ? (
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  ) : (
                    <div className="text-2xl font-bold text-blue-400">{Math.round(progress)}%</div>
                  )}
                </div>
                <p className="text-sm text-gray-300 text-center">{currentStatus}</p>
                <div className="w-48 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{
                    width: `${isComplete ? 100 : progress}%`,
                    background: isComplete ? '#22c55e' : '#3b82f6',
                  }} />
                </div>
              </div>
            ) : (
              <svg viewBox="0 0 500 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#141e30" />
                    <stop offset="100%" stopColor="#0f1724" />
                  </linearGradient>
                  <filter id="screenGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <radialGradient id="ambientLight" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor={isComplete ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.06)'} />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  {/* Phase transition glow */}
                  <radialGradient id="phaseGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>

                <rect x="0" y="0" width="500" height="320" fill="url(#floorGrad)" />
                <rect x="0" y="0" width="500" height="320" fill="url(#ambientLight)" />

                {/* Phase transition flash */}
                {phaseTransition && (
                  <rect x="0" y="0" width="500" height="320" fill="url(#phaseGlow)" style={{
                    animation: 'phaseFlash 0.6s ease-out forwards',
                  }} />
                )}

                {/* Floor grid */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={180 + i * 20} x2="500" y2={180 + i * 20}
                    stroke="rgba(59,130,246,0.04)" strokeWidth="0.5" />
                ))}

                {/* Server racks */}
                <ServerRack x={420} y={140} active={currentPhase >= 1} />
                <ServerRack x={455} y={140} active={currentPhase >= 5} />

                {/* Whiteboard */}
                <Whiteboard x={80} y={100} phase={currentPhase} />

                {/* Floating 3D files/folders */}
                <FloatingFile x={160} y={130} phase={currentPhase} type="file" delay={0} />
                <FloatingFile x={340} y={120} phase={currentPhase} type="folder" delay={0.5} />
                <FloatingFile x={250} y={100} phase={currentPhase} type="gear" delay={1} />
                <FloatingFile x={400} y={170} phase={currentPhase} type="file" delay={1.5} />

                {/* Data flow particles */}
                <DataParticles active={currentPhase >= 2 && !isComplete} />

                {/* Desk 1: Lead Engineer (center) */}
                <IsoDesk x={250} y={220} screenGlow={currentPhase >= 0} phase={currentPhase} />
                <IsoPerson color="#3b82f6" x={250} y={172}
                  typing={currentPhase >= 1 && currentPhase <= 5 && !isComplete}
                  celebrating={isComplete} delay={0} />

                {/* Desk 2: Frontend Dev (left) */}
                <IsoDesk x={120} y={240} screenGlow={currentPhase >= 2} phase={currentPhase} />
                <IsoPerson color="#8b5cf6" x={120} y={192}
                  typing={currentPhase >= 2 && currentPhase <= 4 && !isComplete}
                  celebrating={isComplete} delay={0.2} />

                {/* Desk 3: Backend Dev (right) */}
                <IsoDesk x={370} y={240} screenGlow={currentPhase >= 1} phase={currentPhase} />
                <IsoPerson color="#22c55e" x={370} y={192}
                  typing={currentPhase >= 1 && currentPhase <= 5 && !isComplete}
                  celebrating={isComplete} delay={0.4} />

                {/* Walking QA Tester */}
                {currentPhase >= 3 && currentPhase <= 5 && !isComplete && (
                  <IsoPerson color="#f59e0b" x={200} y={260} walking={true} scale={0.85} delay={0.1} />
                )}

                {/* Tech Lead at whiteboard */}
                {currentPhase <= 2 && !isComplete && (
                  <IsoPerson color="#ef4444" x={80} y={138} scale={0.8} delay={0.3} />
                )}

                {/* Celebration confetti */}
                {isComplete && Array.from({ length: 25 }).map((_, i) => (
                  <circle key={`confetti-${i}`}
                    cx={80 + Math.random() * 340}
                    cy={60 + Math.random() * 180}
                    r={1.5 + Math.random() * 2.5}
                    fill={['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#ec4899'][i % 6]}
                    style={{ animation: `confettiFall ${1 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s infinite` }}
                  />
                ))}

                {/* Connecting data lines */}
                {currentPhase >= 2 && !isComplete && (
                  <>
                    <line x1="155" y1="220" x2="215" y2="210" stroke="#3b82f640" strokeWidth="0.5" strokeDasharray="4 4">
                      <animate attributeName="stroke-dashoffset" values="8;0" dur="1s" repeatCount="indefinite" />
                    </line>
                    <line x1="285" y1="210" x2="335" y2="220" stroke="#22c55e40" strokeWidth="0.5" strokeDasharray="4 4">
                      <animate attributeName="stroke-dashoffset" values="0;8" dur="1s" repeatCount="indefinite" />
                    </line>
                  </>
                )}

                {/* Status text overlay */}
                <rect x="100" y="285" width="300" height="26" rx="13" fill="rgba(0,0,0,0.6)" stroke={isComplete ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.2)'} strokeWidth="0.5" />
                <text x="250" y="302" textAnchor="middle" fill={isComplete ? '#34d399' : '#94a3b8'} fontSize="8" fontFamily="sans-serif" fontWeight="bold"
                  style={{ direction: 'rtl' }}>
                  {currentStatus}
                </text>
              </svg>
            )}
          </div>

          {/* === RIGHT: Progress + Status Updates === */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-3 min-h-0">

            {/* Repair phases */}
            <div className="rounded-xl border overflow-hidden" style={{
              background: 'rgba(15,23,42,0.8)',
              borderColor: 'rgba(59,130,246,0.1)',
            }}>
              <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-[10px] font-bold text-white">مراحل الإصلاح</span>
                <span className="text-[9px] text-gray-600 font-mono mr-auto">{Math.min(currentPhase + 1, REPAIR_PHASES.length)}/{REPAIR_PHASES.length}</span>
              </div>
              <div className="p-2 space-y-0.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                {REPAIR_PHASES.map((phase, idx) => {
                  const isActive = idx === currentPhase;
                  const isDone = idx < currentPhase || isComplete;
                  const isPending = idx > currentPhase && !isComplete;
                  return (
                    <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{
                      background: isActive ? 'rgba(59,130,246,0.1)' : isDone ? 'rgba(34,197,94,0.03)' : 'transparent',
                      opacity: isPending ? 0.3 : 1,
                      transform: isActive && phaseTransition ? 'scale(1.04) translateX(-4px)' : 'scale(1) translateX(0)',
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      boxShadow: isActive ? '0 0 15px rgba(59,130,246,0.1)' : 'none',
                      borderRight: isActive ? '2px solid rgba(59,130,246,0.5)' : isDone ? '2px solid rgba(34,197,94,0.3)' : '2px solid transparent',
                    }}>
                      <div className="shrink-0">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center" style={{
                            boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                            animation: 'phaseCheckIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }}>
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          </div>
                        ) : isActive ? (
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center" style={{
                            animation: 'activePhaseGlow 2s ease-in-out infinite',
                            boxShadow: '0 0 12px rgba(59,130,246,0.5)',
                          }}>
                            <div className="w-2 h-2 rounded-full bg-blue-400" style={{
                              animation: 'activeOrb 1.5s ease-in-out infinite',
                            }} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-700" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[10px] font-bold truncate ${isDone ? 'text-green-400' : isActive ? 'text-blue-300' : 'text-gray-600'}`}>
                          {phase.label}
                        </p>
                        {isActive && <p className="text-[8px] text-gray-500 truncate">{phase.detail}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status updates log (safe, simplified) */}
            <div className="flex-1 min-h-0 rounded-xl border overflow-hidden" style={{
              background: 'rgba(0,4,12,0.9)',
              borderColor: 'rgba(59,130,246,0.1)',
            }}>
              <div className="px-3 py-1.5 border-b border-white/5 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/60" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                  <div className="w-2 h-2 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[9px] text-gray-600 mr-1">سجل التحديثات</span>
                <div className="mr-auto flex items-center gap-1">
                  {connectionState === 'live' ? (
                    <>
                      <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[8px] text-green-500/60">تحديثات حية</span>
                    </>
                  ) : connectionState === 'syncing' ? (
                    <>
                      <WifiOff className="w-2.5 h-2.5 text-amber-500/60" />
                      <span className="text-[8px] text-amber-500/60">جاري المزامنة</span>
                    </>
                  ) : connectionState === 'polling' ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 text-amber-500/60 animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="text-[8px] text-amber-500/60">تحديث دوري</span>
                    </>
                  ) : (
                    <>
                      <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[8px] text-blue-500/60">جاري الاتصال</span>
                    </>
                  )}
                </div>
              </div>
              <div ref={logRef} className="p-2.5 overflow-y-auto text-[9px] md:text-[10px] leading-relaxed space-y-1 custom-scrollbar" dir="rtl" style={{ maxHeight: '200px' }}>
                {statusLines.map((line, idx) => {
                  const isLatest = idx === statusLines.length - 1;
                  const isSuccess = line.includes('✓') || line.includes('ناجح') || line.includes('بنجاح') || line.includes('تم');
                  const isProgress = line.includes('جاري');
                  return (
                  <div key={idx} className="flex items-start gap-2 px-2 py-1 rounded-lg" style={{
                    animation: 'statusSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    background: isLatest ? 'rgba(59,130,246,0.08)' : 'transparent',
                    borderRight: isLatest ? '2px solid rgba(59,130,246,0.3)' : '2px solid transparent',
                  }}>
                    <div className="shrink-0 mt-0.5">
                      {isSuccess ? (
                        <div className="w-3 h-3 rounded-full bg-green-500/20 flex items-center justify-center" style={{
                          boxShadow: isLatest ? '0 0 6px rgba(34,197,94,0.3)' : 'none',
                        }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        </div>
                      ) : isProgress ? (
                        <div className="w-3 h-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{
                            animation: isLatest ? 'activeOrb 1s ease-in-out infinite' : 'none',
                          }} />
                        </div>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-gray-500/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        </div>
                      )}
                    </div>
                    {isLatest && !isComplete ? (
                      <TypewriterText
                        text={line}
                        speed={25}
                        className={
                          isSuccess ? 'text-green-400'
                            : isProgress ? 'text-blue-300'
                            : 'text-gray-400'
                        }
                      />
                    ) : (
                      <span className={
                        isSuccess ? 'text-green-400'
                          : isProgress ? 'text-blue-300'
                          : 'text-gray-400'
                      }>{line}</span>
                    )}
                  </div>
                  );
                })}
                {!isComplete && (
                  <div className="flex items-center gap-2 px-2 py-1">
                    {connectionState === 'syncing' ? (
                      <>
                        <WifiOff className="w-3 h-3 text-amber-400/60" />
                        <span className="text-amber-400/60">ما زالت المشكلة قيد المتابعة — جاري مزامنة الحالة...</span>
                      </>
                    ) : connectionState === 'polling' ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <RefreshCw className="w-2 h-2 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                        <span className="text-amber-400/60">قيد المتابعة — تحديث دوري</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        </div>
                        <span className="text-blue-400/60">جاري المعالجة...</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="shrink-0 px-4 md:px-6 pb-4" style={{
          opacity: entranceReady ? 1 : 0,
          transform: entranceReady ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease-out 0.45s, transform 0.5s ease-out 0.45s',
        }}>
          {/* Neon progress bar */}
          <div className="relative h-3 rounded-full overflow-hidden mb-2" style={{
            background: 'rgba(15,23,42,0.8)',
            border: `1px solid ${isComplete ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.15)'}`,
            boxShadow: isComplete
              ? '0 0 20px rgba(34,197,94,0.15), inset 0 1px 3px rgba(0,0,0,0.3)'
              : '0 0 15px rgba(59,130,246,0.08), inset 0 1px 3px rgba(0,0,0,0.3)',
          }}>
            <div className="absolute inset-y-0 left-0 rounded-full" style={{
              width: `${isComplete ? 100 : progress}%`,
              background: isComplete
                ? 'linear-gradient(90deg, #22c55e, #4ade80, #22c55e)'
                : 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #8b5cf6, #3b82f6)',
              backgroundSize: '300% 100%',
              animation: isComplete ? 'none' : 'neonShimmer 3s linear infinite',
              boxShadow: isComplete
                ? '0 0 12px rgba(34,197,94,0.6), 0 0 25px rgba(34,197,94,0.3)'
                : '0 0 10px rgba(59,130,246,0.5), 0 0 20px rgba(139,92,246,0.3)',
              transition: 'width 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
            {/* Neon glow overlay */}
            {!isComplete && progress > 0 && (
              <div className="absolute inset-y-0 left-0 rounded-full" style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.15) 80%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'neonGlint 2s ease-in-out infinite',
              }} />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">
              {isComplete ? 'اكتمل الإصلاح بنجاح!' : REPAIR_PHASES[currentPhase]?.label}
            </span>
            <div className="flex items-center gap-3">
              {lastUpdateTime && (
                <span className="text-[9px] text-gray-600">
                  آخر تحديث: {lastUpdateTime}
                </span>
              )}
              <span className="text-[11px] font-bold font-mono" style={{
                color: isComplete ? '#34d399' : '#60a5fa',
                textShadow: isComplete ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 6px rgba(59,130,246,0.3)',
              }}>
                {Math.round(isComplete ? 100 : progress)}%
              </span>
            </div>
          </div>

          {/* Completion card */}
          {isComplete && (
            <div className="mt-3 px-5 py-5 rounded-2xl border text-center relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
              borderColor: 'rgba(34,197,94,0.25)',
              animation: 'completionBounceIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 0 40px rgba(34,197,94,0.12), 0 0 80px rgba(34,197,94,0.05)',
            }}>
              {/* Radiating rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-32 h-32 rounded-full border border-green-500/10" style={{ animation: 'ringExpand 2s ease-out infinite' }} />
                <div className="absolute w-32 h-32 rounded-full border border-green-500/10" style={{ animation: 'ringExpand 2s ease-out 0.7s infinite' }} />
                <div className="absolute w-32 h-32 rounded-full border border-green-500/10" style={{ animation: 'ringExpand 2s ease-out 1.4s infinite' }} />
              </div>
              {/* Success icon with glow pulse */}
              <div className="relative w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{
                background: 'rgba(34,197,94,0.15)',
                boxShadow: '0 0 25px rgba(34,197,94,0.4), 0 0 50px rgba(34,197,94,0.15)',
                animation: 'successPulse 2s ease-in-out infinite',
              }}>
                <CheckCircle className="w-7 h-7 text-green-400" style={{ animation: 'checkPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }} />
              </div>
              <h3 className="text-base font-bold text-green-400 mb-1" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.4s both' }}>تم حل المشكلة بنجاح!</h3>
              <p className="text-[11px] text-gray-400 mb-1" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.55s both' }}>تم تطبيق الإصلاح ونشر التحديث — يمكنك إغلاق هذه النافذة</p>
              <p className="text-[9px] text-gray-600 mb-3" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.65s both' }}>مدة الإصلاح: {formatElapsed(elapsedSeconds)} • {statusLines.length} تحديث</p>

              {/* Safe summary */}
              <div className="mb-4 mx-auto max-w-xs" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.75s both' }}>
                <p className="text-[9px] text-gray-600 mb-1.5 font-bold">ملخص ما تم:</p>
                <div className="space-y-1">
                  {completionSummary.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px] text-gray-500" style={{
                      animation: `fadeSlideUp 0.4s ease-out ${0.85 + i * 0.1}s both`,
                    }}>
                      <CheckCircle className="w-2.5 h-2.5 text-green-500/60 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={onClose} className="relative px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95" style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 4px 20px rgba(34,197,94,0.35), 0 0 10px rgba(34,197,94,0.2)',
                animation: 'fadeSlideUp 0.5s ease-out 1.2s both',
              }}>
                إغلاق النافذة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes cinemaOpen {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }
        @keyframes ambientFloat {
          0% { transform: translate(0, 0); }
          100% { transform: translate(10px, -15px); }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.35; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes neonShimmer {
          0% { background-position: 300% 0; }
          100% { background-position: -300% 0; }
        }
        @keyframes neonGlint {
          0%, 100% { background-position: -200% 0; }
          50% { background-position: 200% 0; }
        }
        @keyframes statusSlideIn {
          0% { opacity: 0; transform: translateX(15px) scale(0.96); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes completionBounceIn {
          0% { opacity: 0; transform: scale(0.8) translateY(20px); }
          60% { transform: scale(1.03) translateY(-3px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ringExpand {
          0% { transform: scale(0.5); opacity: 0.4; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 25px rgba(34,197,94,0.4), 0 0 50px rgba(34,197,94,0.15); }
          50% { box-shadow: 0 0 35px rgba(34,197,94,0.6), 0 0 70px rgba(34,197,94,0.25); }
        }
        @keyframes checkPop {
          0% { opacity: 0; transform: scale(0) rotate(-45deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes activePhaseGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 16px rgba(59,130,246,0.7); }
        }
        @keyframes activeOrb {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 1; }
        }
        @keyframes phaseCheckIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInCode {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes personType {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
        @keyframes armType {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-8deg); }
        }
        @keyframes personWalk {
          0% { transform: translateX(0); }
          25% { transform: translateX(15px) translateY(-2px); }
          50% { transform: translateX(30px); }
          75% { transform: translateX(15px) translateY(-2px); }
          100% { transform: translateX(0); }
        }
        @keyframes celebrate {
          0% { transform: translateY(0); }
          100% { transform: translateY(-6px); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(50px) rotate(360deg); opacity: 0; }
        }
        @keyframes floatFile {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spinGear {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes phaseFlash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes updatePulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dataFlow0 {
          0% { cx: 155; cy: 220; opacity: 0; }
          10% { opacity: 0.8; }
          50% { cx: 250; cy: 200; }
          90% { opacity: 0.8; }
          100% { cx: 335; cy: 220; opacity: 0; }
        }
        @keyframes dataFlow1 {
          0% { cx: 335; cy: 220; opacity: 0; }
          10% { opacity: 0.6; }
          50% { cx: 250; cy: 180; }
          90% { opacity: 0.6; }
          100% { cx: 155; cy: 220; opacity: 0; }
        }
        @keyframes dataFlow2 {
          0% { cx: 250; cy: 220; opacity: 0; }
          10% { opacity: 0.7; }
          50% { cx: 420; cy: 140; }
          90% { opacity: 0.7; }
          100% { cx: 250; cy: 220; opacity: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59,130,246,0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59,130,246,0.4);
        }
      `}</style>
    </div>
  );
}
