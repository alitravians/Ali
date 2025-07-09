import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center" dir="rtl">
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/20">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              الموقع مغلق نهائياً
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-red-500 to-pink-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="space-y-6 text-white/90">
            <p className="text-xl leading-relaxed">
              تم إغلاق نظام الدردشة المتطور بشكل نهائي
            </p>
            <p className="text-lg leading-relaxed">
              شكراً لكم على استخدام الموقع وتجربة النظام
            </p>
            <p className="text-base text-white/70">
              تم الانتهاء من فترة التجربة والاختبار بنجاح
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-white/20">
            <p className="text-sm text-white/60">
              تم تطوير النظام بواسطة Boon
            </p>
            <p className="text-xs text-white/50 mt-2">
              جميع الحقوق محفوظة © 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
