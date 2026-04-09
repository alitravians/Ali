import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface RepairTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  problemDescription: string;
  pagePath: string;
}

// Repair phases with team activities
const REPAIR_PHASES = [
  {
    label: 'استلام البلاغ',
    detail: 'الفريق التقني استلم بلاغك وبدأ العمل',
    teamAction: 'المهندس الرئيسي يراجع تفاصيل البلاغ...',
    logs: ['> تم استلام البلاغ الجديد', '> جاري توزيع المهام على الفريق...'],
  },
  {
    label: 'تحليل المشكلة',
    detail: 'الفريق يفحص سجلات النظام والأخطاء',
    teamAction: 'فريق التحليل يفحص سجلات الخادم...',
    logs: ['> connecting to production server...', '> fetching error logs from /var/log/warscope/', '> analyzing stack trace...', '> found 3 potential root causes'],
  },
  {
    label: 'فحص الكود',
    detail: 'المبرمجون يتتبعون مصدر المشكلة',
    teamAction: 'المبرمجون يفحصون الملفات المصدرية...',
    logs: ['> scanning source files...', '> diff: src/components/map/LiveMap.tsx', '> diff: src/styles/index.css', '> identified: root cause located'],
  },
  {
    label: 'كتابة الإصلاح',
    detail: 'المبرمج يكتب الحل البرمجي',
    teamAction: 'كتابة وتطبيق الحل البرمجي...',
    logs: ['> generating fix patch...', '> applying hotfix to renderer...', '> code review: approved ✓'],
  },
  {
    label: 'اختبار الحل',
    detail: 'فريق الاختبار يتحقق من الإصلاح',
    teamAction: 'فريق الجودة يختبر الإصلاح...',
    logs: ['> running unit tests... 47/47 passed', '> running integration tests... 12/12 passed', '> security scan: no vulnerabilities'],
  },
  {
    label: 'نشر التحديث',
    detail: 'جاري رفع الإصلاح على الخادم',
    teamAction: 'نشر التحديث على خوادم الإنتاج...',
    logs: ['> building production bundle...', '> deploying to cdn-edge-nodes...', '> cache invalidation: complete'],
  },
  {
    label: 'تم الحل!',
    detail: 'تم حل المشكلة بنجاح وتحديث الموقع',
    teamAction: 'الفريق يحتفل بنجاح الإصلاح!',
    logs: ['> health check: all systems operational', '> fix verified successfully ✓'],
  },
];

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
      {/* Shadow */}
      <ellipse cx="0" cy="42" rx="10" ry="4" fill="rgba(0,0,0,0.3)" />
      {/* Body */}
      <rect x="-7" y="15" width="14" height="20" rx="3" fill={color} />
      {/* Arms */}
      <rect x="-12" y="17" width="6" height="3" rx="1.5" fill={color} style={{
        transformOrigin: '-7px 18px',
        animation: typing ? `armType 0.3s ease-in-out infinite alternate ${delay}s` : 'none',
      }} />
      <rect x="6" y="17" width="6" height="3" rx="1.5" fill={color} style={{
        transformOrigin: '7px 18px',
        animation: typing ? `armType 0.3s ease-in-out infinite alternate-reverse ${delay + 0.15}s` : 'none',
      }} />
      {/* Head */}
      <circle cx="0" cy="10" r="8" fill="#f4c7a3" />
      {/* Hair */}
      <ellipse cx="0" cy="5" rx="8" ry="5" fill={hairColor} />
      {/* Eyes */}
      <circle cx="-3" cy="10" r="1.2" fill="#1a1a2e" />
      <circle cx="3" cy="10" r="1.2" fill="#1a1a2e" />
      {/* Mouth */}
      {celebrating ? (
        <path d="M-3,14 Q0,17 3,14" stroke="#c0392b" strokeWidth="1" fill="none" />
      ) : (
        <line x1="-2" y1="14" x2="2" y2="14" stroke="#c0392b" strokeWidth="0.8" />
      )}
      {/* Legs */}
      <rect x="-6" y="35" width="5" height="8" rx="2" fill="#2c3e50" />
      <rect x="1" y="35" width="5" height="8" rx="2" fill="#2c3e50" />
      {/* Shoes */}
      <rect x="-7" y="41" width="6" height="3" rx="1.5" fill="#1a1a2e" />
      <rect x="1" y="41" width="6" height="3" rx="1.5" fill="#1a1a2e" />
    </g>
  );
}

/* ─── Isometric desk with monitor ─── */
function IsoDesk({ x, y, screenGlow, codeLines }: { x: number; y: number; screenGlow: boolean; codeLines?: string[] }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Desk surface - isometric */}
      <path d="M-35,0 L0,-12 L35,0 L0,12 Z" fill="#5d4e37" stroke="#4a3f2e" strokeWidth="1" />
      {/* Desk front */}
      <path d="M-35,0 L-35,5 L0,17 L0,12 Z" fill="#4a3f2e" />
      <path d="M35,0 L35,5 L0,17 L0,12 Z" fill="#3d3425" />
      {/* Monitor stand */}
      <rect x="-2" y="-8" width="4" height="8" fill="#555" />
      <rect x="-5" y="-4" width="10" height="3" rx="1" fill="#444" />
      {/* Monitor */}
      <rect x="-16" y="-32" width="32" height="24" rx="2" fill="#1a1a2e" stroke="#333" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="-14" y="-30" width="28" height="20" rx="1" fill={screenGlow ? '#0a1628' : '#111'}>
        {screenGlow && (
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
        )}
      </rect>
      {/* Screen content - code lines */}
      {screenGlow && codeLines && codeLines.map((line, i) => (
        <text key={i} x="-12" y={-26 + i * 4} fill={
          line.includes('✓') || line.includes('pass') ? '#34d399'
          : line.includes('err') || line.includes('fail') ? '#f87171'
          : line.includes('>') ? '#60a5fa'
          : '#94a3b8'
        } fontSize="2.5" fontFamily="monospace" style={{
          animation: `fadeInCode 0.3s ease-out ${i * 0.2}s both`,
        }}>{line.slice(0, 18)}</text>
      ))}
      {/* Screen glow effect */}
      {screenGlow && (
        <rect x="-14" y="-30" width="28" height="20" rx="1" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4">
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite" />
        </rect>
      )}
      {/* Keyboard */}
      <path d="M-10,2 L0,-2 L10,2 L0,6 Z" fill="#333" stroke="#444" strokeWidth="0.5" />
      {/* Coffee mug */}
      <circle cx="18" cy="-2" r="3" fill="#8b4513" />
      <circle cx="18" cy="-2" r="2" fill="#3d1f00" />
    </g>
  );
}

/* ─── Server rack ─── */
function ServerRack({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Rack body */}
      <rect x="-12" y="-50" width="24" height="50" rx="2" fill="#1a1a2e" stroke="#2d2d4e" strokeWidth="1" />
      {/* Server units */}
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <rect x="-10" y={-46 + i * 9} width="20" height="7" rx="1" fill="#0f172a" stroke="#2d2d4e" strokeWidth="0.5" />
          {/* LED lights */}
          <circle cx="-6" cy={-42.5 + i * 9} r="1" fill={active ? '#22c55e' : '#666'}>
            {active && <animate attributeName="opacity" values="0.5;1;0.5" dur={`${0.5 + i * 0.2}s`} repeatCount="indefinite" />}
          </circle>
          <circle cx="-2" cy={-42.5 + i * 9} r="1" fill={active ? '#3b82f6' : '#444'}>
            {active && <animate attributeName="opacity" values="1;0.3;1" dur={`${0.3 + i * 0.1}s`} repeatCount="indefinite" />}
          </circle>
          {/* Ventilation lines */}
          {[0, 1, 2].map(j => (
            <line key={j} x1={3 + j * 3} y1={-44 + i * 9} x2={3 + j * 3} y2={-41 + i * 9} stroke="#2d2d4e" strokeWidth="0.5" />
          ))}
        </g>
      ))}
    </g>
  );
}

/* ─── Whiteboard ─── */
function Whiteboard({ x, y, phase }: { x: number; y: number; phase: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Board */}
      <rect x="-25" y="-35" width="50" height="35" rx="2" fill="#e8e8e8" stroke="#bbb" strokeWidth="1.5" />
      {/* Content based on phase */}
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

export default function RepairTracker3D({ isOpen, onClose, problemDescription, pagePath }: RepairTrackerProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, []);

  // Main animation loop
  useEffect(() => {
    if (!isOpen) return;

    setCurrentPhase(0);
    setProgress(0);
    setLogLines([]);
    setIsComplete(false);
    setStatusMsg(REPAIR_PHASES[0].teamAction);

    let phaseIdx = 0;
    let prog = 0;

    // Phase advancement
    const phaseTimer = setInterval(() => {
      if (phaseIdx < REPAIR_PHASES.length - 1) {
        phaseIdx++;
        setCurrentPhase(phaseIdx);
        setStatusMsg(REPAIR_PHASES[phaseIdx].teamAction);

        // Add logs for this phase
        const phaseLogs = REPAIR_PHASES[phaseIdx].logs;
        phaseLogs.forEach((log, i) => {
          setTimeout(() => {
            setLogLines(prev => [...prev, log]);
            scrollToBottom();
          }, i * 800);
        });
      } else {
        setIsComplete(true);
        setStatusMsg('تم حل المشكلة بنجاح! يمكنك إغلاق هذه النافذة');
        clearInterval(phaseTimer);
      }
    }, 3500);

    // Progress advancement
    const progTimer = setInterval(() => {
      if (prog < 100) {
        prog += 0.8 + Math.random() * 0.5;
        setProgress(Math.min(prog, 100));
      }
    }, 150);

    // Initial logs
    REPAIR_PHASES[0].logs.forEach((log, i) => {
      setTimeout(() => {
        setLogLines(prev => [...prev, log]);
        scrollToBottom();
      }, 500 + i * 800);
    });

    return () => {
      clearInterval(phaseTimer);
      clearInterval(progTimer);
    };
  }, [isOpen, scrollToBottom]);

  if (!isOpen) return null;

  const currentLogs = REPAIR_PHASES.slice(0, currentPhase + 1).flatMap(p => p.logs);

  return (
    <div className="fixed inset-0 z-[10001] overflow-hidden" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1321 40%, #111827 100%)',
      }}>
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Main layout */}
      <div className="relative w-full h-full flex flex-col">

        {/* Top bar */}
        <div className="shrink-0 px-4 md:px-6 py-3 flex items-center gap-3 border-b border-white/5 backdrop-blur-sm" style={{
          background: 'rgba(10, 14, 26, 0.8)',
        }}>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{
              background: isComplete ? '#22c55e' : '#ef4444',
              boxShadow: isComplete ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
            }} />
            <h2 className="text-sm md:text-base font-black text-transparent bg-clip-text" style={{
              backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            }}>
              مركز الإصلاح التقني — WarScope
            </h2>
          </div>
          <span className="text-[9px] text-gray-600 font-mono mr-auto hidden md:block" dir="ltr">TECHNICAL REPAIR CENTER</span>
          {isComplete && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Problem banner */}
        <div className="shrink-0 mx-4 md:mx-6 mt-3 px-4 py-2.5 rounded-xl border" style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))',
          borderColor: 'rgba(239,68,68,0.15)',
        }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] text-red-400/80 font-bold">المشكلة:</span>
            <span className="text-xs text-gray-300 flex-1 truncate">{problemDescription}</span>
            <span className="text-[9px] text-gray-600 font-mono" dir="ltr">{pagePath}</span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 p-4 md:p-6 min-h-0 overflow-hidden">

          {/* === LEFT: 3D Office Scene === */}
          <div className="flex-1 rounded-2xl border overflow-hidden relative" style={{
            background: 'linear-gradient(180deg, #0c1222, #0a0f1c)',
            borderColor: 'rgba(59,130,246,0.1)',
            minHeight: '280px',
          }}>
            {/* Scene label */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] text-green-400/80">البث المباشر — غرفة العمليات</span>
            </div>

            {/* SVG 3D Isometric Office Scene */}
            <svg viewBox="0 0 500 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              <defs>
                {/* Floor gradient */}
                <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#141e30" />
                  <stop offset="100%" stopColor="#0f1724" />
                </linearGradient>
                {/* Screen glow filter */}
                <filter id="screenGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Ambient light */}
                <radialGradient id="ambientLight" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.06)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* Floor */}
              <rect x="0" y="0" width="500" height="320" fill="url(#floorGrad)" />
              <rect x="0" y="0" width="500" height="320" fill="url(#ambientLight)" />

              {/* Floor grid lines (isometric) */}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={180 + i * 20} x2="500" y2={180 + i * 20}
                  stroke="rgba(59,130,246,0.04)" strokeWidth="0.5" />
              ))}

              {/* === Background: Server racks === */}
              <ServerRack x={420} y={140} active={currentPhase >= 1} />
              <ServerRack x={455} y={140} active={currentPhase >= 5} />

              {/* === Whiteboard === */}
              <Whiteboard x={80} y={100} phase={currentPhase} />

              {/* === Desk 1: Lead Engineer (center) === */}
              <IsoDesk x={250} y={220} screenGlow={currentPhase >= 0} codeLines={currentLogs.slice(-5)} />
              <IsoPerson
                color="#3b82f6" x={250} y={172}
                typing={currentPhase >= 1 && currentPhase <= 5 && !isComplete}
                celebrating={isComplete}
                delay={0}
              />

              {/* === Desk 2: Frontend Dev (left) === */}
              <IsoDesk x={120} y={240} screenGlow={currentPhase >= 2} codeLines={
                currentPhase >= 2 ? ['> scanning CSS...', '> fix: tile size', '> override applied', '> testing...', currentPhase >= 4 ? '> passed ✓' : '> running...'] : undefined
              } />
              <IsoPerson
                color="#8b5cf6" x={120} y={192}
                typing={currentPhase >= 2 && currentPhase <= 4 && !isComplete}
                celebrating={isComplete}
                delay={0.2}
              />

              {/* === Desk 3: Backend Dev (right) === */}
              <IsoDesk x={370} y={240} screenGlow={currentPhase >= 1} codeLines={
                currentPhase >= 1 ? ['> server logs...', '> API check...', '> endpoint OK', '> cache clear', currentPhase >= 5 ? '> deployed ✓' : '> monitoring...'] : undefined
              } />
              <IsoPerson
                color="#22c55e" x={370} y={192}
                typing={currentPhase >= 1 && currentPhase <= 5 && !isComplete}
                celebrating={isComplete}
                delay={0.4}
              />

              {/* === Walking person (QA Tester) - walks between desks === */}
              {currentPhase >= 3 && currentPhase <= 5 && !isComplete && (
                <IsoPerson
                  color="#f59e0b" x={200} y={260}
                  walking={true}
                  scale={0.85}
                  delay={0.1}
                />
              )}

              {/* === Person at whiteboard (Tech Lead) === */}
              {currentPhase <= 2 && !isComplete && (
                <IsoPerson
                  color="#ef4444" x={80} y={138}
                  scale={0.8}
                  delay={0.3}
                />
              )}

              {/* === Celebration confetti === */}
              {isComplete && Array.from({ length: 20 }).map((_, i) => (
                <circle
                  key={`confetti-${i}`}
                  cx={100 + Math.random() * 300}
                  cy={80 + Math.random() * 150}
                  r={1.5 + Math.random() * 2}
                  fill={['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#ec4899'][i % 6]}
                  style={{
                    animation: `confettiFall ${1 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s infinite`,
                  }}
                />
              ))}

              {/* === Status text overlay === */}
              <rect x="140" y="285" width="220" height="24" rx="12" fill="rgba(0,0,0,0.6)" stroke="rgba(59,130,246,0.2)" strokeWidth="0.5" />
              <text x="250" y="301" textAnchor="middle" fill={isComplete ? '#34d399' : '#94a3b8'} fontSize="8" fontFamily="sans-serif" fontWeight="bold"
                style={{ direction: 'rtl' }}>
                {statusMsg}
              </text>

              {/* Connecting data lines between desks (animated) */}
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
            </svg>
          </div>

          {/* === RIGHT: Progress + Terminal === */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-3 min-h-0">

            {/* Repair phases */}
            <div className="rounded-xl border overflow-hidden" style={{
              background: 'rgba(15,23,42,0.8)',
              borderColor: 'rgba(59,130,246,0.1)',
            }}>
              <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                <span className="text-[10px] font-bold text-white">مراحل الإصلاح</span>
                <span className="text-[9px] text-gray-600 font-mono mr-auto">{Math.min(currentPhase + 1, REPAIR_PHASES.length)}/{REPAIR_PHASES.length}</span>
              </div>
              <div className="p-2 space-y-0.5 max-h-[200px] overflow-y-auto">
                {REPAIR_PHASES.map((phase, idx) => {
                  const isActive = idx === currentPhase;
                  const isDone = idx < currentPhase || isComplete;
                  const isPending = idx > currentPhase && !isComplete;
                  return (
                    <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-500" style={{
                      background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                      opacity: isPending ? 0.3 : 1,
                    }}>
                      <div className="shrink-0">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          </div>
                        ) : isActive ? (
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center" style={{ animation: 'pulseGlow 1.5s infinite' }}>
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
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

            {/* Terminal */}
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
                <span className="text-[9px] text-gray-600 font-mono mr-1">terminal</span>
                <div className="mr-auto flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] text-green-500/60">LIVE</span>
                </div>
              </div>
              <div ref={logRef} className="p-2.5 overflow-y-auto font-mono text-[9px] md:text-[10px] leading-relaxed space-y-0.5" dir="ltr" style={{ maxHeight: '200px' }}>
                <div className="text-blue-500/40">// WarScope Repair System v2.1</div>
                {logLines.map((line, idx) => (
                  <div key={idx} className="flex gap-1.5" style={{ animation: 'typeIn 0.3s ease-out' }}>
                    <span className="text-gray-700 select-none shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                    <span className={
                      line.includes('✓') || line.includes('pass') || line.includes('complete') || line.includes('OK')
                        ? 'text-green-400'
                        : line.includes('found') || line.includes('identified') || line.includes('located')
                        ? 'text-yellow-400'
                        : 'text-gray-400'
                    }>{line}</span>
                  </div>
                ))}
                {!isComplete && (
                  <div className="flex gap-1.5">
                    <span className="text-gray-700">{String(logLines.length + 1).padStart(2, '0')}</span>
                    <span className="text-blue-400 animate-pulse">▋</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="shrink-0 px-4 md:px-6 pb-4">
          <div className="relative h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(59,130,246,0.08)' }}>
            <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-300" style={{
              width: `${isComplete ? 100 : progress}%`,
              background: isComplete ? 'linear-gradient(90deg, #22c55e, #34d399)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
              backgroundSize: '200% 100%',
              animation: isComplete ? 'none' : 'shimmerBar 2s linear infinite',
            }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">
              {isComplete ? 'اكتمل الإصلاح بنجاح!' : REPAIR_PHASES[currentPhase]?.label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: isComplete ? '#34d399' : '#60a5fa' }}>
              {Math.round(isComplete ? 100 : progress)}%
            </span>
          </div>

          {/* Completion card */}
          {isComplete && (
            <div className="mt-3 px-5 py-4 rounded-xl border text-center" style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))',
              borderColor: 'rgba(34,197,94,0.25)',
              animation: 'fadeInScale 0.5s ease-out',
            }}>
              <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{
                background: 'rgba(34,197,94,0.15)',
              }}>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-sm font-bold text-green-400 mb-1">تم حل المشكلة بنجاح!</h3>
              <p className="text-[11px] text-gray-400 mb-3">تم تطبيق الإصلاح ونشر التحديث — يمكنك إغلاق هذه النافذة</p>
              <button onClick={onClose} className="px-6 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105" style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              }}>
                إغلاق النافذة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes shimmerBar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes typeIn {
          0% { opacity: 0; transform: translateX(-5px); }
          100% { opacity: 1; transform: translateX(0); }
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
      `}</style>
    </div>
  );
}
