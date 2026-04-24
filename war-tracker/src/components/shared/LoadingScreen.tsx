import { Radio } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20 animate-pulse">
          <Radio className="w-9 h-9 text-white" />
        </div>
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-2xl border-2 border-red-500/30 animate-ping" />
      </div>

      <h1 className="text-xl font-black text-white mb-1">WarScope</h1>
      <p className="text-xs text-gray-400 mb-8">مركز التتبع المباشر</p>

      {/* Loading bar */}
      <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-l from-red-500 to-orange-500 rounded-full loading-bar" />
      </div>
      <p className="text-[11px] text-gray-600 mt-3">جاري الاتصال بالمصادر...</p>
    </div>
  );
}
