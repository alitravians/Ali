import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {!isHome && <Header />}
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <div className="fixed bottom-14 left-0 right-0 z-40 text-center py-1.5 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border-t border-surface-tertiary/50 dark:border-dark-surface-secondary/50">
        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
          تم برمجة و تطوير هذا التطبيق بواسطة <span className="animate-color-shift text-sm">Ali</span>
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
