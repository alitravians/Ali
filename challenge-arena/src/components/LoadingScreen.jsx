import { useEffect, useState } from 'react';

function LoadingScreen({ onLoadingComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    const maxTimeout = setTimeout(() => {
      clearInterval(interval);
      onLoadingComplete();
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(maxTimeout);
    };
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 flex items-center justify-center z-50">
      <div className="text-center space-y-8">
        {/* Logo/Title */}
        <div className="animate-pulse">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
            أرض التحديات
          </h1>
          <p className="text-xl md:text-2xl text-white/80">
            منصة التحديات الرسمية
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-80 md:w-96 mx-auto">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white mt-4 text-lg font-semibold">{progress}%</p>
        </div>

        {/* Animated Circles */}
        <div className="flex justify-center gap-3">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
