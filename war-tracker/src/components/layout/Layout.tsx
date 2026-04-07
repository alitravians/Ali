import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BreakingTicker from './BreakingTicker';
import FooterStats from './FooterStats';
import LoadingScreen from '../shared/LoadingScreen';
import { useLiveData } from '../../context/LiveDataContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { connectionStatus, events } = useLiveData();
  const [showLoading, setShowLoading] = useState(true);

  // Hide loading screen once connected and have data (or after 4s max)
  useEffect(() => {
    if (connectionStatus === 'connected' && events.length > 0) {
      const timer = setTimeout(() => setShowLoading(false), 600);
      return () => clearTimeout(timer);
    }
    const maxTimer = setTimeout(() => setShowLoading(false), 4000);
    return () => clearTimeout(maxTimer);
  }, [connectionStatus, events.length]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 font-[Cairo] flex flex-col">
      {showLoading && <LoadingScreen />}
      <BreakingTicker />
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="pt-[76px] sm:pt-[88px] md:pr-0 transition-all duration-300 flex-1">
        <Outlet />
      </main>
      <FooterStats />
    </div>
  );
}
