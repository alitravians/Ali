import { Link, useLocation } from 'react-router-dom';
import { X, Radio, BarChart3, Globe2, Building2, Bell, Shield, Home, Activity, TrendingUp } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { path: '/', label: 'الرئيسية', icon: Home },
  { path: '/live', label: 'التتبع المباشر', icon: Radio },
  { path: '/analysis', label: 'التحليلات', icon: BarChart3 },
  { path: '/analytics', label: 'الإحصائيات', icon: TrendingUp },
  { path: '/sources', label: 'المصادر', icon: Globe2 },
  { path: '/cities', label: 'المدن', icon: Building2 },
  { path: '/alerts', label: 'التنبيهات', icon: Bell },
  { path: '/status', label: 'حالة النظام', icon: Activity },
  { path: '/admin', label: 'لوحة الإدارة', icon: Shield },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 md:hidden pm-show-mobile-block" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[#12121a] border-l border-gray-800/50 z-50 transform transition-transform duration-300 md:hidden pm-show-mobile-block ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-white">WarScope</span>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                  {link.path === '/live' && (
                    <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot mr-auto" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
