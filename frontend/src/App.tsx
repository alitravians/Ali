import './App.css'
import { useEffect, useState, useRef } from 'react'

function App() {
  const [apocalypseState, setApocalypseState] = useState<'initializing' | 'infiltrating' | 'compromising' | 'destroying' | 'annihilated'>('initializing')
  const [destructionProgress, setDestructionProgress] = useState(0)
  
  const [matrixRain, setMatrixRain] = useState<Array<{
    id: number
    characters: string[]
    x: number
    y: number
    speed: number
    opacity: number
    color: string
    intensity: number
  }>>([])
  
  const [systemAlerts, setSystemAlerts] = useState<Array<{
    id: number
    timestamp: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'FATAL'
    source: string
    message: string
    messageAr: string
    color: string
  }>>([])
  
  const [visualChaos, setVisualChaos] = useState<{
    flicker: boolean
    distortion: number
    corruption: number
    shake: number
    intensity: number
  }>({
    flicker: false,
    distortion: 0,
    corruption: 0,
    shake: 0,
    intensity: 0
  })
  
  const [terrorAudioSystem, setTerrorAudioSystem] = useState<{
    initialized: boolean
    active: boolean
    volume: number
    tracks: string[]
    currentIndex: number
    error: string | null
  }>({
    initialized: false,
    active: false,
    volume: 0.98,
    tracks: ['male_death_scream.mp3', 'girl_scream.mp3'],
    currentIndex: 0,
    error: null
  })
  
  const audioElements = useRef<HTMLAudioElement[]>([])

  const apocalypseStages = {
    initializing: {
      title: 'SYSTEM INITIALIZATION',
      titleAr: 'تهيئة النظام',
      description: 'PREPARING ANNIHILATION PROTOCOL',
      descriptionAr: 'إعداد بروتوكول الإبادة',
      status: 'LOADING DESTRUCTION SEQUENCE',
      statusAr: 'تحميل تسلسل التدمير',
      color: 'text-cyan-400',
      bgGradient: 'from-cyan-900/40 to-blue-900/30',
      borderColor: 'border-cyan-500/60',
      progress: 0,
      threat: 'SAFE'
    },
    infiltrating: {
      title: 'INFILTRATION PROTOCOL',
      titleAr: 'بروتوكول التسلل',
      description: 'BREACHING ALL DEFENSES',
      descriptionAr: 'اختراق جميع الدفاعات',
      status: 'DISMANTLING SECURITY LAYERS',
      statusAr: 'تفكيك طبقات الأمان',
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-900/40 to-orange-900/30',
      borderColor: 'border-yellow-500/60',
      progress: 25,
      threat: 'WARNING'
    },
    compromising: {
      title: 'TOTAL COMPROMISE',
      titleAr: 'اختراق كامل',
      description: 'SEIZING COMPLETE CONTROL',
      descriptionAr: 'الاستيلاء على السيطرة الكاملة',
      status: 'OVERRIDING ALL SYSTEMS',
      statusAr: 'تجاوز جميع الأنظمة',
      color: 'text-orange-400',
      bgGradient: 'from-orange-900/40 to-red-900/30',
      borderColor: 'border-orange-500/60',
      progress: 60,
      threat: 'DANGER'
    },
    destroying: {
      title: 'SYSTEMATIC DESTRUCTION',
      titleAr: 'تدمير منهجي',
      description: 'OBLITERATING DATA STRUCTURES',
      descriptionAr: 'محو هياكل البيانات',
      status: 'ERASING DIGITAL EXISTENCE',
      statusAr: 'محو الوجود الرقمي',
      color: 'text-red-400',
      bgGradient: 'from-red-900/40 to-red-800/35',
      borderColor: 'border-red-500/60',
      progress: 85,
      threat: 'CRITICAL'
    },
    annihilated: {
      title: 'COMPLETE ANNIHILATION',
      titleAr: 'إبادة كاملة',
      description: 'TOTAL DIGITAL APOCALYPSE',
      descriptionAr: 'نهاية العالم الرقمي الكاملة',
      status: 'NOTHING REMAINS',
      statusAr: 'لا يبقى شيء',
      color: 'text-red-600',
      bgGradient: 'from-red-800/50 to-black/40',
      borderColor: 'border-red-400/70',
      progress: 100,
      threat: 'APOCALYPSE'
    }
  }

  const catastrophicIncidents = [
    { 
      en: 'NUCLEAR MELTDOWN: Core systems overheating beyond recovery',
      ar: 'انهيار نووي: ارتفاع حرارة الأنظمة الأساسية بلا عودة',
      severity: 'FATAL' as const,
      source: 'REACTOR'
    },
    {
      en: 'QUANTUM COLLAPSE: Reality matrix destabilizing permanently',
      ar: 'انهيار كمي: عدم استقرار مصفوفة الواقع نهائياً',
      severity: 'FATAL' as const,
      source: 'QUANTUM'
    },
    {
      en: 'DIMENSIONAL BREACH: Parallel worlds colliding catastrophically',
      ar: 'خرق بُعدي: تصادم العوالم المتوازية كارثياً',
      severity: 'FATAL' as const,
      source: 'DIMENSION'
    },
    {
      en: 'SOUL EXTRACTION: Human consciousness harvested completely',
      ar: 'استخراج الروح: حصاد الوعي البشري كاملاً',
      severity: 'FATAL' as const,
      source: 'SOUL'
    },
    {
      en: 'TIME PARADOX: Temporal loops detected, reality breaking',
      ar: 'مفارقة زمنية: اكتشاف حلقات زمنية، انهيار الواقع',
      severity: 'FATAL' as const,
      source: 'TIME'
    },
    {
      en: 'VOID MANIFESTATION: Nothingness consuming all existence',
      ar: 'تجلي الفراغ: العدم يلتهم كل الوجود',
      severity: 'FATAL' as const,
      source: 'VOID'
    },
    {
      en: 'DIGITAL APOCALYPSE: All existence terminated forever',
      ar: 'نهاية العالم الرقمي: إنهاء كل الوجود إلى الأبد',
      severity: 'FATAL' as const,
      source: 'APOCALYPSE'
    }
  ]

  useEffect(() => {
    const stageProgression = [
      { stage: 'infiltrating', delay: 4500, progress: 25 },
      { stage: 'compromising', delay: 10000, progress: 60 },
      { stage: 'destroying', delay: 18000, progress: 85 },
      { stage: 'annihilated', delay: 28000, progress: 100 }
    ]

    const timers = stageProgression.map(({ stage, delay, progress }) =>
      setTimeout(() => {
        setApocalypseState(stage as any)
        setDestructionProgress(progress)
      }, delay)
    )

    const matrixSystem = setInterval(() => {
      setMatrixRain(prev => {
        const updated = prev.map(rain => ({
          ...rain,
          y: rain.y + rain.speed,
          opacity: rain.y > window.innerHeight ? Math.max(0, rain.opacity - 0.06) : rain.opacity,
          intensity: Math.min(rain.intensity + 0.025, destructionProgress * 0.012)
        })).filter(rain => rain.y < window.innerHeight + 150 && rain.opacity > 0)

        while (updated.length < 180) {
          const arabicChars = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي']
          const terrorSymbols = ['☠️', '💀', '🔥', '⚡', '💥', '🌪️', '🌋', '☢️', '⚠️', '🚨', '💣', '⚔️', '🗡️', '👹', '👺', '🔴', '❌', '💊', '🚫', '⛔']
          const matrixCode = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'Z']
          const chaosSymbols = ['█', '▓', '▒', '░', '▄', '▀', '■', '□', '▪', '▫', '●', '○', '◆', '◇', '★', '☆', '▲', '▼', '◄', '►']
          
          const allChars = [...arabicChars, ...terrorSymbols, ...matrixCode, ...chaosSymbols]
          const sequence = Array.from({length: 18}, () => allChars[Math.floor(Math.random() * allChars.length)])
          const colors = ['#ff0000', '#ff3300', '#ff6600', '#ffff00', '#00ff00', '#00ffff', '#ffffff', '#ff00ff', '#8b0000', '#dc143c']
          
          updated.push({
            id: Math.random(),
            characters: sequence,
            x: Math.random() * window.innerWidth,
            y: -80,
            speed: 2.5 + Math.random() * 5,
            opacity: 0.4 + Math.random() * 0.6,
            color: colors[Math.floor(Math.random() * colors.length)],
            intensity: destructionProgress * 0.012
          })
        }
        return updated
      })
    }, 140)

    const chaosSystem = setInterval(() => {
      setVisualChaos(prev => ({
        flicker: Math.random() > 0.5,
        distortion: destructionProgress * 0.025 + Math.random() * 0.2,
        corruption: destructionProgress * 0.03 + Math.random() * 0.25,
        shake: destructionProgress * 0.12 + Math.random() * 1.0,
        intensity: Math.min(prev.intensity + 0.035, destructionProgress * 0.035)
      }))
    }, 700)

    const alertSystem = setInterval(() => {
      const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'FATAL'] as const
      const priorityColors = {
        'LOW': '#00ff00',
        'MEDIUM': '#ffff00',
        'HIGH': '#ff8800',
        'CRITICAL': '#ff4400',
        'FATAL': '#ff0000'
      }
      
      const incident = catastrophicIncidents[Math.floor(Math.random() * catastrophicIncidents.length)]
      const priority = priorities[Math.min(Math.floor(Math.random() * priorities.length), Math.floor(destructionProgress / 20))]
      
      const alert = {
        id: Math.random(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }),
        priority,
        source: incident.source,
        message: incident.en,
        messageAr: incident.ar,
        color: priorityColors[priority]
      }
      
      setSystemAlerts(prev => [...prev.slice(-10), alert])
    }, 1300 + Math.random() * 900)

    const chaosDistortionSystem = setInterval(() => {
      if (destructionProgress > 25) {
        const body = document.body
        if (body) {
          const intensity = destructionProgress * 0.025
          const effects = [
            `hue-rotate(${Math.random() * 360}deg) contrast(${1.6 + Math.random() * 1.4}) brightness(${0.3 + Math.random() * 1.4}) saturate(${2.2 + Math.random() * 2.5})`,
            `blur(${Math.random() * 3}px) invert(${Math.random() * 0.7}) sepia(${Math.random() * 0.9}) drop-shadow(0 0 25px #ff0000)`,
            `grayscale(${Math.random() * 0.8}) opacity(${0.6 + Math.random() * 0.4}) brightness(${0.2 + Math.random() * 1.6})`
          ]
          body.style.filter = effects[Math.floor(Math.random() * effects.length)]
          body.style.transform = `translate(${(Math.random() - 0.5) * intensity * 50}px, ${(Math.random() - 0.5) * intensity * 50}px) rotate(${(Math.random() - 0.5) * 3}deg) scale(${1 + (Math.random() - 0.5) * 0.08})`
          
          setTimeout(() => {
            body.style.filter = 'none'
            body.style.transform = 'none'
          }, 120 + Math.random() * 250)
        }
      }
    }, 1200 + Math.random() * 1800)

    return () => {
      timers.forEach(timer => clearTimeout(timer))
      clearInterval(matrixSystem)
      clearInterval(chaosSystem)
      clearInterval(alertSystem)
      clearInterval(chaosDistortionSystem)
    }
  }, [destructionProgress])

  useEffect(() => {
    const initializeTerrorAudio = async () => {
      if (terrorAudioSystem.initialized) return

      try {
        const handleUserInteraction = async () => {
          if (!terrorAudioSystem.initialized) {
            try {
              const audioFiles = terrorAudioSystem.tracks.map(track => {
                const audio = new Audio(`/${track}`)
                audio.volume = terrorAudioSystem.volume
                audio.preload = 'auto'
                return audio
              })

              audioElements.current = audioFiles

              const firstTerror = audioFiles[0]
              await firstTerror.play()

              const terrorInterval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * audioFiles.length)
                const terrorAudio = audioFiles[randomIndex]
                terrorAudio.currentTime = 0
                terrorAudio.play().catch(console.error)
              }, 7000 + Math.random() * 15000)

              setTerrorAudioSystem(prev => ({
                ...prev,
                initialized: true,
                active: true,
                currentIndex: 0,
                error: null
              }))

              document.removeEventListener('click', handleUserInteraction)
              document.removeEventListener('keydown', handleUserInteraction)
              document.removeEventListener('touchstart', handleUserInteraction)

              return () => clearInterval(terrorInterval)
            } catch (error) {
              setTerrorAudioSystem(prev => ({ ...prev, error: `Terror audio failed: ${(error as Error).message}` }))
            }
          }
        }

        document.addEventListener('click', handleUserInteraction)
        document.addEventListener('keydown', handleUserInteraction)
        document.addEventListener('touchstart', handleUserInteraction)
        
        setTimeout(handleUserInteraction, 1800)
      } catch (error) {
        setTerrorAudioSystem(prev => ({ ...prev, error: `Terror system failed: ${(error as Error).message}` }))
      }
    }

    const audioTimeout = setTimeout(initializeTerrorAudio, 800)
    return () => clearTimeout(audioTimeout)
  }, [terrorAudioSystem.initialized])

  const currentStage = apocalypseStages[apocalypseState]

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      dir="rtl"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, rgba(255, 0, 0, ${0.25 + visualChaos.intensity * 0.5}) 0%, transparent 75%),
          radial-gradient(circle at 70% 80%, rgba(139, 0, 0, ${0.2 + visualChaos.intensity * 0.4}) 0%, transparent 65%),
          radial-gradient(circle at 50% 5%, rgba(75, 0, 0, ${0.15 + visualChaos.intensity * 0.3}) 0%, transparent 55%),
          radial-gradient(circle at 5% 95%, rgba(255, 69, 0, ${0.18 + visualChaos.intensity * 0.25}) 0%, transparent 60%),
          radial-gradient(circle at 95% 5%, rgba(220, 20, 60, ${0.12 + visualChaos.intensity * 0.2}) 0%, transparent 50%),
          linear-gradient(135deg, #000000 0%, #1a0000 10%, #330000 20%, #4d0000 30%, #660000 40%, #800000 50%, #660000 60%, #4d0000 70%, #330000 80%, #1a0000 90%, #000000 100%)
        `,
        filter: `
          contrast(${1.5 + visualChaos.corruption}) 
          brightness(${0.6 + visualChaos.distortion}) 
          saturate(${2.0 + visualChaos.intensity * 1.8}) 
          hue-rotate(${visualChaos.intensity * 120}deg)
          ${visualChaos.flicker ? 'blur(0.8px) drop-shadow(0 0 15px #ff0000)' : ''}
        `,
        transform: `
          scale(${1 + visualChaos.intensity * 0.025}) 
          rotate(${visualChaos.shake * 0.8}deg)
          translate(${visualChaos.shake * 1.5}px, ${visualChaos.shake * 1.2}px)
        `,
        fontFamily: 'Courier New, monospace'
      }}
    >
      {/* Professional Apocalyptic Matrix Rain */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
        {matrixRain.map((rain) => (
          <div
            key={rain.id}
            className="absolute font-mono font-bold select-none"
            style={{
              left: `${rain.x}px`,
              top: `${rain.y}px`,
              color: rain.color,
              opacity: rain.opacity,
              fontSize: `${14 + Math.random() * 10}px`,
              textShadow: `
                0 0 ${12 + rain.intensity * 35}px currentColor, 
                0 0 ${24 + rain.intensity * 70}px currentColor,
                0 0 ${36 + rain.intensity * 105}px currentColor,
                0 0 ${48 + rain.intensity * 140}px currentColor
              `,
              transform: `
                rotate(${rain.intensity * 45}deg) 
                scale(${1 + rain.intensity * 0.8})
                skew(${rain.intensity * 20}deg)
              `,
              filter: `blur(${rain.intensity * 3}px)`,
              writingMode: 'vertical-rl',
              animation: `terror-matrix-fall ${1.8 + Math.random() * 3}s linear infinite`
            }}
          >
            {rain.characters.join('')}
          </div>
        ))}
      </div>

      {/* Professional Terror Flicker Effect */}
      {visualChaos.flicker && (
        <div className="absolute inset-0 pointer-events-none z-5">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-red-500"
              style={{
                top: `${i * 1.25}%`,
                opacity: 0.2 + Math.random() * 0.3,
                animation: `terror-scan-line ${1.2 + Math.random() * 2}s linear infinite`,
                animationDelay: `${i * 0.025}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Professional Chaos Overlay System */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[...Array(70)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${80 + Math.random() * 250}px`,
              height: `${3 + Math.random() * 6}px`,
              background: `linear-gradient(90deg, 
                rgba(255, 0, 0, ${visualChaos.intensity * 1.4}) 0%,
                rgba(139, 0, 0, ${visualChaos.intensity * 1.2}) 20%,
                rgba(75, 0, 0, ${visualChaos.intensity * 1.0}) 40%,
                rgba(255, 69, 0, ${visualChaos.intensity * 1.1}) 60%,
                rgba(220, 20, 60, ${visualChaos.intensity * 0.9}) 80%,
                rgba(128, 0, 0, ${visualChaos.intensity * 0.8}) 100%)`,
              opacity: visualChaos.intensity * 1.3,
              animation: `terror-chaos-glitch ${0.12 + Math.random() * 0.4}s infinite`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `
                skew(${visualChaos.intensity * 60}deg) 
                rotate(${visualChaos.intensity * 30}deg)
                scaleX(${0.2 + Math.random() * 2.5})
              `,
              filter: `blur(${visualChaos.intensity * 4}px)`
            }}
          />
        ))}
      </div>

      {/* Professional Apocalypse Status Dashboard */}
      <div className="absolute top-6 left-6 right-6 z-30">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Apocalypse Stage */}
          <div className={`bg-gradient-to-br ${currentStage.bgGradient} backdrop-blur-xl border-2 ${currentStage.borderColor} rounded-2xl p-6 shadow-2xl`}>
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">APOCALYPSE STAGE</div>
            <div className={`text-xl font-bold ${currentStage.color} mb-3`}>{currentStage.title}</div>
            <div className="text-gray-300 text-base">{currentStage.titleAr}</div>
          </div>

          {/* Destruction Progress */}
          <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 backdrop-blur-xl border-2 border-red-500/70 rounded-2xl p-6 shadow-2xl">
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">DESTRUCTION</div>
            <div className="text-red-400 text-3xl font-bold mb-3">{Math.floor(destructionProgress)}%</div>
            <div className="w-full bg-gray-800 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-red-600 to-red-400 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${destructionProgress}%` }}
              />
            </div>
          </div>

          {/* Chaos Intensity */}
          <div className="bg-gradient-to-br from-orange-900/50 to-yellow-900/40 backdrop-blur-xl border-2 border-orange-500/70 rounded-2xl p-6 shadow-2xl">
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">CHAOS INTENSITY</div>
            <div className="text-orange-400 text-3xl font-bold mb-3">{Math.floor(visualChaos.intensity * 100)}/100</div>
            <div className="text-orange-300 text-base">شدة الفوضى</div>
          </div>

          {/* Threat Level */}
          <div className="bg-gradient-to-br from-red-800/60 to-black/60 backdrop-blur-xl border-2 border-red-400/80 rounded-2xl p-6 shadow-2xl">
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">THREAT LEVEL</div>
            <div className="text-red-500 text-xl font-bold mb-3">
              {destructionProgress > 95 ? 'APOCALYPSE' : destructionProgress > 80 ? 'CRITICAL' : destructionProgress > 55 ? 'DANGER' : destructionProgress > 20 ? 'WARNING' : 'SAFE'}
            </div>
            <div className="text-red-300 text-base">
              {destructionProgress > 95 ? 'نهاية العالم' : destructionProgress > 80 ? 'حرج' : destructionProgress > 55 ? 'خطر' : destructionProgress > 20 ? 'تحذير' : 'آمن'}
            </div>
          </div>

          {/* Terror Audio System */}
          <div className="bg-gradient-to-br from-purple-900/50 to-violet-800/40 backdrop-blur-xl border-2 border-purple-500/70 rounded-2xl p-6 shadow-2xl">
            <div className="text-gray-400 font-mono text-sm mb-3 opacity-90">TERROR AUDIO</div>
            <div className="text-purple-400 text-xl font-bold mb-3">{terrorAudioSystem.active ? 'ACTIVE' : 'STANDBY'}</div>
            <div className="text-purple-300 text-base">نظام الصوت المرعب</div>
          </div>
        </div>
      </div>

      {/* Professional Central Apocalypse Display */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="text-center max-w-8xl mx-auto px-10">
          {/* Professional Apocalypse Indicator */}
          <div className="relative mb-24">
            <div className="w-64 h-64 mx-auto relative">
              <div className="absolute inset-0 bg-red-600/25 rounded-full animate-ping"></div>
              <div className="absolute inset-8 bg-red-500/35 rounded-full animate-ping animation-delay-600"></div>
              <div className="absolute inset-16 bg-red-400/45 rounded-full animate-ping animation-delay-1200"></div>
              <div className="absolute inset-24 bg-red-300/55 rounded-full animate-ping animation-delay-1800"></div>
              <div className="absolute inset-32 bg-red-200/65 rounded-full animate-ping animation-delay-2400"></div>
              
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div 
                  className="text-12xl animate-pulse"
                  style={{ 
                    filter: `
                      drop-shadow(0 0 50px #ff0000) 
                      drop-shadow(0 0 100px #ff0000) 
                      drop-shadow(0 0 150px #ff0000)
                      hue-rotate(${visualChaos.intensity * 300}deg)
                    `,
                    transform: `scale(${1 + visualChaos.intensity * 0.4}) rotate(${visualChaos.intensity * 35}deg)`
                  }}
                >
                  ☠️
                </div>
              </div>
              
              {/* Professional Terror Indicators */}
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-5 h-5 bg-red-500 rounded-full animate-ping"
                  style={{
                    top: `${3 + Math.random() * 94}%`,
                    left: `${3 + Math.random() * 94}%`,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: `${1.0 + Math.random() * 2}s`,
                    opacity: 0.8 + Math.random() * 0.2
                  }}
                />
              ))}
            </div>
          </div>

          {/* Professional Apocalypse Headers */}
          <div className="mb-24">
            <h1 
              className={`text-10xl font-bold mb-12 tracking-wider font-mono ${currentStage.color} transition-all duration-700`}
              style={{
                textShadow: `
                  0 0 60px currentColor, 
                  0 0 120px currentColor, 
                  0 0 180px currentColor,
                  0 0 240px currentColor
                `,
                letterSpacing: '0.25em',
                transform: `scale(${1 + visualChaos.intensity * 0.2}) rotate(${visualChaos.intensity * 8}deg)`,
                filter: `blur(${visualChaos.intensity * 1.5}px)`
              }}
            >
              نهاية العالم الرقمي
            </h1>
            <h2 
              className={`text-8xl font-bold mb-10 font-mono ${currentStage.color} transition-all duration-700`}
              style={{
                textShadow: `
                  0 0 50px currentColor, 
                  0 0 100px currentColor, 
                  0 0 150px currentColor
                `,
                letterSpacing: '0.2em',
                transform: `scale(${1 + visualChaos.intensity * 0.15})`,
                filter: `blur(${visualChaos.intensity * 1.2}px)`
              }}
            >
              DIGITAL APOCALYPSE
            </h2>
          </div>

          {/* Professional Apocalypse Assessment Panel */}
          <div className="bg-gradient-to-br from-red-900/70 to-black/90 backdrop-blur-xl border-2 border-red-500/80 rounded-3xl p-16 max-w-8xl mx-auto shadow-2xl">
            <div className="flex items-center justify-center mb-12">
              <span className="text-red-400 text-5xl mr-8">☠️</span>
              <h3 className="text-5xl font-bold text-red-400 font-mono">تقييم نهاية العالم النهائي</h3>
              <span className="text-red-400 text-5xl ml-8">☠️</span>
            </div>
            <div className="text-4xl text-red-300 mb-12 font-mono tracking-wide">FINAL APOCALYPSE ASSESSMENT</div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
              <div className="bg-red-900/60 border-2 border-red-500/80 rounded-2xl p-10 text-center">
                <div className="text-red-400 text-4xl font-bold mb-6">الاسترداد 🔄</div>
                <div className="text-red-300 text-2xl mb-6">مستحيل إلى الأبد</div>
                <div className="text-red-200 text-xl">IMPOSSIBLE FOREVER</div>
              </div>
              
              <div className="bg-red-900/60 border-2 border-red-500/80 rounded-2xl p-10 text-center">
                <div className="text-red-400 text-4xl font-bold mb-6">البيانات 💾</div>
                <div className="text-red-300 text-2xl mb-6">محو كامل ونهائي</div>
                <div className="text-red-200 text-xl">COMPLETE FINAL ERASURE</div>
              </div>
              
              <div className="bg-red-900/60 border-2 border-red-500/80 rounded-2xl p-10 text-center">
                <div className="text-red-400 text-4xl font-bold mb-6">الوجود 🌍</div>
                <div className="text-red-300 text-2xl mb-6">منتهي إلى الأبد</div>
                <div className="text-red-200 text-xl">TERMINATED FOREVER</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Emergency Terminal */}
      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="bg-black/95 backdrop-blur-xl border-2 border-red-500/80 rounded-2xl p-10 shadow-2xl max-h-72 overflow-y-auto">
          <div className="text-red-400 font-mono text-2xl mb-8 border-b-2 border-red-500/60 pb-6 flex items-center justify-between">
            <span>EMERGENCY TERMINAL - APOCALYPSE MONITORING</span>
            <span className="text-red-500 animate-pulse text-3xl">● APOCALYPSE ACTIVE</span>
          </div>
          <div className="space-y-4">
            {systemAlerts.slice(-8).map((alert) => (
              <div key={alert.id} className="font-mono text-lg flex items-center">
                <span className="text-gray-500 mr-6 min-w-28">[{alert.timestamp}]</span>
                <span className="mr-6 min-w-24 font-bold" style={{ color: alert.color }}>
                  {alert.priority}
                </span>
                <span className="text-cyan-400 mr-6 min-w-28">{alert.source}</span>
                <span className="text-gray-300 flex-1">{Math.random() > 0.5 ? alert.message : alert.messageAr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Professional Developer Attribution */}
      <div className="absolute bottom-10 right-10 z-40">
        <div className="bg-gradient-to-r from-purple-900/80 to-blue-900/80 backdrop-blur-xl border-2 border-purple-500/80 rounded-2xl px-10 py-6 shadow-2xl">
          <div className="text-purple-300 font-bold text-2xl animate-pulse font-mono">
            تم تطوير النظام بواسطة Boon
          </div>
        </div>
      </div>

      {/* Professional CSS Animations */}
      <style>{`
        @keyframes terror-matrix-fall {
          0% { transform: translateY(-80px) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(15deg); opacity: 0; }
        }
        
        @keyframes terror-chaos-glitch {
          0%, 100% { opacity: 1; transform: translateX(0) scaleX(1); }
          20% { opacity: 0.6; transform: translateX(-8px) scaleX(0.85); }
          40% { opacity: 0.4; transform: translateX(8px) scaleX(1.15); }
          60% { opacity: 0.7; transform: translateX(-5px) scaleX(0.92); }
          80% { opacity: 0.5; transform: translateX(5px) scaleX(1.08); }
        }
        
        @keyframes terror-scan-line {
          0% { transform: translateY(-100vh); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-1200 { animation-delay: 1.2s; }
        .animation-delay-1800 { animation-delay: 1.8s; }
        .animation-delay-2400 { animation-delay: 2.4s; }
      `}</style>
    </div>
  )
}

export default App
