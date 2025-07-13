import './App.css'
import { useEffect, useState, useRef } from 'react'

function App() {
  const [systemState, setSystemState] = useState<'initializing' | 'scanning' | 'breached' | 'compromised' | 'destroyed'>('initializing')
  const [threatLevel, setThreatLevel] = useState(0)
  const [systemIntegrity, setSystemIntegrity] = useState(100)
  const [matrixElements, setMatrixElements] = useState<Array<{id: number, char: string, x: number, y: number, speed: number, opacity: number, color: string}>>([])
  const [glitchIntensity, setGlitchIntensity] = useState(0)
  const [securityLogs, setSecurityLogs] = useState<Array<{timestamp: string, level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FATAL', message: string}>>([])
  const [audioInitialized, setAudioInitialized] = useState(false)
  const mainAudioRef = useRef<HTMLAudioElement>(null)

  const systemPhases = {
    initializing: { 
      ar: 'تهيئة النظام', 
      en: 'SYSTEM INITIALIZING', 
      color: 'text-blue-400',
      bgGradient: 'from-blue-900/20 to-blue-800/10'
    },
    scanning: { 
      ar: 'فحص الأمان', 
      en: 'SECURITY SCANNING', 
      color: 'text-green-400',
      bgGradient: 'from-green-900/20 to-green-800/10'
    },
    breached: { 
      ar: 'اختراق مكتشف', 
      en: 'BREACH DETECTED', 
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-900/30 to-yellow-800/20'
    },
    compromised: { 
      ar: 'النظام مخترق', 
      en: 'SYSTEM COMPROMISED', 
      color: 'text-red-400',
      bgGradient: 'from-red-900/40 to-red-800/30'
    },
    destroyed: { 
      ar: 'تدمير كامل', 
      en: 'TOTAL DESTRUCTION', 
      color: 'text-red-600',
      bgGradient: 'from-red-900/60 to-black/80'
    }
  }

  const criticalMessages = [
    'تحذير: محاولة دخول غير مصرح بها من عنوان IP مجهول',
    'خطر: تم اختراق جدار الحماية الرئيسي بنجاح',
    'إنذار: فقدان الاتصال بخوادم الأمان المركزية',
    'حرج: تدمير قاعدة البيانات الأساسية جاري',
    'طوارئ: النظام تحت السيطرة الكاملة للمهاجم',
    'كارثة: تم حذف جميع الملفات الحساسة نهائياً',
    'WARNING: Unauthorized root access detected from unknown source',
    'CRITICAL: Main firewall completely bypassed and disabled',
    'ALERT: Database encryption keys have been compromised',
    'EMERGENCY: Complete system administrator privileges hijacked',
    'FATAL: All backup systems destroyed - recovery impossible'
  ]

  useEffect(() => {
    const arabicChars = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي']
    const hexChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
    const specialSymbols = ['⚡', '💀', '🔥', '⚠️', '💥', '🚨', '⛔', '🔴', '❌', '💣', '👾', '🚫']
    
    const elements = []
    for (let i = 0; i < 200; i++) {
      const charType = Math.random()
      let char, color
      
      if (charType < 0.5) {
        char = arabicChars[Math.floor(Math.random() * arabicChars.length)]
        color = '#00ff00'
      } else if (charType < 0.8) {
        char = hexChars[Math.floor(Math.random() * hexChars.length)]
        color = '#00ff41'
      } else {
        char = specialSymbols[Math.floor(Math.random() * specialSymbols.length)]
        color = '#ff0000'
      }
      
      elements.push({
        id: i,
        char,
        color,
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 0.2 + Math.random() * 1.8,
        opacity: 0.2 + Math.random() * 0.8
      })
    }
    setMatrixElements(elements)
  }, [])

  useEffect(() => {
    const stateProgression = [
      { state: 'scanning', delay: 2000 },
      { state: 'breached', delay: 5000 },
      { state: 'compromised', delay: 8000 },
      { state: 'destroyed', delay: 12000 }
    ]

    const timers = stateProgression.map(({ state, delay }) =>
      setTimeout(() => {
        setSystemState(state as any)
        setThreatLevel(prev => Math.min(prev + 1, 4))
        setSystemIntegrity(prev => Math.max(prev - 25, 0))
      }, delay)
    )

    const glitchProgression = setInterval(() => {
      setGlitchIntensity(prev => Math.min(prev + 0.02, 1))
    }, 500)

    const logGenerator = setInterval(() => {
      const levels: Array<'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FATAL'> = ['INFO', 'WARNING', 'ERROR', 'CRITICAL', 'FATAL']
      const newLog = {
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour12: false }),
        level: levels[Math.min(Math.floor(Math.random() * levels.length), threatLevel)] as 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FATAL',
        message: criticalMessages[Math.floor(Math.random() * criticalMessages.length)]
      }
      setSecurityLogs(prev => [...prev.slice(-8), newLog])
    }, 1800)

    const matrixAnimation = setInterval(() => {
      setMatrixElements(prev => prev.map(element => ({
        ...element,
        y: (element.y + element.speed * (1 + threatLevel * 0.3)) % 110,
        opacity: Math.max(0.1, Math.min(1, element.opacity + (Math.random() - 0.5) * 0.15)),
        color: threatLevel > 2 ? (Math.random() > 0.85 ? '#ff0000' : element.color) : element.color
      })))
    }, 80)

    const screenDistortion = setInterval(() => {
      if (threatLevel > 1) {
        const intensity = threatLevel * 1.5
        document.body.style.transform = `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px) rotate(${(Math.random() - 0.5) * 0.5}deg)`
        setTimeout(() => document.body.style.transform = 'translate(0, 0) rotate(0deg)', 80)
      }
    }, 1500)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(glitchProgression)
      clearInterval(logGenerator)
      clearInterval(matrixAnimation)
      clearInterval(screenDistortion)
    }
  }, [threatLevel])

  useEffect(() => {
    const initializeAudio = async () => {
      if (!audioInitialized && mainAudioRef.current) {
        try {
          mainAudioRef.current.volume = 0.8
          mainAudioRef.current.loop = true
          await mainAudioRef.current.play()
          setAudioInitialized(true)
        } catch (error) {
          const handleUserInteraction = async () => {
            if (mainAudioRef.current) {
              try {
                await mainAudioRef.current.play()
                setAudioInitialized(true)
              } catch (e) {
                console.log('Audio playback failed:', e)
              }
            }
            document.removeEventListener('click', handleUserInteraction)
            document.removeEventListener('keydown', handleUserInteraction)
            document.removeEventListener('touchstart', handleUserInteraction)
          }
          
          document.addEventListener('click', handleUserInteraction)
          document.addEventListener('keydown', handleUserInteraction)
          document.addEventListener('touchstart', handleUserInteraction)
        }
      }
    }

    const audioTimeout = setTimeout(initializeAudio, 1000)
    return () => clearTimeout(audioTimeout)
  }, [audioInitialized])

  const currentPhase = systemPhases[systemState]

  return (
    <div 
      className="min-h-screen bg-black relative overflow-hidden"
      dir="rtl"
      style={{
        background: `
          radial-gradient(circle at 15% 25%, rgba(255, 0, 0, ${0.08 + glitchIntensity * 0.25}) 0%, transparent 60%),
          radial-gradient(circle at 85% 75%, rgba(0, 255, 0, ${0.05 + glitchIntensity * 0.15}) 0%, transparent 50%),
          radial-gradient(circle at 50% 10%, rgba(255, 255, 0, ${0.03 + glitchIntensity * 0.1}) 0%, transparent 40%),
          radial-gradient(circle at 20% 90%, rgba(255, 0, 255, ${0.04 + glitchIntensity * 0.12}) 0%, transparent 45%),
          linear-gradient(125deg, #000000 0%, #0a0000 15%, #000a00 30%, #001a00 45%, #00001a 60%, #1a0000 75%, #000000 100%)
        `,
        filter: `contrast(${1 + glitchIntensity * 0.4}) brightness(${0.95 + glitchIntensity * 0.15}) saturate(${1 + glitchIntensity * 0.8}) hue-rotate(${glitchIntensity * 45}deg)`,
        transform: `scale(${1 + glitchIntensity * 0.008}) rotate(${glitchIntensity * 0.3}deg)`
      }}
    >
      {/* Advanced Matrix Rain Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        {matrixElements.map((element) => (
          <div
            key={element.id}
            className="absolute font-mono font-bold select-none transition-all duration-75"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              fontSize: `${8 + Math.random() * 8}px`,
              color: element.color,
              textShadow: `0 0 ${6 + glitchIntensity * 12}px currentColor, 0 0 ${12 + glitchIntensity * 24}px currentColor`,
              opacity: element.opacity * (0.7 + glitchIntensity * 0.3),
              transform: `rotate(${glitchIntensity * 20}deg) scale(${1 + glitchIntensity * 0.3})`,
              filter: `blur(${glitchIntensity * 1.2}px)`,
              animation: `matrix-flicker ${0.8 + Math.random() * 1.2}s ease-in-out infinite alternate`
            }}
          >
            {element.char}
          </div>
        ))}
      </div>

      {/* Professional Glitch Overlay */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${80 + Math.random() * 250}px`,
              height: `${1 + Math.random() * 2}px`,
              background: `linear-gradient(90deg, 
                rgba(255, 0, 0, ${glitchIntensity * 0.9}),
                rgba(0, 255, 0, ${glitchIntensity * 0.7}),
                rgba(0, 0, 255, ${glitchIntensity * 0.5}),
                rgba(255, 255, 0, ${glitchIntensity * 0.6}),
                transparent)`,
              animation: `glitch-sweep ${0.05 + Math.random() * 0.15}s infinite`,
              animationDelay: `${Math.random() * 2}s`,
              transform: `skew(${glitchIntensity * 35}deg) rotate(${glitchIntensity * 8}deg)`,
              filter: `blur(${glitchIntensity * 1.5}px)`,
              opacity: glitchIntensity * 0.8
            }}
          />
        ))}
      </div>

      {/* Professional Header Dashboard */}
      <div className="absolute top-6 left-6 right-6 z-30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* System Status */}
          <div className={`bg-gradient-to-br ${currentPhase.bgGradient} backdrop-blur-sm border-2 border-gray-500 rounded-xl p-4 shadow-xl`}>
            <div className="text-gray-300 font-mono text-xs mb-1 opacity-80">SYSTEM STATUS</div>
            <div className={`text-lg font-bold ${currentPhase.color} mb-1`}>{currentPhase.en}</div>
            <div className="text-gray-400 text-sm">{currentPhase.ar}</div>
          </div>

          {/* Threat Level */}
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/30 backdrop-blur-sm border-2 border-red-500 rounded-xl p-4 shadow-xl">
            <div className="text-red-300 font-mono text-xs mb-1 opacity-80">THREAT LEVEL</div>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-red-400">{threatLevel}</div>
              <div className="text-red-300 text-xs">/ 4</div>
            </div>
            <div className="text-red-200 text-sm">MAXIMUM</div>
          </div>

          {/* System Integrity */}
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/30 backdrop-blur-sm border-2 border-orange-500 rounded-xl p-4 shadow-xl">
            <div className="text-orange-300 font-mono text-xs mb-1 opacity-80">INTEGRITY</div>
            <div className="text-2xl font-bold text-orange-400">{systemIntegrity}%</div>
            <div className="text-orange-200 text-sm">COMPROMISED</div>
          </div>

          {/* Audio Status */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/30 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-4 shadow-xl">
            <div className="text-purple-300 font-mono text-xs mb-1 opacity-80">AUDIO</div>
            <div className={`text-lg font-bold ${audioInitialized ? 'text-green-400' : 'text-red-400'}`}>
              {audioInitialized ? 'ACTIVE' : 'INACTIVE'}
            </div>
            <div className="text-purple-200 text-sm">SYSTEM</div>
          </div>
        </div>
      </div>

      {/* Central Professional Warning Display */}
      <div className="flex flex-col items-center justify-center min-h-screen p-8 relative z-20">
        
        {/* Main Threat Indicator */}
        <div className="mb-12 text-center relative">
          <div 
            className="mx-auto w-56 h-56 bg-gradient-to-br from-red-900 via-black to-red-800 rounded-full flex items-center justify-center mb-8 shadow-2xl border-8 border-red-600 relative overflow-hidden"
            style={{
              boxShadow: `0 0 ${100 + glitchIntensity * 80}px rgba(255, 0, 0, ${0.9 + glitchIntensity * 0.1}), inset 0 0 50px rgba(0, 0, 0, 0.9)`,
              animation: `threat-pulse ${1.2 - glitchIntensity * 0.2}s ease-in-out infinite alternate`,
              transform: `scale(${1 + glitchIntensity * 0.1}) rotate(${glitchIntensity * 8}deg)`
            }}
          >
            <div 
              className="text-9xl animate-pulse"
              style={{
                filter: `hue-rotate(${glitchIntensity * 180}deg) drop-shadow(0 0 30px rgba(255, 0, 0, 0.9))`
              }}
            >
              💀
            </div>
            
            {/* Animated danger indicators */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-red-500 rounded-full animate-ping"
                style={{
                  top: `${10 + Math.random() * 80}%`,
                  left: `${10 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${1.2 + Math.random() * 0.8}s`
                }}
              />
            ))}
          </div>
          
          <h1 
            className={`text-8xl font-bold mb-6 tracking-wider font-mono ${currentPhase.color} transition-all duration-500`}
            style={{
              textShadow: `0 0 ${25 + glitchIntensity * 35}px currentColor, 0 0 ${50 + glitchIntensity * 70}px currentColor, 5px 5px 0px rgba(0, 0, 0, 1)`,
              animation: `text-chaos ${0.15 + glitchIntensity * 0.25}s infinite alternate`,
              transform: `skew(${glitchIntensity * 6}deg, ${glitchIntensity * 3}deg) scale(${1 + glitchIntensity * 0.06})`,
              filter: `blur(${glitchIntensity * 2}px)`
            }}
          >
            النظام مخترق
          </h1>
          
          <div 
            className={`text-4xl font-bold mb-8 font-mono ${currentPhase.color} opacity-95`}
            style={{
              textShadow: `0 0 20px currentColor`,
              animation: 'text-shimmer 1.2s infinite alternate'
            }}
          >
            SYSTEM COMPROMISED
          </div>
        </div>

        {/* Professional Security Assessment */}
        <div className="max-w-6xl mx-auto mb-12">
          <div 
            className="bg-gradient-to-br from-red-900/95 via-black/98 to-red-800/95 backdrop-blur-xl border-8 border-red-600 rounded-3xl p-10 shadow-2xl relative overflow-hidden"
            style={{
              boxShadow: `0 0 ${90 + glitchIntensity * 60}px rgba(255, 0, 0, ${0.8 + glitchIntensity * 0.2})`,
              animation: `security-alert ${1.0 - glitchIntensity * 0.3}s infinite alternate`
            }}
          >
            <div className="absolute inset-0 bg-red-600/20 animate-pulse"></div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-6xl text-red-400 mr-6 animate-spin">⚠️</div>
                  <h2 className="text-5xl font-bold text-red-300 font-mono">تقييم الأمان الحرج</h2>
                  <div className="text-6xl text-red-400 ml-6 animate-spin">⚠️</div>
                </div>
                <div className="text-3xl text-red-200 font-mono opacity-95">CRITICAL SECURITY ASSESSMENT</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-black/90 border-4 border-red-700 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-700/40 to-transparent animate-pulse"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <div className="text-4xl text-red-400 mr-4">🔓</div>
                      <div className="text-2xl font-bold text-red-400 font-mono">الأمان</div>
                    </div>
                    <div className="text-xl text-red-200 mb-2">مخترق كلياً</div>
                    <div className="text-lg text-red-100 opacity-90">Fully Breached</div>
                  </div>
                </div>
                
                <div className="bg-black/90 border-4 border-orange-700 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-700/40 to-transparent animate-pulse"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <div className="text-4xl text-orange-400 mr-4">💾</div>
                      <div className="text-2xl font-bold text-orange-400 font-mono">البيانات</div>
                    </div>
                    <div className="text-xl text-orange-200 mb-2">مدمرة نهائياً</div>
                    <div className="text-lg text-orange-100 opacity-90">Permanently Lost</div>
                  </div>
                </div>
                
                <div className="bg-black/90 border-4 border-purple-700 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700/40 to-transparent animate-pulse"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <div className="text-4xl text-purple-400 mr-4">⏰</div>
                      <div className="text-2xl font-bold text-purple-400 font-mono">الاسترداد</div>
                    </div>
                    <div className="text-xl text-purple-200 mb-2">مستحيل</div>
                    <div className="text-lg text-purple-100 opacity-90">IMPOSSIBLE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Security Terminal */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-black/98 border-6 border-green-600 rounded-2xl p-8 shadow-2xl font-mono relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/15 to-transparent animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3 animate-pulse delay-200"></div>
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse delay-400"></div>
                  <span className="text-green-400 text-2xl font-bold mr-6">SECURITY TERMINAL</span>
                </div>
                <div className="text-red-400 text-xl font-bold animate-pulse">COMPROMISED</div>
              </div>
              
              <div className="bg-black/95 border-2 border-green-500 rounded-xl p-6 mb-6">
                <div className="text-green-400 text-xl mb-4">SYSTEM LOG OUTPUT:</div>
                <div className="space-y-2 max-h-40 overflow-hidden">
                  {securityLogs.map((log, index) => (
                    <div key={index} className={`text-lg animate-pulse ${
                      log.level === 'FATAL' ? 'text-red-400' :
                      log.level === 'CRITICAL' ? 'text-orange-400' :
                      log.level === 'ERROR' ? 'text-yellow-400' :
                      log.level === 'WARNING' ? 'text-blue-400' :
                      'text-green-400'
                    }`}>
                      <span className="text-red-400">root@security:~$</span> [{log.timestamp}] {log.level}: {log.message}
                    </div>
                  ))}
                  <div className="text-green-400 text-lg">
                    <span className="text-red-400">root@security:~$</span> 
                    <span className="animate-pulse bg-green-400 text-black px-1">█</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Developer Credit */}
        <div className="max-w-4xl mx-auto">
          <div 
            className="bg-gradient-to-br from-indigo-900/95 via-purple-900/98 to-pink-900/95 backdrop-blur-xl border-6 border-purple-600 rounded-3xl p-10 shadow-2xl relative overflow-hidden"
            style={{
              boxShadow: `0 0 ${70 + glitchIntensity * 40}px rgba(147, 51, 234, ${0.9 + glitchIntensity * 0.1})`,
              animation: `developer-glow ${2.2 + glitchIntensity * 0.3}s ease-in-out infinite alternate`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 animate-pulse"></div>
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center mb-8">
                <div 
                  className="w-24 h-24 bg-gradient-to-br from-purple-500 via-indigo-600 to-pink-600 rounded-full flex items-center justify-center mr-6 border-4 border-purple-500 shadow-2xl"
                  style={{
                    boxShadow: `0 0 50px rgba(147, 51, 234, 0.9)`,
                    animation: 'dev-icon-glow 3s ease-in-out infinite alternate'
                  }}
                >
                  <div className="text-4xl animate-pulse">👨‍💻</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-300 mb-3 font-mono">تم تطوير النظام بواسطة</div>
                  <div 
                    className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent font-mono"
                    style={{
                      textShadow: '0 0 40px rgba(147, 51, 234, 0.7)',
                      animation: 'dev-name-shine 2.5s ease-in-out infinite alternate'
                    }}
                  >
                    Boon
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-12 mb-6">
                <div className="text-purple-400 text-4xl animate-bounce" style={{animationDelay: '0s'}}>💀</div>
                <div className="text-indigo-400 text-4xl animate-bounce" style={{animationDelay: '0.2s'}}>⚡</div>
                <div className="text-pink-400 text-4xl animate-bounce" style={{animationDelay: '0.4s'}}>🔥</div>
                <div className="text-purple-500 text-4xl animate-bounce" style={{animationDelay: '0.6s'}}>⚠️</div>
                <div className="text-indigo-500 text-4xl animate-bounce" style={{animationDelay: '0.8s'}}>💻</div>
              </div>
              
              <div className="space-y-4">
                <div className="text-2xl text-purple-200 font-bold font-mono">Professional Security Architecture</div>
                <div className="text-xl text-purple-100 opacity-95 font-mono">Advanced Threat Simulation System</div>
                <div className="text-lg text-purple-50 opacity-85 font-mono">النظام مخترق © 2025</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Scary Audio System */}
      <audio
        ref={mainAudioRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="/Jumpscare_Horror_Sound_Effects_13.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}

export default App
