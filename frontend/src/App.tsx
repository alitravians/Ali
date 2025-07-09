import './App.css'
import { useEffect, useState, useRef } from 'react'

function App() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentGradient, setCurrentGradient] = useState(0)
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([])
  const waterAudioRef = useRef<HTMLAudioElement>(null)
  
  const gradients = [
    'from-blue-50 via-cyan-100 to-blue-200',
    'from-slate-50 via-gray-100 to-slate-200', 
    'from-teal-50 via-emerald-100 to-teal-200',
    'from-sky-50 via-blue-100 to-sky-200',
    'from-indigo-50 via-purple-100 to-indigo-200'
  ]

  useEffect(() => {
    setIsVisible(true)
    
    const gradientInterval = setInterval(() => {
      setCurrentGradient((prev) => (prev + 1) % gradients.length)
    }, 4000)

    const rippleInterval = setInterval(() => {
      const newRipple = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100
      }
      setRipples(prev => [...prev.slice(-4), newRipple])
    }, 3000)

    const playAudio = () => {
      if (waterAudioRef.current) {
        waterAudioRef.current.volume = 0.3
        waterAudioRef.current.play().catch(() => {
          document.addEventListener('click', () => {
            waterAudioRef.current?.play().catch(console.log)
          }, { once: true })
        })
      }
    }

    setTimeout(playAudio, 1000)

    return () => {
      clearInterval(gradientInterval)
      clearInterval(rippleInterval)
    }
  }, [])

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradients[currentGradient]} relative overflow-hidden flex items-center justify-center transition-all duration-4000 ease-in-out`} dir="rtl">
      
      {/* Elegant water-inspired background patterns */}
      <div className="absolute inset-0">
        {/* Subtle glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 backdrop-blur-sm"></div>
        
        {/* Floating glass orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full backdrop-blur-md border border-white/20 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-cyan-100/20 rounded-full backdrop-blur-md border border-cyan-200/30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-40 w-28 h-28 bg-blue-100/15 rounded-full backdrop-blur-md border border-blue-200/25 animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-slate-100/10 rounded-full backdrop-blur-md border border-slate-200/20 animate-pulse delay-3000"></div>
        
        {/* Water ripples */}
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute w-4 h-4 border-2 border-cyan-300/40 rounded-full animate-ping"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              animationDuration: '3s'
            }}
          >
            <div className="absolute inset-2 border border-cyan-200/30 rounded-full animate-ping delay-500"></div>
          </div>
        ))}
      </div>

      {/* Main content container with glass morphism */}
      <div className={`max-w-4xl mx-auto p-12 text-center relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        
        {/* Professional header with glass effect */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl border border-white/30 p-12 mb-12 shadow-2xl">
          <div className="mb-8">
            {/* Elegant water drop icon */}
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mb-8 shadow-lg">
              <div className="text-4xl text-white">💧</div>
            </div>
            
            <h1 className="text-7xl font-light text-slate-700 mb-6 tracking-wide">
              الموقع مغلق نهائياً
            </h1>
            
            <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto rounded-full mb-8"></div>
          </div>
          
          <h2 className="text-3xl font-medium text-slate-600 mb-6">
            تم إغلاق نظام الدردشة المتطور بشكل نهائي
          </h2>
          
          <div className="flex justify-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-400"></div>
          </div>
        </div>

        {/* Content sections with elegant glass cards */}
        <div className="space-y-8 mb-12">
          
          {/* Thank you section */}
          <div className="bg-white/15 backdrop-blur-lg rounded-2xl border border-white/25 p-8 shadow-xl hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mr-4">
                <div className="text-xl text-white">✨</div>
              </div>
              <h3 className="text-2xl font-medium text-slate-700">شكراً لكم على الاستخدام</h3>
            </div>
            <p className="text-lg text-slate-600 leading-relaxed">
              شكراً لكم على استخدام الموقع وتجربة النظام المتطور
            </p>
          </div>

          {/* Completion section */}
          <div className="bg-white/15 backdrop-blur-lg rounded-2xl border border-white/25 p-8 shadow-xl hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mr-4">
                <div className="text-xl text-white">🎯</div>
              </div>
              <h3 className="text-2xl font-medium text-slate-700">انتهاء فترة التجربة</h3>
            </div>
            <p className="text-lg text-slate-600 leading-relaxed">
              تم الانتهاء من فترة التجربة والاختبار بنجاح
            </p>
          </div>
        </div>

        {/* Professional footer with developer credit */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl border border-white/30 p-10 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mr-4">
              <div className="text-2xl text-white">👨‍💻</div>
            </div>
            <div>
              <p className="text-2xl font-medium text-slate-700 mb-2">
                تم تطوير النظام بواسطة
              </p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse">
                Boon
              </p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-6 mb-6">
            <div className="text-cyan-500 text-2xl animate-bounce">💎</div>
            <div className="text-blue-500 text-2xl animate-bounce delay-200">🌊</div>
            <div className="text-slate-500 text-2xl animate-bounce delay-400">🔮</div>
            <div className="text-teal-500 text-2xl animate-bounce delay-600">✨</div>
          </div>
          
          <p className="text-lg text-slate-600 font-medium">
            جميع الحقوق محفوظة © 2025
          </p>
        </div>
      </div>

      {/* Floating elegant elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-30 animate-float"
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 90 + 5}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${6 + Math.random() * 3}s`
            }}
          >
            {i % 3 === 0 ? '💧' : i % 3 === 1 ? '🌊' : '💎'}
          </div>
        ))}
      </div>

      {/* Professional Water Sound Effect */}
      <audio ref={waterAudioRef} loop preload="auto">
        <source src="/water-sound.mp3" type="audio/mpeg" />
      </audio>
    </div>
  )
}

export default App
