import './App.css'
import { useEffect, useState, useRef } from 'react'

function App() {
  const [isVisible, setIsVisible] = useState(false)
  const [glitchText, setGlitchText] = useState('تم اختراق الموقع')
  const [matrixRain, setMatrixRain] = useState<Array<{id: number, x: number, chars: string[]}>>([])
  const [screenFlicker, setScreenFlicker] = useState(false)
  const [hackingMessages, setHackingMessages] = useState<string[]>([])
  const scaryAudioRef = useRef<HTMLAudioElement>(null)
  
  const glitchTexts = [
    'تم اختراق الموقع',
    'SYSTEM COMPROMISED',
    'الأمان مخترق',
    'ACCESS DENIED',
    'تحذير: اختراق أمني',
    'HACKED BY ANONYMOUS',
    'فشل الحماية',
    'SECURITY BREACH'
  ]

  const hackMessages = [
    'جاري اختراق قاعدة البيانات...',
    'تم الوصول إلى الملفات السرية',
    'فشل في الحماية الأمنية',
    'تم تسريب بيانات المستخدمين',
    'النظام تحت السيطرة',
    'لا يمكن استعادة الوصول',
    'تم كسر جدار الحماية',
    'اختراق كامل للخوادم'
  ]

  const matrixChars = ['0', '1', 'ا', 'ب', 'ت', 'ج', 'ح', 'خ', 'د', 'ر', 'س', 'ش', 'ص', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي']

  useEffect(() => {
    const rain = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      chars: Array.from({ length: 15 }, () => matrixChars[Math.floor(Math.random() * matrixChars.length)])
    }))
    setMatrixRain(rain)
  }, [])

  useEffect(() => {
    setIsVisible(true)
    
    const glitchInterval = setInterval(() => {
      setGlitchText(glitchTexts[Math.floor(Math.random() * glitchTexts.length)])
    }, 800)

    const flickerInterval = setInterval(() => {
      setScreenFlicker(true)
      setTimeout(() => setScreenFlicker(false), 100)
    }, 2000)

    const messageInterval = setInterval(() => {
      setHackingMessages(prev => {
        const newMessage = hackMessages[Math.floor(Math.random() * hackMessages.length)]
        return [...prev.slice(-3), newMessage]
      })
    }, 1500)

    const playAudio = () => {
      if (scaryAudioRef.current) {
        scaryAudioRef.current.volume = 0.3
        scaryAudioRef.current.loop = true
        scaryAudioRef.current.play().catch(error => {
          console.log('Audio autoplay failed:', error)
          const playOnClick = () => {
            if (scaryAudioRef.current) {
              scaryAudioRef.current.play()
              document.removeEventListener('click', playOnClick)
            }
          }
          document.addEventListener('click', playOnClick)
        })
      }
    }

    const audioTimeout = setTimeout(playAudio, 1000)

    return () => {
      clearInterval(glitchInterval)
      clearInterval(flickerInterval)
      clearInterval(messageInterval)
      clearTimeout(audioTimeout)
    }
  }, [])

  return (
    <div 
      className={`min-h-screen bg-black relative overflow-hidden flex items-center justify-center transition-all duration-300 ${screenFlicker ? 'brightness-200' : 'brightness-100'}`}
      dir="rtl"
      style={{
        background: `
          radial-gradient(circle at 20% 50%, rgba(255, 0, 0, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 255, 0, 0.2) 0%, transparent 50%),
          linear-gradient(180deg, #000000 0%, #1a0000 50%, #000000 100%)
        `,
        filter: screenFlicker ? 'hue-rotate(180deg) saturate(2)' : 'none'
      }}
    >
      
      {/* Matrix Rain Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {matrixRain.map((rain) => (
          <div
            key={rain.id}
            className="absolute text-green-400 font-mono text-sm opacity-70"
            style={{
              left: `${rain.x}%`,
              animation: `matrix-fall 4s linear infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          >
            {rain.chars.map((char, index) => (
              <div
                key={index}
                className="block leading-4"
                style={{
                  opacity: Math.max(0.1, 1 - (index * 0.1)),
                  color: index === 0 ? '#00ff00' : '#008800'
                }}
              >
                {char}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Glitch Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-red-500/20 h-1"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 200 + 50}px`,
              animation: `glitch-line 0.2s infinite alternate`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Hacked Content */}
      <div 
        className={`max-w-4xl mx-auto p-8 text-center relative z-20 transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        
        {/* Skull Icon */}
        <div className="mb-8">
          <div 
            className="mx-auto w-32 h-32 bg-gradient-to-br from-red-600 to-black rounded-full flex items-center justify-center mb-8 shadow-2xl border-4 border-red-500 relative"
            style={{
              boxShadow: `0 0 50px rgba(255, 0, 0, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.8)`,
              animation: 'skull-glow 2s ease-in-out infinite alternate'
            }}
          >
            <div className="text-6xl animate-pulse">💀</div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full animate-ping"></div>
          </div>
          
          <h1 
            className="text-7xl font-bold text-red-500 mb-6 tracking-wider relative font-mono"
            style={{
              textShadow: `0 0 10px rgba(255, 0, 0, 1), 0 0 20px rgba(255, 0, 0, 0.8), 2px 2px 0px rgba(0, 0, 0, 1)`,
              animation: 'text-glitch 0.5s infinite alternate'
            }}
          >
            {glitchText}
          </h1>
        </div>

        {/* Warning Messages */}
        <div className="space-y-6 mb-12">
          <div 
            className="bg-red-900/50 backdrop-blur-sm border-2 border-red-500 rounded-lg p-6 shadow-2xl relative overflow-hidden"
            style={{
              boxShadow: '0 0 30px rgba(255, 0, 0, 0.5)',
              animation: 'warning-pulse 1s infinite alternate'
            }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="text-4xl text-red-400 mr-4 animate-spin">⚠️</div>
              <h2 className="text-4xl font-bold text-red-300 font-mono">تحذير أمني خطير</h2>
            </div>
            <p className="text-2xl text-red-200 leading-relaxed font-mono">
              تم اختراق النظام بالكامل - جميع البيانات مكشوفة
            </p>
          </div>

          <div className="bg-black/80 border border-green-500 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="text-3xl text-green-400 mr-4">🔓</div>
              <h3 className="text-3xl font-bold text-green-400 font-mono">الوصول غير المصرح به</h3>
            </div>
            <p className="text-xl text-green-300 leading-relaxed font-mono">
              تم كسر جميع بروتوكولات الأمان - النظام تحت السيطرة
            </p>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="text-3xl text-yellow-400 mr-4 animate-bounce">💥</div>
              <h3 className="text-3xl font-bold text-yellow-400 font-mono">انتهاك البيانات</h3>
            </div>
            <p className="text-xl text-yellow-300 leading-relaxed font-mono">
              تم تسريب معلومات المستخدمين - لا يمكن ضمان الخصوصية
            </p>
          </div>
        </div>

        {/* Hacking Messages Terminal */}
        <div className="bg-black/90 border-2 border-green-500 rounded-lg p-6 mb-12 shadow-2xl font-mono">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-pulse delay-200"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse delay-400"></div>
            <span className="text-green-400 text-lg mr-4">HACKER TERMINAL</span>
          </div>
          <div className="text-left space-y-2">
            {hackingMessages.map((message, index) => (
              <div key={index} className="text-green-400 text-lg animate-pulse">
                <span className="text-red-400">root@hacked:~$</span> {message}
              </div>
            ))}
            <div className="text-green-400 text-lg">
              <span className="text-red-400">root@hacked:~$</span> 
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </div>

        {/* Additional Scary Warnings */}
        <div className="space-y-4 mb-12">
          <div className="bg-red-800/40 border border-red-400 rounded p-4">
            <p className="text-red-300 text-xl font-mono">🚨 تم إيقاف جميع الخدمات بسبب الاختراق الأمني</p>
          </div>
          <div className="bg-orange-800/40 border border-orange-400 rounded p-4">
            <p className="text-orange-300 text-xl font-mono">⚡ فشل في استعادة النظام - الضرر دائم</p>
          </div>
          <div className="bg-purple-800/40 border border-purple-400 rounded p-4">
            <p className="text-purple-300 text-xl font-mono">👾 المهاجمون لا يزالون يتحكمون في الخوادم</p>
          </div>
        </div>

        {/* Developer Credit - Hacker Style */}
        <div className="bg-red-900/30 backdrop-blur-sm border-2 border-red-600 rounded-lg p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-black rounded-full flex items-center justify-center mr-4 border-2 border-red-400">
              <div className="text-3xl animate-pulse">👨‍💻</div>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-300 mb-2 font-mono">تم تطوير النظام بواسطة</p>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-red-400 animate-pulse font-mono">
                Boon
              </p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-8 mb-6">
            <div className="text-red-400 text-3xl animate-bounce">💀</div>
            <div className="text-green-400 text-3xl animate-bounce delay-200">⚡</div>
            <div className="text-red-400 text-3xl animate-bounce delay-400">🔥</div>
            <div className="text-yellow-400 text-3xl animate-bounce delay-600">⚠️</div>
          </div>
          
          <p className="text-xl text-red-200 font-bold font-mono">النظام مخترق © 2025</p>
        </div>
      </div>

      {/* Floating Scary Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-60 animate-bounce"
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 90 + 5}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              color: i % 3 === 0 ? '#ff0000' : i % 3 === 1 ? '#00ff00' : '#ffff00',
              filter: 'drop-shadow(0 0 10px currentColor)'
            }}
          >
            {i % 4 === 0 ? '💀' : i % 4 === 1 ? '⚡' : i % 4 === 2 ? '🔥' : '⚠️'}
          </div>
        ))}
      </div>

      {/* Scary Audio */}
      <audio
        ref={scaryAudioRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="/horror_siren.wav" type="audio/wav" />
        <source src="/creepy_beep.wav" type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}

export default App
