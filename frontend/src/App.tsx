import './App.css'
import { useEffect, useState, useRef } from 'react'

function App() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentEffect, setCurrentEffect] = useState(0)
  const [currentWrestler, setCurrentWrestler] = useState(0)
  const mergedAudioRef = useRef<HTMLAudioElement>(null)
  
  const effects = [
    'animate-pulse',
    'animate-bounce',
    'animate-ping',
    'animate-spin'
  ]

  const wrestlers = ['جون سينا', 'بريت هارت']

  useEffect(() => {
    setIsVisible(true)
    
    const effectInterval = setInterval(() => {
      setCurrentEffect((prev) => (prev + 1) % effects.length)
    }, 2000)

    const wrestlerInterval = setInterval(() => {
      setCurrentWrestler((prev) => (prev + 1) % wrestlers.length)
    }, 4000)

    const playAudio = () => {
      if (mergedAudioRef.current) {
        mergedAudioRef.current.volume = 0.5
        mergedAudioRef.current.play().catch(() => {
          document.addEventListener('click', () => {
            mergedAudioRef.current?.play().catch(console.log)
          }, { once: true })
        })
      }
    }

    setTimeout(playAudio, 1000)

    return () => {
      clearInterval(effectInterval)
      clearInterval(wrestlerInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center" dir="rtl">
      {/* Wrestling Arena Background with John Cena and Bret Hart Combined */}
      <div className="absolute inset-0">
        {/* Single Combined John Cena and Bret Hart Background */}
        <div className="absolute inset-0 opacity-60 bg-cover bg-center bg-no-repeat" 
             style={{backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRk5PGsD9qkw75AS3VOo2UzQXTy6eQden0LQw&s')"}}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-purple-600/30 to-pink-600/40"></div>
        </div>
        
        {/* Wrestling ring center overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/40 to-black/70"></div>
        
        {/* Arena lighting effects */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-pink-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-0 right-1/3 w-40 h-40 bg-red-400/20 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>

      {/* Wrestling ring ropes effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-white to-pink-500 shadow-lg"></div>
        <div className="absolute top-32 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-white to-blue-500 shadow-lg"></div>
        <div className="absolute top-44 left-0 right-0 h-2 bg-gradient-to-r from-yellow-500 via-white to-red-500 shadow-lg"></div>
        <div className="absolute bottom-20 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-white to-yellow-500 shadow-lg"></div>
        <div className="absolute bottom-32 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-white to-pink-500 shadow-lg"></div>
        <div className="absolute bottom-44 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-white to-blue-500 shadow-lg"></div>
      </div>

      {/* Main content container */}
      <div className={`max-w-6xl mx-auto p-8 text-center relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        
        {/* Wrestling Championship Header with Both Wrestlers */}
        <div className="relative mb-16">
          {/* John Cena side */}
          <div className="absolute left-0 top-0 w-32 h-32 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
            <div className="text-white font-black text-lg">CENA</div>
          </div>
          
          {/* Bret Hart side */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-r from-pink-600 to-pink-800 rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
            <div className="text-white font-black text-lg">HART</div>
          </div>
          
          {/* Main Championship Belt */}
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 p-8 rounded-full mx-auto w-96 h-96 flex items-center justify-center border-8 border-yellow-600 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-4 border-4 border-yellow-300 rounded-full"></div>
            <div className="absolute inset-8 border-2 border-yellow-200 rounded-full"></div>
            
            {/* Championship center with wrestler names */}
            <div className="bg-red-600 w-40 h-40 rounded-full flex flex-col items-center justify-center border-4 border-red-800 relative z-10">
              <div className="text-yellow-300 font-black text-sm mb-1">{wrestlers[currentWrestler]}</div>
              <div className="text-6xl font-black text-yellow-300 transform rotate-45">
                ✕
              </div>
            </div>
            
            {/* Side decorations with wrestler colors */}
            <div className="absolute top-8 left-8 w-12 h-12 bg-blue-600 rounded-full border-2 border-blue-800"></div>
            <div className="absolute top-8 right-8 w-12 h-12 bg-pink-600 rounded-full border-2 border-pink-800"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 bg-blue-600 rounded-full border-2 border-blue-800"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 bg-pink-600 rounded-full border-2 border-pink-800"></div>
          </div>
        </div>

        {/* Main title with Wrestling-style typography */}
        <div className="mb-12">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-yellow-400 to-pink-400 mb-6 tracking-wider transform hover:scale-105 transition-transform duration-300 drop-shadow-2xl">
            الموقع مغلق نهائياً
          </h1>
          
          {/* Wrestling nameplate style */}
          <div className="bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 p-6 rounded-lg border-4 border-white mx-auto max-w-5xl shadow-2xl">
            <div className="bg-black/70 p-8 rounded border-2 border-yellow-300">
              <h2 className="text-4xl font-bold text-yellow-300 mb-4 drop-shadow-lg">
                تم إغلاق نظام الدردشة المتطور بشكل نهائي
              </h2>
              <div className="text-2xl font-bold text-white">
                🏆 JOHN CENA vs BRET HART 🏆
              </div>
            </div>
          </div>
        </div>

        {/* Content sections with wrestling theme */}
        <div className="space-y-8 mb-16">
          {/* John Cena themed section */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-6 rounded-lg border-4 border-white transform hover:scale-105 transition-transform duration-300 shadow-2xl">
            <div className="bg-black/70 p-8 rounded border-2 border-blue-300">
              <p className="text-3xl font-bold text-white mb-4">
                شكراً لكم على استخدام الموقع وتجربة النظام
              </p>
              <div className="text-xl text-blue-200 font-bold mb-4">
                "YOU CAN'T SEE ME!" - JOHN CENA
              </div>
              <div className="flex justify-center space-x-4">
                <div className="w-6 h-6 bg-blue-400 rounded-full animate-ping"></div>
                <div className="w-6 h-6 bg-white rounded-full animate-ping delay-200"></div>
                <div className="w-6 h-6 bg-blue-400 rounded-full animate-ping delay-400"></div>
              </div>
            </div>
          </div>

          {/* Bret Hart themed section */}
          <div className="bg-gradient-to-r from-pink-600 via-pink-700 to-pink-800 p-6 rounded-lg border-4 border-white transform hover:scale-105 transition-transform duration-300 shadow-2xl">
            <div className="bg-black/70 p-8 rounded border-2 border-pink-300">
              <p className="text-2xl font-bold text-white mb-4">
                تم الانتهاء من فترة التجربة والاختبار بنجاح
              </p>
              <div className="text-xl text-pink-200 font-bold mb-4">
                "THE BEST THERE IS, THE BEST THERE WAS, THE BEST THERE EVER WILL BE!" - BRET HART
              </div>
              <div className="flex justify-center space-x-4">
                <div className="w-6 h-6 bg-pink-400 rounded-full animate-ping"></div>
                <div className="w-6 h-6 bg-white rounded-full animate-ping delay-200"></div>
                <div className="w-6 h-6 bg-pink-400 rounded-full animate-ping delay-400"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Championship footer with both wrestlers */}
        <div className="bg-gradient-to-r from-purple-600 via-yellow-500 to-purple-600 p-6 rounded-lg border-4 border-white shadow-2xl">
          <div className="bg-black/70 p-8 rounded border-2 border-yellow-300">
            <p className="text-3xl font-bold text-yellow-300 mb-6">
              تم تطوير النظام بواسطة 
              <span className={`text-red-400 font-black text-4xl mx-2 ${effects[currentEffect]} drop-shadow-lg`}>
                Boon
              </span>
            </p>
            
            {/* Wrestling championship elements */}
            <div className="flex justify-center space-x-6 mb-6">
              <div className="text-blue-400 text-3xl animate-spin">🥊</div>
              <div className="text-yellow-400 text-3xl animate-pulse">🏆</div>
              <div className="text-pink-400 text-3xl animate-bounce">💪</div>
              <div className="text-red-400 text-3xl animate-ping">🎯</div>
              <div className="text-blue-400 text-3xl animate-spin">🥊</div>
            </div>
            
            <div className="text-2xl font-bold text-white mb-4">
              🏆 WRESTLING LEGENDS TRIBUTE 🏆
            </div>
            
            <p className="text-xl text-yellow-200 font-semibold">
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

      {/* Merged Wrestling Theme Music (John Cena + Bret Hart) */}
      <audio ref={mergedAudioRef} loop preload="auto">
        <source src="/merged_wrestling_theme.mp3" type="audio/mpeg" />
      </audio>
    </div>
  )
}

export default App
