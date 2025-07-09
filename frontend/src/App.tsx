import './App.css'
import { useEffect, useState, useRef } from 'react'

function App() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentGradient, setCurrentGradient] = useState(0)
  const [waterDrops, setWaterDrops] = useState<Array<{id: number, x: number, delay: number, size: number, speed: number}>>([])
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([])
  const waterAudioRef = useRef<HTMLAudioElement>(null)
  
  const gradients = [
    'from-blue-600 via-cyan-400 to-teal-300',
    'from-slate-600 via-blue-400 to-cyan-300', 
    'from-teal-600 via-emerald-400 to-blue-300',
    'from-cyan-600 via-sky-400 to-slate-300',
    'from-blue-700 via-teal-500 to-cyan-400'
  ]

  useEffect(() => {
    const drops = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 8,
      size: Math.random() * 3 + 2,
      speed: Math.random() * 2 + 3
    }))
    setWaterDrops(drops)
  }, [])

  useEffect(() => {
    setIsVisible(true)
    
    const gradientInterval = setInterval(() => {
      setCurrentGradient((prev) => (prev + 1) % gradients.length)
    }, 5000)

    const rippleInterval = setInterval(() => {
      const newRipple = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100
      }
      setRipples(prev => [...prev.slice(-6), newRipple])
    }, 2000)

    const playAudio = () => {
      if (waterAudioRef.current) {
        waterAudioRef.current.volume = 0.4
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
    <div 
      className={`min-h-screen bg-gradient-to-br ${gradients[currentGradient]} relative overflow-hidden flex items-center justify-center transition-all duration-[5000ms] ease-in-out`} 
      dir="rtl"
      style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
    >
      
      {/* 3D Water Environment Container */}
      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* Realistic Falling Water Drops */}
        <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          {waterDrops.map((drop) => (
            <div
              key={drop.id}
              className="absolute bg-gradient-to-b from-blue-200 via-cyan-300 to-blue-400 rounded-full opacity-80 animate-water-fall shadow-lg"
              style={{
                left: `${drop.x}%`,
                width: `${drop.size}px`,
                height: `${drop.size * 3}px`,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${drop.speed}s`,
                filter: 'blur(0.3px) drop-shadow(0 2px 4px rgba(59, 130, 246, 0.4))',
                transform: `translateZ(${drop.size * 5}px)`,
                background: `linear-gradient(180deg, 
                  rgba(147, 197, 253, 0.9) 0%, 
                  rgba(59, 130, 246, 0.8) 50%, 
                  rgba(29, 78, 216, 0.7) 100%)`,
                boxShadow: `
                  0 0 ${drop.size}px rgba(59, 130, 246, 0.6),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `
              }}
            />
          ))}
        </div>

        {/* 3D Water Surface Simulation */}
        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-50">
          <div 
            className="w-full h-full bg-gradient-to-t from-blue-500/60 to-transparent animate-wave"
            style={{
              transform: 'rotateX(80deg) translateZ(-20px)',
              transformOrigin: 'bottom',
              background: `
                linear-gradient(90deg, 
                  transparent 0%, 
                  rgba(59, 130, 246, 0.4) 25%, 
                  rgba(147, 197, 253, 0.5) 50%, 
                  rgba(59, 130, 246, 0.4) 75%, 
                  transparent 100%
                )`,
              animation: 'wave 4s ease-in-out infinite'
            }}
          />
        </div>

        {/* 3D Glass Overlay with Depth */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/8 backdrop-blur-sm"
          style={{ transform: 'translateZ(10px)' }}
        />
        
        {/* 3D Floating Glass Spheres */}
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/12 backdrop-blur-lg border border-white/25 animate-float-3d shadow-2xl"
              style={{
                width: `${60 + i * 15}px`,
                height: `${60 + i * 15}px`,
                left: `${Math.random() * 85 + 5}%`,
                top: `${Math.random() * 85 + 5}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${8 + i * 1.2}s`,
                transform: `translateZ(${i * 25 + 20}px) rotateX(${i * 10}deg) rotateY(${i * 8}deg)`,
                transformStyle: 'preserve-3d',
                background: `
                  radial-gradient(circle at 30% 30%, 
                    rgba(255,255,255,0.4), 
                    rgba(255,255,255,0.1), 
                    rgba(59, 130, 246, 0.1)
                  )`,
                boxShadow: `
                  0 ${8 + i * 3}px ${20 + i * 5}px rgba(0,0,0,0.3), 
                  inset 0 2px 0 rgba(255,255,255,0.4),
                  0 0 ${10 + i * 2}px rgba(59, 130, 246, 0.2)
                `
              }}
            >
              {/* 3D Highlight Effect */}
              <div 
                className="absolute top-3 left-3 w-4 h-4 bg-white/50 rounded-full blur-sm"
                style={{ transform: 'translateZ(5px)' }}
              />
            </div>
          ))}
        </div>
        
        {/* 3D Water Ripples with Depth */}
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute border-2 border-cyan-300/50 rounded-full animate-ping-slow"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              width: '20px',
              height: '20px',
              animationDuration: '4s',
              transform: `translateZ(${Math.random() * 30 + 10}px) rotateX(${Math.random() * 20}deg)`,
              transformStyle: 'preserve-3d',
              boxShadow: '0 0 15px rgba(34, 211, 238, 0.4)'
            }}
          >
            <div 
              className="absolute inset-4 border border-cyan-200/40 rounded-full animate-ping-slow"
              style={{ 
                animationDelay: '0.5s',
                transform: 'translateZ(5px)'
              }}
            />
            <div 
              className="absolute inset-6 border border-blue-200/30 rounded-full animate-ping-slow"
              style={{ 
                animationDelay: '1s',
                transform: 'translateZ(10px)'
              }}
            />
          </div>
        ))}
      </div>

      {/* Main 3D Content Container */}
      <div 
        className={`max-w-4xl mx-auto p-12 text-center relative z-20 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ 
          transform: 'translateZ(60px) rotateX(2deg)', 
          transformStyle: 'preserve-3d' 
        }}
      >
        
        {/* 3D Professional Header */}
        <div 
          className="bg-white/18 backdrop-blur-xl rounded-3xl border border-white/30 p-12 mb-12 shadow-2xl relative"
          style={{
            transform: 'translateZ(40px) rotateX(3deg) rotateY(-1deg)',
            transformStyle: 'preserve-3d',
            boxShadow: `
              0 30px 60px rgba(0,0,0,0.3), 
              inset 0 2px 0 rgba(255,255,255,0.2),
              0 0 40px rgba(59, 130, 246, 0.1)
            `
          }}
        >
          <div className="mb-8">
            {/* 3D Water Drop Icon */}
            <div 
              className="mx-auto w-28 h-28 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mb-8 shadow-2xl relative"
              style={{
                transform: 'translateZ(30px)',
                background: `
                  radial-gradient(circle at 30% 30%, 
                    #60a5fa, 
                    #3b82f6, 
                    #1d4ed8
                  )`,
                boxShadow: `
                  0 15px 30px rgba(59, 130, 246, 0.5), 
                  inset 0 2px 0 rgba(255,255,255,0.4),
                  0 0 20px rgba(59, 130, 246, 0.3)
                `
              }}
            >
              <div className="text-5xl text-white drop-shadow-lg">💧</div>
              {/* 3D Highlight */}
              <div 
                className="absolute top-3 left-3 w-6 h-6 bg-white/50 rounded-full blur-sm"
                style={{ transform: 'translateZ(8px)' }}
              />
            </div>
            
            <h1 
              className="text-8xl font-light text-white mb-6 tracking-wide relative"
              style={{
                transform: 'translateZ(25px)',
                textShadow: `
                  0 6px 12px rgba(0,0,0,0.4), 
                  0 0 30px rgba(255,255,255,0.1),
                  0 2px 4px rgba(59, 130, 246, 0.2)
                `,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }}
            >
              الموقع مغلق نهائياً
            </h1>
            
            <div 
              className="w-40 h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-400 mx-auto rounded-full mb-8 shadow-lg"
              style={{
                transform: 'translateZ(20px)',
                boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)'
              }}
            />
          </div>
          
          <h2 
            className="text-4xl font-medium text-white/95 mb-6"
            style={{
              transform: 'translateZ(15px)',
              textShadow: '0 3px 6px rgba(0,0,0,0.3)'
            }}
          >
            تم إغلاق نظام الدردشة المتطور بشكل نهائي
          </h2>
          
          <div 
            className="flex justify-center space-x-3 mb-6"
            style={{ transform: 'translateZ(10px)' }}
          >
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-200 shadow-lg"></div>
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse delay-400 shadow-lg"></div>
          </div>
        </div>

        {/* 3D Content Sections */}
        <div className="space-y-8 mb-12" style={{ transformStyle: 'preserve-3d' }}>
          
          {/* 3D Thank You Section */}
          <div 
            className="bg-white/16 backdrop-blur-xl rounded-2xl border border-white/25 p-8 shadow-xl hover:bg-white/20 transition-all duration-300 relative"
            style={{
              transform: 'translateZ(25px) rotateX(1deg)',
              transformStyle: 'preserve-3d',
              boxShadow: '0 15px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            <div className="flex items-center justify-center mb-4">
              <div 
                className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mr-4 shadow-lg"
                style={{
                  transform: 'translateZ(10px)',
                  boxShadow: '0 8px 16px rgba(20, 184, 166, 0.4)'
                }}
              >
                <div className="text-2xl text-white">✨</div>
              </div>
              <h3 
                className="text-3xl font-medium text-white"
                style={{
                  transform: 'translateZ(8px)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                شكراً لكم على الاستخدام
              </h3>
            </div>
            <p 
              className="text-xl text-white/90 leading-relaxed"
              style={{
                transform: 'translateZ(5px)',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              شكراً لكم على استخدام الموقع وتجربة النظام المتطور
            </p>
          </div>

          {/* 3D Completion Section */}
          <div 
            className="bg-white/16 backdrop-blur-xl rounded-2xl border border-white/25 p-8 shadow-xl hover:bg-white/20 transition-all duration-300 relative"
            style={{
              transform: 'translateZ(20px) rotateX(-1deg)',
              transformStyle: 'preserve-3d',
              boxShadow: '0 12px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            <div className="flex items-center justify-center mb-4">
              <div 
                className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg"
                style={{
                  transform: 'translateZ(10px)',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)'
                }}
              >
                <div className="text-2xl text-white">🎯</div>
              </div>
              <h3 
                className="text-3xl font-medium text-white"
                style={{
                  transform: 'translateZ(8px)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                انتهاء فترة التجربة
              </h3>
            </div>
            <p 
              className="text-xl text-white/90 leading-relaxed"
              style={{
                transform: 'translateZ(5px)',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              تم الانتهاء من فترة التجربة والاختبار بنجاح
            </p>
          </div>
        </div>

        {/* 3D Professional Footer */}
        <div 
          className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 p-10 shadow-2xl relative"
          style={{
            transform: 'translateZ(30px) rotateX(2deg)',
            transformStyle: 'preserve-3d',
            boxShadow: `
              0 25px 50px rgba(0,0,0,0.3), 
              inset 0 2px 0 rgba(255,255,255,0.2),
              0 0 30px rgba(147, 51, 234, 0.1)
            `
          }}
        >
          <div className="flex items-center justify-center mb-6">
            <div 
              className="w-18 h-18 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center mr-4 shadow-lg"
              style={{
                transform: 'translateZ(15px)',
                boxShadow: '0 10px 20px rgba(168, 85, 247, 0.4)'
              }}
            >
              <div className="text-3xl text-white">👨‍💻</div>
            </div>
            <div style={{ transform: 'translateZ(12px)' }}>
              <p 
                className="text-3xl font-medium text-white mb-2"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              >
                تم تطوير النظام بواسطة
              </p>
              <p 
                className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 animate-pulse relative"
                style={{
                  transform: 'translateZ(8px)',
                  filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))'
                }}
              >
                Boon
              </p>
            </div>
          </div>
          
          <div 
            className="flex justify-center space-x-8 mb-6"
            style={{ transform: 'translateZ(10px)' }}
          >
            <div className="text-cyan-400 text-3xl animate-bounce shadow-lg">💎</div>
            <div className="text-blue-400 text-3xl animate-bounce delay-200 shadow-lg">🌊</div>
            <div className="text-teal-400 text-3xl animate-bounce delay-400 shadow-lg">🔮</div>
            <div className="text-emerald-400 text-3xl animate-bounce delay-600 shadow-lg">✨</div>
          </div>
          
          <p 
            className="text-xl text-white/95 font-medium"
            style={{
              transform: 'translateZ(5px)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            جميع الحقوق محفوظة © 2025
          </p>
        </div>
      </div>

      {/* 3D Floating Water Elements */}
      <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-40 animate-float-3d"
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 90 + 5}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
              transform: `translateZ(${Math.random() * 50 + 20}px) rotateX(${Math.random() * 20}deg)`,
              transformStyle: 'preserve-3d',
              filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))'
            }}
          >
            {i % 4 === 0 ? '💧' : i % 4 === 1 ? '🌊' : i % 4 === 2 ? '💎' : '🔵'}
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
