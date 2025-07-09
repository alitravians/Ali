import './App.css'
import { useEffect, useState, useRef } from 'react'

function App() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentEffect, setCurrentEffect] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const effects = [
    'animate-pulse',
    'animate-bounce',
    'animate-ping',
    'animate-spin'
  ]

  useEffect(() => {
    setIsVisible(true)
    
    const effectInterval = setInterval(() => {
      setCurrentEffect((prev) => (prev + 1) % effects.length)
    }, 3000)

    if (audioRef.current) {
      audioRef.current.volume = 0.5
      audioRef.current.play().catch(console.log)
    }

    return () => {
      clearInterval(effectInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center" dir="rtl">
      {/* WWE-style spotlight effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-red-500/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Wrestling ring ropes effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        <div className="absolute top-32 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        <div className="absolute top-44 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
        <div className="absolute bottom-20 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        <div className="absolute bottom-32 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        <div className="absolute bottom-44 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
      </div>

      {/* Main content container */}
      <div className={`max-w-5xl mx-auto p-8 text-center relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        
        {/* Championship belt style header */}
        <div className="relative mb-16">
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 p-8 rounded-full mx-auto w-80 h-80 flex items-center justify-center border-8 border-yellow-600 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-4 border-4 border-yellow-300 rounded-full"></div>
            <div className="absolute inset-8 border-2 border-yellow-200 rounded-full"></div>
            
            {/* Championship center */}
            <div className="bg-red-600 w-32 h-32 rounded-full flex items-center justify-center border-4 border-red-800 relative z-10">
              <div className="text-6xl font-black text-yellow-300 transform rotate-45">
                ✕
              </div>
            </div>
            
            {/* Side decorations */}
            <div className="absolute top-8 left-8 w-12 h-12 bg-red-600 rounded-full border-2 border-red-800"></div>
            <div className="absolute top-8 right-8 w-12 h-12 bg-red-600 rounded-full border-2 border-red-800"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 bg-red-600 rounded-full border-2 border-red-800"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 bg-red-600 rounded-full border-2 border-red-800"></div>
          </div>
        </div>

        {/* Main title with WWE-style typography */}
        <div className="mb-12">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 mb-6 tracking-wider transform hover:scale-105 transition-transform duration-300">
            الموقع مغلق نهائياً
          </h1>
          
          {/* Championship nameplate style */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 p-4 rounded-lg border-4 border-yellow-400 mx-auto max-w-4xl">
            <div className="bg-black/50 p-6 rounded border-2 border-yellow-300">
              <h2 className="text-3xl font-bold text-yellow-300 mb-4">
                تم إغلاق نظام الدردشة المتطور بشكل نهائي
              </h2>
            </div>
          </div>
        </div>

        {/* Content sections with wrestling theme */}
        <div className="space-y-8 mb-16">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 p-6 rounded-lg border-4 border-yellow-400 transform hover:scale-105 transition-transform duration-300">
            <div className="bg-black/50 p-6 rounded border-2 border-yellow-300">
              <p className="text-2xl font-bold text-yellow-300 mb-2">
                شكراً لكم على استخدام الموقع وتجربة النظام
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping delay-200"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping delay-400"></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-600 p-6 rounded-lg border-4 border-yellow-400 transform hover:scale-105 transition-transform duration-300">
            <div className="bg-black/50 p-6 rounded border-2 border-yellow-300">
              <p className="text-xl font-bold text-yellow-300">
                تم الانتهاء من فترة التجربة والاختبار بنجاح
              </p>
            </div>
          </div>
        </div>

        {/* Championship footer */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 p-6 rounded-lg border-4 border-yellow-400">
          <div className="bg-black/50 p-8 rounded border-2 border-yellow-300">
            <p className="text-2xl font-bold text-yellow-300 mb-4">
              تم تطوير النظام بواسطة 
              <span className={`text-red-400 font-black text-3xl mx-2 ${effects[currentEffect]}`}>
                Boon
              </span>
            </p>
            
            {/* Championship stars */}
            <div className="flex justify-center space-x-4 mb-4">
              <div className="text-yellow-400 text-2xl animate-spin">⭐</div>
              <div className="text-red-400 text-2xl animate-pulse">🏆</div>
              <div className="text-blue-400 text-2xl animate-bounce">💪</div>
              <div className="text-green-400 text-2xl animate-ping">🎯</div>
              <div className="text-yellow-400 text-2xl animate-spin">⭐</div>
            </div>
            
            <p className="text-lg text-yellow-200 font-semibold">
              جميع الحقوق محفوظة © 2025
            </p>
          </div>
        </div>
      </div>

      {/* Floating championship elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl animate-bounce"
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 90 + 5}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            {i % 4 === 0 ? '🏆' : i % 4 === 1 ? '⭐' : i % 4 === 2 ? '💪' : '🎯'}
          </div>
        ))}
      </div>

      {/* John Cena Theme Music */}
      <audio ref={audioRef} loop autoPlay>
        <source src="https://www.myinstants.com/media/sounds/john-cena-theme-song.mp3" type="audio/mpeg" />
        <source src="https://archive.org/download/JohnCenaThemeSong/John%20Cena%20Theme%20Song.mp3" type="audio/mpeg" />
      </audio>
    </div>
  )
}

export default App
