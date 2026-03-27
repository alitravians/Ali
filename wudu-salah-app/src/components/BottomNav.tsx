import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Droplets, BookOpen, Star, Settings } from 'lucide-react';

const navItems = [
  { path: '/settings', label: 'الإعدادات', icon: Settings },
  { path: '/favorites', label: 'المفضلة', icon: Star },
  { path: '/', label: 'الرئيسية', icon: Home },
  { path: '/wudu', label: 'الوضوء', icon: Droplets },
  { path: '/salah', label: 'الصلاة', icon: BookOpen },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-surface border-t border-surface-tertiary dark:border-dark-surface-secondary shadow-lg">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary dark:text-dark-text-secondary'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
