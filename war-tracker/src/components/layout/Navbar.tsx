import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Radio, BarChart3, Globe2, Building2, Bell, Shield, Volume2, VolumeX, Clock, Activity, TrendingUp } from 'lucide-react';
import { useLiveData } from '../../context/LiveDataContext';
import EventSearch from '../shared/EventSearch';
import { useAlertSound } from '../../hooks/useAlertSound';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const navLinks = [
  { path: '/', label: 'الرئيسية', icon: Globe2 },
  { path: '/live', label: 'التتبع المباشر', icon: Radio },
  { path: '/analysis', label: 'التحليلات', icon: BarChart3 },
  { path: '/analytics', label: 'الإحصائيات', icon: TrendingUp },
  { path: '/sources', label: 'المصادر', icon: Globe2 },
  { path: '/cities', label: 'المدن', icon: Building2 },
  { path: '/alerts', label: 'التنبيهات', icon: Bell },
  { path: '/status', label: 'الحالة', icon: Activity },
  { path: '/admin', label: 'الإدارة', icon: Shield },
];

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const location = useLocation();
  const { events, newEventCount, lastUpdate } = useLiveData();
  const { isMuted, toggleMute, checkAndPlay } = useAlertSound();
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Live update timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Play sound on new breaking events
  useEffect(() => {
    const breakingCount = events.filter(e => e.isBreaking).length;
    checkAndPlay(breakingCount);
  }, [events, checkAndPlay]);

  const timerText = secondsAgo < 60
    ? `منذ ${secondsAgo} ث`
    : secondsAgo < 3600
    ? `منذ ${Math.floor(secondsAgo / 60)} د`
    : `منذ ${Math.floor(secondsAgo / 3600)} س`;

  return (
    <nav className="fixed top-[28px] sm:top-[32px] right-0 left-0 z-40 bg-[#12121a]/95 backdrop-blur-xl border-b border-gray-800/50 pm-navbar">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-12 sm:h-14 pm-navbar-inner">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">WarScope</span>
              <span className="text-[10px] text-gray-400 leading-tight">مركز التتبع المباشر</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 pm-hide">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                  {link.path === '/live' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Search + Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search */}
            <div className="hidden sm:block">
              <EventSearch events={events} />
            </div>

            {/* Live update timer */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800/50 text-[10px] text-gray-400 pm-hide">
              <Clock className="w-3 h-3" />
              <span>{timerText}</span>
            </div>

            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {newEventCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full animate-pulse">
                <span className="text-[10px] font-bold text-green-400">+{newEventCount}</span>
              </span>
            )}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 pm-hide">
              <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
              <span className="text-[11px] font-semibold text-red-400">LIVE</span>
            </div>
            <button
              onClick={onToggleSidebar}
              className="md:hidden pm-show-mobile p-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
