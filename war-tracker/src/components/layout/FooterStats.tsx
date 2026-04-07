import { useState, useEffect } from 'react';
import { Users, Activity, Wifi } from 'lucide-react';
import { useLiveData } from '../../context/LiveDataContext';

const BACKEND_API_URL = 'https://war-tracker-backend-kriplmgy.fly.dev';

export default function FooterStats() {
  const { events, connectionStatus } = useLiveData();
  const [stats, setStats] = useState<{ connectedClients: number; todayEvents: number } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const resp = await fetch(`${BACKEND_API_URL}/api/stats`);
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
      <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Users className="w-3 h-3" />
            <span><span className="text-gray-300 font-semibold">{connectedClients}</span> متصل الآن</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Activity className="w-3 h-3" />
            <span><span className="text-gray-300 font-semibold">{todayEvents}</span> حدث اليوم</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Wifi className={`w-3 h-3 ${connectionStatus === 'connected' ? 'text-green-500' : connectionStatus === 'connecting' ? 'text-yellow-500' : 'text-red-500'}`} />
          <span>WarScope v1.1</span>
        </div>
      </div>
    </footer>
  );
}
