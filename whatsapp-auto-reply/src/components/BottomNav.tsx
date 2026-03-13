import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquareReply, Settings, BarChart3, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'الرئيسية' },
  { path: '/replies', icon: MessageSquareReply, label: 'الردود' },
  { path: '/logs', icon: BarChart3, label: 'السجل' },
  { path: '/notifications', icon: Bell, label: 'التنبيهات' },
  { path: '/settings', icon: Settings, label: 'الإعدادات' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-emerald-400' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
