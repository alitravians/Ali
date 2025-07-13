import './App.css'
import { useEffect, useState, useRef } from 'react'

function App() {
  const [hackingPhase, setHackingPhase] = useState<'scanning' | 'breach' | 'infiltration' | 'control' | 'destruction'>('scanning')
  const [systemCompromise, setSystemCompromise] = useState(0)
  
  const [digitalRain, setDigitalRain] = useState<Array<{
    id: number
    text: string
    x: number
    y: number
    speed: number
    opacity: number
    color: string
  }>>([])
  
  const [hackingLogs, setHackingLogs] = useState<Array<{
    id: number
    timestamp: string
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FATAL'
    module: string
    message: string
    messageAr: string
    color: string
  }>>([])
  
  const [screenEffects, setScreenEffects] = useState<{
    glitch: boolean
    scanlines: boolean
    distortion: number
    corruption: number
    intensity: number
  }>({
    glitch: false,
    scanlines: true,
    distortion: 0,
    corruption: 0,
    intensity: 0
  })
  
  const [audioSystem, setAudioSystem] = useState<{
    initialized: boolean
    playing: boolean
    volume: number
    files: string[]
    currentTrack: number
    error: string | null
  }>({
    initialized: false,
    playing: false,
    volume: 0.95,
    files: ['Jumpscare_Horror_Sound_Effects_01.mp3', 'Jumpscare_Horror_Sound_Effects_05.mp3', 'Jumpscare_Horror_Sound_Effects_09.mp3'],
    currentTrack: 0,
    error: null
  })
  
  const audioRefs = useRef<HTMLAudioElement[]>([])

  const hackingPhases = {
    scanning: {
      title: 'NETWORK SCANNING',
      titleAr: 'فحص الشبكة',
      description: 'IDENTIFYING VULNERABILITIES',
      descriptionAr: 'تحديد نقاط الضعف',
      status: 'PROBING SYSTEM DEFENSES',
      statusAr: 'استطلاع دفاعات النظام',
      color: '#00ff00',
      progress: 15,
      threat: 'LOW'
    },
    breach: {
      title: 'SECURITY BREACH',
      titleAr: 'خرق أمني',
      description: 'EXPLOITING VULNERABILITIES',
      descriptionAr: 'استغلال نقاط الضعف',
      status: 'BYPASSING FIREWALLS',
      statusAr: 'تجاوز جدران الحماية',
      color: '#ffff00',
      progress: 35,
      threat: 'MEDIUM'
    },
    infiltration: {
      title: 'SYSTEM INFILTRATION',
      titleAr: 'تسلل النظام',
      description: 'GAINING ROOT ACCESS',
      descriptionAr: 'الحصول على صلاحيات الجذر',
      status: 'ESCALATING PRIVILEGES',
      statusAr: 'تصعيد الصلاحيات',
      color: '#ff8800',
      progress: 65,
      threat: 'HIGH'
    },
    control: {
      title: 'SYSTEM CONTROL',
      titleAr: 'السيطرة على النظام',
      description: 'COMPLETE SYSTEM TAKEOVER',
      descriptionAr: 'الاستيلاء الكامل على النظام',
      status: 'INSTALLING BACKDOORS',
      statusAr: 'تثبيت الأبواب الخلفية',
      color: '#ff4400',
      progress: 85,
      threat: 'CRITICAL'
    },
    destruction: {
      title: 'DATA DESTRUCTION',
      titleAr: 'تدمير البيانات',
      description: 'WIPING ALL SYSTEMS',
      descriptionAr: 'مسح جميع الأنظمة',
      status: 'TOTAL SYSTEM FAILURE',
      statusAr: 'فشل النظام الكامل',
      color: '#ff0000',
      progress: 100,
      threat: 'FATAL'
    }
  }

  const cyberAttacks = [
    { 
      en: 'SQL INJECTION: Database compromised, all data exposed',
      ar: 'حقن SQL: قاعدة البيانات مخترقة، جميع البيانات مكشوفة',
      severity: 'CRITICAL' as const,
      module: 'DATABASE'
    },
    {
      en: 'RANSOMWARE DEPLOYED: All files encrypted, system locked',
      ar: 'نشر برامج الفدية: جميع الملفات مشفرة، النظام مقفل',
      severity: 'FATAL' as const,
      module: 'FILESYSTEM'
    },
    {
      en: 'DDOS ATTACK: Server overwhelmed, services unavailable',
      ar: 'هجوم حجب الخدمة: الخادم مثقل، الخدمات غير متاحة',
      severity: 'ERROR' as const,
      module: 'NETWORK'
    },
    {
      en: 'PRIVILEGE ESCALATION: Root access obtained illegally',
      ar: 'تصعيد الصلاحيات: الحصول على صلاحيات الجذر بطريقة غير قانونية',
      severity: 'CRITICAL' as const,
      module: 'SECURITY'
    },
    {
      en: 'MALWARE INJECTION: Trojan horse installed successfully',
      ar: 'حقن البرامج الضارة: تم تثبيت حصان طروادة بنجاح',
      severity: 'WARNING' as const,
      module: 'ANTIVIRUS'
    },
    {
      en: 'DATA EXFILTRATION: Sensitive information stolen',
      ar: 'سرقة البيانات: تم سرق المعلومات الحساسة',
      severity: 'FATAL' as const,
      module: 'PRIVACY'
    },
    {
      en: 'SYSTEM WIPE: All data permanently destroyed',
      ar: 'مسح النظام: تم تدمير جميع البيانات نهائياً',
      severity: 'FATAL' as const,
      module: 'STORAGE'
    }
  ]

  useEffect(() => {
    const phaseProgression = [
      { phase: 'breach', delay: 3000, progress: 35 },
      { phase: 'infiltration', delay: 7500, progress: 65 },
      { phase: 'control', delay: 15000, progress: 85 },
      { phase: 'destruction', delay: 25000, progress: 100 }
    ]

    const timers = phaseProgression.map(({ phase, delay, progress }) =>
      setTimeout(() => {
        setHackingPhase(phase as any)
        setSystemCompromise(progress)
      }, delay)
    )

    const digitalRainSystem = setInterval(() => {
      setDigitalRain(prev => {
        const updated = prev.map(drop => ({
          ...drop,
          y: drop.y + drop.speed,
          opacity: drop.y > window.innerHeight ? Math.max(0, drop.opacity - 0.05) : drop.opacity
        })).filter(drop => drop.y < window.innerHeight + 100 && drop.opacity > 0)

        while (updated.length < 120) {
          const hackingChars = ['0', '1', 'A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'Z']
          const arabicChars = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي']
          const hackSymbols = ['$', '#', '@', '&', '*', '%', '!', '?', '<', '>', '|', '\\', '/', '-', '_', '+', '=', '~', '^']
          
          const allChars = [...hackingChars, ...arabicChars, ...hackSymbols]
          const text = Array.from({length: 12}, () => allChars[Math.floor(Math.random() * allChars.length)]).join('')
          const colors = ['#00ff00', '#00ff41', '#00aa00', '#008800', '#ffffff', '#ffff00', '#ff0000']
          
          updated.push({
            id: Math.random(),
            text,
            x: Math.random() * window.innerWidth,
            y: -50,
            speed: 1.5 + Math.random() * 3,
            opacity: 0.3 + Math.random() * 0.7,
            color: colors[Math.floor(Math.random() * colors.length)]
          })
        }
        return updated
      })
    }, 120)

    const effectsSystem = setInterval(() => {
      setScreenEffects(prev => ({
        glitch: Math.random() > 0.7,
        scanlines: true,
        distortion: systemCompromise * 0.02 + Math.random() * 0.15,
        corruption: systemCompromise * 0.025 + Math.random() * 0.2,
        intensity: Math.min(prev.intensity + 0.02, systemCompromise * 0.02)
      }))
    }, 500)

    const logSystem = setInterval(() => {
      const levels = ['INFO', 'WARNING', 'ERROR', 'CRITICAL', 'FATAL'] as const
      const levelColors = {
        'INFO': '#00ff00',
        'WARNING': '#ffff00',
        'ERROR': '#ff8800',
        'CRITICAL': '#ff4400',
        'FATAL': '#ff0000'
      }
      
      const attack = cyberAttacks[Math.floor(Math.random() * cyberAttacks.length)]
      const level = levels[Math.min(Math.floor(Math.random() * levels.length), Math.floor(systemCompromise / 20))]
      
      const log = {
        id: Math.random(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        level,
        module: attack.module,
        message: attack.en,
        messageAr: attack.ar,
        color: levelColors[level]
      }
      
      setHackingLogs(prev => [...prev.slice(-12), log])
    }, 1000 + Math.random() * 800)

    const screenDistortionSystem = setInterval(() => {
      if (systemCompromise > 30) {
        const body = document.body
        if (body) {
          const intensity = systemCompromise * 0.02
          const glitchEffects = [
            `hue-rotate(${Math.random() * 180}deg) contrast(${1.2 + Math.random() * 0.8}) brightness(${0.5 + Math.random() * 1.0}) saturate(${1.5 + Math.random() * 1.5})`,
            `blur(${Math.random() * 2}px) invert(${Math.random() * 0.5}) sepia(${Math.random() * 0.6}) drop-shadow(0 0 15px #00ff00)`,
            `grayscale(${Math.random() * 0.6}) opacity(${0.7 + Math.random() * 0.3}) brightness(${0.4 + Math.random() * 1.2})`
          ]
          body.style.filter = glitchEffects[Math.floor(Math.random() * glitchEffects.length)]
          body.style.transform = `translate(${(Math.random() - 0.5) * intensity * 30}px, ${(Math.random() - 0.5) * intensity * 30}px) rotate(${(Math.random() - 0.5) * 2}deg)`
          
          setTimeout(() => {
            body.style.filter = 'none'
            body.style.transform = 'none'
          }, 100 + Math.random() * 200)
        }
      }
    }, 800 + Math.random() * 1200)

    return () => {
      timers.forEach(timer => clearTimeout(timer))
      clearInterval(digitalRainSystem)
      clearInterval(effectsSystem)
      clearInterval(logSystem)
      clearInterval(screenDistortionSystem)
    }
  }, [systemCompromise])

  useEffect(() => {
    const initializeAudioSystem = async () => {
      if (audioSystem.initialized) return

      try {
        const handleUserInteraction = async () => {
          if (!audioSystem.initialized) {
            try {
              const audioFiles = audioSystem.files.map(file => {
                const audio = new Audio(`/${file}`)
                audio.volume = audioSystem.volume
                audio.preload = 'auto'
                return audio
              })

              audioRefs.current = audioFiles

              const playRandomAudio = () => {
                const randomIndex = Math.floor(Math.random() * audioFiles.length)
                const audio = audioFiles[randomIndex]
                audio.currentTime = 0
                audio.play().then(() => {
                  setTimeout(() => {
                    audio.pause()
                    audio.currentTime = 0
                  }, 20000) // 20 seconds
                }).catch(console.error)
              }

              playRandomAudio()

              const audioInterval = setInterval(() => {
                playRandomAudio()
              }, 25000) // Every 25 seconds

              setAudioSystem(prev => ({
                ...prev,
                initialized: true,
                playing: true,
                currentTrack: 0,
                error: null
              }))

              document.removeEventListener('click', handleUserInteraction)
              document.removeEventListener('keydown', handleUserInteraction)
              document.removeEventListener('touchstart', handleUserInteraction)

              return () => clearInterval(audioInterval)
            } catch (error) {
              setAudioSystem(prev => ({ ...prev, error: `Audio system failed: ${(error as Error).message}` }))
            }
          }
        }

        document.addEventListener('click', handleUserInteraction)
        document.addEventListener('keydown', handleUserInteraction)
        document.addEventListener('touchstart', handleUserInteraction)
        
        setTimeout(handleUserInteraction, 1500)
      } catch (error) {
        setAudioSystem(prev => ({ ...prev, error: `Audio initialization failed: ${(error as Error).message}` }))
      }
    }

    const audioTimeout = setTimeout(initializeAudioSystem, 1000)
    return () => clearTimeout(audioTimeout)
  }, [audioSystem.initialized])

  const currentPhase = hackingPhases[hackingPhase]

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(0, 255, 0, ${0.15 + screenEffects.intensity * 0.3}) 0%, transparent 70%),
          radial-gradient(circle at 80% 70%, rgba(0, 255, 65, ${0.12 + screenEffects.intensity * 0.25}) 0%, transparent 60%),
          radial-gradient(circle at 50% 10%, rgba(255, 0, 0, ${0.1 + screenEffects.intensity * 0.2}) 0%, transparent 50%),
          radial-gradient(circle at 10% 90%, rgba(255, 255, 0, ${0.08 + screenEffects.intensity * 0.15}) 0%, transparent 55%),
          linear-gradient(135deg, #000000 0%, #001100 15%, #002200 30%, #001100 45%, #000000 60%, #110000 75%, #000000 90%, #000000 100%)
        `,
        filter: `
          contrast(${1.3 + screenEffects.corruption}) 
          brightness(${0.7 + screenEffects.distortion}) 
          saturate(${1.8 + screenEffects.intensity * 1.2}) 
          hue-rotate(${screenEffects.intensity * 90}deg)
          ${screenEffects.glitch ? 'blur(0.8px) drop-shadow(0 0 15px #00ff00)' : ''}
        `,
        transform: `
          scale(${1 + screenEffects.intensity * 0.025}) 
          rotate(${screenEffects.distortion * 0.5}deg)
          translate(${screenEffects.distortion * 2}px, ${screenEffects.distortion * 1.5}px)
        `,
        fontFamily: 'Courier New, monospace'
      }}
    >
      {/* Digital Rain Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-80">
        {digitalRain.map((drop) => (
          <div
            key={drop.id}
            className="absolute font-mono font-bold select-none"
            style={{
              left: `${drop.x}px`,
              top: `${drop.y}px`,
              color: drop.color,
              opacity: drop.opacity,
              fontSize: `${12 + Math.random() * 8}px`,
              textShadow: `
                0 0 10px currentColor, 
                0 0 20px currentColor,
                0 0 30px currentColor
              `,
              transform: `rotate(${Math.random() * 10}deg)`,
              animation: `digital-fall ${2 + Math.random() * 3}s linear infinite`
            }}
          >
            {drop.text}
          </div>
        ))}
      </div>

      {/* Scanlines Effect */}
      {screenEffects.scanlines && (
        <div className="absolute inset-0 pointer-events-none z-5">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-green-500"
              style={{
                top: `${i * 1.67}%`,
                opacity: 0.1 + Math.random() * 0.2,
                animation: `scan-line ${1.5 + Math.random() * 2}s linear infinite`,
                animationDelay: `${i * 0.03}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Glitch Overlay */}
      {screenEffects.glitch && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${60 + Math.random() * 200}px`,
                height: `${2 + Math.random() * 4}px`,
                background: `linear-gradient(90deg, 
                  rgba(0, 255, 0, ${screenEffects.intensity * 1.2}) 0%,
                  rgba(0, 255, 65, ${screenEffects.intensity * 1.0}) 30%,
                  rgba(255, 255, 0, ${screenEffects.intensity * 0.8}) 60%,
                  rgba(255, 0, 0, ${screenEffects.intensity * 0.6}) 100%)`,
                opacity: screenEffects.intensity * 1.5,
                animation: `glitch-flicker ${0.1 + Math.random() * 0.3}s infinite`,
                animationDelay: `${Math.random() * 3}s`,
                transform: `
                  skew(${screenEffects.intensity * 40}deg) 
                  rotate(${screenEffects.intensity * 20}deg)
                  scaleX(${0.3 + Math.random() * 2})
                `,
                filter: `blur(${screenEffects.intensity * 2}px)`
              }}
            />
          ))}
        </div>
      )}

      {/* Cyber Attack Status Dashboard */}
      <div className="absolute top-6 left-6 right-6 z-30">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Hacking Phase */}
          <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-xl border-2 border-green-500/70 rounded-2xl p-6 shadow-2xl">
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">HACKING PHASE</div>
            <div className="text-xl font-bold mb-3" style={{ color: currentPhase.color }}>{currentPhase.title}</div>
            <div className="text-gray-300 text-base" dir="rtl">{currentPhase.titleAr}</div>
          </div>

          {/* System Compromise */}
          <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 backdrop-blur-xl border-2 border-red-500/70 rounded-2xl p-6 shadow-2xl">
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">COMPROMISE</div>
            <div className="text-red-400 text-3xl font-bold mb-3">{Math.floor(systemCompromise)}%</div>
            <div className="w-full bg-gray-800 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-red-600 to-red-400 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${systemCompromise}%` }}
              />
            </div>
          </div>

          {/* Screen Effects */}
          <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/40 backdrop-blur-xl border-2 border-yellow-500/70 rounded-2xl p-6 shadow-2xl">
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">SCREEN EFFECTS</div>
            <div className="text-yellow-400 text-3xl font-bold mb-3">{Math.floor(screenEffects.intensity * 100)}/100</div>
            <div className="text-yellow-300 text-base" dir="rtl">تأثيرات الشاشة</div>
          </div>

          {/* Threat Level */}
          <div className="bg-gradient-to-br from-red-800/60 to-black/60 backdrop-blur-xl border-2 border-red-400/80 rounded-2xl p-6 shadow-2xl">
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">THREAT LEVEL</div>
            <div className="text-red-500 text-xl font-bold mb-3">{currentPhase.threat}</div>
            <div className="text-red-300 text-base" dir="rtl">
              {currentPhase.threat === 'FATAL' ? 'قاتل' : currentPhase.threat === 'CRITICAL' ? 'حرج' : currentPhase.threat === 'HIGH' ? 'عالي' : currentPhase.threat === 'MEDIUM' ? 'متوسط' : 'منخفض'}
            </div>
          </div>

          {/* Audio System */}
          <div className="bg-gradient-to-br from-purple-900/50 to-violet-800/40 backdrop-blur-xl border-2 border-purple-500/70 rounded-2xl p-6 shadow-2xl">
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">HORROR AUDIO</div>
            <div className="text-purple-400 text-xl font-bold mb-3">{audioSystem.playing ? 'ACTIVE' : 'STANDBY'}</div>
            <div className="text-purple-300 text-base" dir="rtl">نظام الصوت المرعب</div>
          </div>
        </div>
      </div>

      {/* Central Cyber Attack Display */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="text-center max-w-6xl mx-auto px-10">
          {/* Cyber Attack Indicator */}
          <div className="relative mb-20">
            <div className="w-48 h-48 mx-auto relative">
              <div className="absolute inset-0 bg-green-600/25 rounded-full animate-ping"></div>
              <div className="absolute inset-6 bg-green-500/35 rounded-full animate-ping animation-delay-500"></div>
              <div className="absolute inset-12 bg-green-400/45 rounded-full animate-ping animation-delay-1000"></div>
              <div className="absolute inset-18 bg-green-300/55 rounded-full animate-ping animation-delay-1500"></div>
              
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div 
                  className="text-8xl animate-pulse"
                  style={{ 
                    filter: `
                      drop-shadow(0 0 30px #00ff00) 
                      drop-shadow(0 0 60px #00ff00) 
                      drop-shadow(0 0 90px #00ff00)
                      hue-rotate(${screenEffects.intensity * 180}deg)
                    `,
                    transform: `scale(${1 + screenEffects.intensity * 0.3}) rotate(${screenEffects.intensity * 20}deg)`
                  }}
                >
                  💀
                </div>
              </div>
              
              {/* Cyber Attack Indicators */}
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-green-500 rounded-full animate-ping"
                  style={{
                    top: `${5 + Math.random() * 90}%`,
                    left: `${5 + Math.random() * 90}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.8 + Math.random() * 1.5}s`,
                    opacity: 0.7 + Math.random() * 0.3
                  }}
                />
              ))}
            </div>
          </div>

          {/* Cyber Attack Headers */}
          <div className="mb-20">
            <h1 
              className="text-6xl font-bold mb-8 tracking-wider font-mono transition-all duration-700"
              style={{
                color: currentPhase.color,
                textShadow: `
                  0 0 40px currentColor, 
                  0 0 80px currentColor, 
                  0 0 120px currentColor
                `,
                letterSpacing: '0.2em',
                transform: `scale(${1 + screenEffects.intensity * 0.15}) rotate(${screenEffects.intensity * 5}deg)`,
                filter: `blur(${screenEffects.intensity * 1}px)`,
                direction: 'rtl'
              }}
            >
              هجوم إلكتروني خطير
            </h1>
            <h2 
              className="text-5xl font-bold mb-8 font-mono transition-all duration-700"
              style={{
                color: currentPhase.color,
                textShadow: `
                  0 0 30px currentColor, 
                  0 0 60px currentColor, 
                  0 0 90px currentColor
                `,
                letterSpacing: '0.15em',
                transform: `scale(${1 + screenEffects.intensity * 0.1})`,
                filter: `blur(${screenEffects.intensity * 0.8}px)`
              }}
            >
              CYBER ATTACK IN PROGRESS
            </h2>
          </div>

          {/* Cyber Attack Status Panel */}
          <div className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-xl border-2 border-green-500/80 rounded-3xl p-12 max-w-6xl mx-auto shadow-2xl">
            <div className="flex items-center justify-center mb-10">
              <span className="text-green-400 text-4xl mr-6">⚠️</span>
              <h3 className="text-4xl font-bold text-green-400 font-mono" dir="rtl">تقييم الهجوم الإلكتروني</h3>
              <span className="text-green-400 text-4xl ml-6">⚠️</span>
            </div>
            <div className="text-3xl text-green-300 mb-10 font-mono tracking-wide">CYBER ATTACK ASSESSMENT</div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
              <div className="bg-green-900/60 border-2 border-green-500/80 rounded-2xl p-8 text-center">
                <div className="text-green-400 text-3xl font-bold mb-4" dir="rtl">الأمان 🔒</div>
                <div className="text-green-300 text-xl mb-4" dir="rtl">مخترق بالكامل</div>
                <div className="text-green-200 text-lg">COMPLETELY COMPROMISED</div>
              </div>
              
              <div className="bg-red-900/60 border-2 border-red-500/80 rounded-2xl p-8 text-center">
                <div className="text-red-400 text-3xl font-bold mb-4" dir="rtl">البيانات 💾</div>
                <div className="text-red-300 text-xl mb-4" dir="rtl">تم سرقتها</div>
                <div className="text-red-200 text-lg">DATA STOLEN</div>
              </div>
              
              <div className="bg-yellow-900/60 border-2 border-yellow-500/80 rounded-2xl p-8 text-center">
                <div className="text-yellow-400 text-3xl font-bold mb-4" dir="rtl">النظام 🖥️</div>
                <div className="text-yellow-300 text-xl mb-4" dir="rtl">تحت السيطرة</div>
                <div className="text-yellow-200 text-lg">UNDER CONTROL</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hacker Terminal */}
      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="bg-black/95 backdrop-blur-xl border-2 border-green-500/80 rounded-2xl p-8 shadow-2xl max-h-64 overflow-y-auto">
          <div className="text-green-400 font-mono text-xl mb-6 border-b-2 border-green-500/60 pb-4 flex items-center justify-between">
            <span>HACKER TERMINAL - CYBER ATTACK LOG</span>
            <span className="text-red-500 animate-pulse text-2xl">● ATTACK ACTIVE</span>
          </div>
          <div className="space-y-3">
            {hackingLogs.slice(-10).map((log) => (
              <div key={log.id} className="font-mono text-base flex items-center">
                <span className="text-gray-500 mr-4 min-w-24">[{log.timestamp}]</span>
                <span className="mr-4 min-w-20 font-bold" style={{ color: log.color }}>
                  {log.level}
                </span>
                <span className="text-cyan-400 mr-4 min-w-24">{log.module}</span>
                <span className="text-gray-300 flex-1">{Math.random() > 0.5 ? log.message : log.messageAr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Developer Attribution */}
      <div className="absolute bottom-8 right-8 z-40">
        <div className="bg-gradient-to-r from-green-900/80 to-blue-900/80 backdrop-blur-xl border-2 border-green-500/80 rounded-2xl px-8 py-4 shadow-2xl">
          <div className="text-green-300 font-bold text-xl animate-pulse font-mono" dir="rtl">
            تم تطوير النظام بواسطة Boon
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes digital-fall {
          0% { transform: translateY(-60px) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(10deg); opacity: 0; }
        }
        
        @keyframes glitch-flicker {
          0%, 100% { opacity: 1; transform: translateX(0) scaleX(1); }
          25% { opacity: 0.5; transform: translateX(-5px) scaleX(0.9); }
          50% { opacity: 0.3; transform: translateX(5px) scaleX(1.1); }
          75% { opacity: 0.7; transform: translateX(-3px) scaleX(0.95); }
        }
        
        @keyframes scan-line {
          0% { transform: translateY(-100vh); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-1000 { animation-delay: 1.0s; }
        .animation-delay-1500 { animation-delay: 1.5s; }
      `}</style>
    </div>
  )
}

export default App
