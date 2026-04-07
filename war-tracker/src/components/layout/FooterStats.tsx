import { useState, useEffect } from 'react';
import { Users, Activity, Wifi } from 'lucide-react';

const BACKEND_API_URL = 'https://war-tracker-backend-kriplmgy.fly.dev';

export default function FooterStats() {
  const [stats, setStats] = useState({ connectedClients: 0, todayEvents: 0, totalEvents: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const resp = await fetch(`${BACKEND_API_URL}/api/stats`);
        if (resp.ok) {
          const data = await resp.json();
          setStats(data);
        }
      } catch {
        // silently ignore
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-sm">
      <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Users className="w-3 h-3" />
            <span><span className="text-gray-300 font-semibold">{stats.connectedClients}</span> متصل الآن</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Activity className="w-3 h-3" />
            <span><span className="text-gray-300 font-semibold">{stats.todayEvents}</span> حدث اليوم</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Wifi className="w-3 h-3 text-green-500" />
          <span>WarScope v1.1</span>
        </div>
      </div>
    </footer>
  );
}
