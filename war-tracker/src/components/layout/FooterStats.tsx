import { useState, useEffect } from 'react';
import { Users, Activity, Wifi } from 'lucide-react';
import { useLiveData } from '../../context/LiveDataContext';

import { BACKEND_API_URL } from '../../config/api';

export default function FooterStats() {
  const { events, connectionStatus } = useLiveData();
  const [stats, setStats] = useState<{ connectedClients: number; todayEvents: number } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(`${BACKEND_API_URL}/api/stats`, { signal: controller.signal });
        clearTimeout(timeout);
        if (resp.ok) {
          const data = await resp.json();
          setStats(data);
        }
      } catch {
        // Backend stats endpoint unavailable — fallback to local data
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fallback: derive today's event count from live context when backend stats unavailable
  const todayEvents = stats?.todayEvents ?? events.filter(e => {
    const now = new Date();
    const eventDate = e.timestamp;
    return eventDate.getFullYear() === now.getFullYear() &&
           eventDate.getMonth() === now.getMonth() &&
           eventDate.getDate() === now.getDate();
  }).length;

  const connectedClients = stats?.connectedClients ?? (connectionStatus === 'connected' ? 1 : 0);

  return (
    <footer className="border-t border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-sm">
      {/* Developer Signature — Holographic Spotlight */}
      <div className="dev-signature">
        {/* Ambient glow */}
        <div className="dev-sig-ambient" aria-hidden="true" />

        <div className="max-w-[1920px] mx-auto flex flex-col items-center px-4 py-8 sm:py-12 relative z-10">
          {/* Decorative separator */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8 w-44 sm:w-56">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            <span className="dev-sig-diamond" />
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          </div>

          {/* Avatar with rotating ring */}
          <div className="dev-sig-avatar-wrap">
            <div className="dev-sig-avatar-ring" />
            <img
              src="/developer-ali.png"
              alt="Ali — Developer"
              className="dev-sig-avatar-img"
              width={120}
              height={120}
              loading="lazy"
            />
          </div>

          {/* Credit text */}
          <p className="text-[11px] sm:text-xs text-gray-400/70 tracking-wide mt-5 sm:mt-6 font-normal">
            تم تصميم و برمجة هذا الموقع بواسطة
          </p>

          {/* Holographic name */}
          <span className="dev-sig-name">Ali</span>

          {/* Copyright */}
          <p className="text-[9px] sm:text-[10px] text-gray-600/50 tracking-[0.2em] mt-3">
            جميع الحقوق محفوظة &copy; 2026
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between text-[9px] sm:text-[10px]">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-1.5 text-gray-500">
            <Users className="w-3 h-3" />
            <span><span className="text-gray-300 font-semibold">{connectedClients}</span> متصل</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-gray-500">
            <Activity className="w-3 h-3" />
            <span><span className="text-gray-300 font-semibold">{todayEvents}</span> حدث اليوم</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-gray-500">
          <Wifi className={`w-3 h-3 ${connectionStatus === 'connected' ? 'text-green-500' : connectionStatus === 'connecting' ? 'text-yellow-500' : 'text-red-500'}`} />
          <span>WarScope v1.1</span>
        </div>
      </div>
    </footer>
  );
}
