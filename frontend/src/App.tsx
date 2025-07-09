import './App.css'
import { useEffect, useState } from 'react'

function App() {
  const [currentGradient, setCurrentGradient] = useState(0)
  
  const gradients = [
    'from-purple-900 via-blue-900 to-indigo-900',
    'from-indigo-900 via-purple-900 to-pink-900',
    'from-blue-900 via-indigo-900 to-purple-900',
    'from-pink-900 via-purple-900 to-blue-900',
    'from-gray-900 via-purple-900 to-indigo-900'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGradient((prev) => (prev + 1) % gradients.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradients[currentGradient]} flex items-center justify-center transition-all duration-3000 ease-in-out relative overflow-hidden`} dir="rtl">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-4xl mx-auto p-8 text-center relative z-10">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-16 shadow-2xl border border-white/20 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          
          <div className="mb-12">
            {/* Enhanced icon with animation */}
            <div className="relative mx-auto mb-8 w-32 h-32">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            
            {/* Enhanced title with better typography */}
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-white mb-6 tracking-tight">
              الموقع مغلق نهائياً
            </h1>
            
            {/* Animated underline */}
            <div className="flex justify-center mb-8">
              <div className="w-48 h-2 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
          
          {/* Enhanced content with better spacing */}
          <div className="space-y-8 text-white/95 mb-12">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <p className="text-2xl leading-relaxed font-medium mb-4">
                تم إغلاق نظام الدردشة المتطور بشكل نهائي
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <p className="text-xl leading-relaxed font-medium mb-4">
                شكراً لكم على استخدام الموقع وتجربة النظام
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-lg text-white/80 leading-relaxed">
                تم الانتهاء من فترة التجربة والاختبار بنجاح
              </p>
            </div>
          </div>

          {/* Enhanced footer with better design */}
          <div className="mt-12 pt-8 border-t border-white/20 relative">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-lg text-white/80 font-semibold mb-3 tracking-wide">
                تم تطوير النظام بواسطة 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 font-bold text-xl mx-2 animate-pulse">
                  Boon
                </span>
              </p>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping delay-200"></div>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-ping delay-400"></div>
              </div>
              <p className="text-sm text-white/60 tracking-wider">
                جميع الحقوق محفوظة © 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
