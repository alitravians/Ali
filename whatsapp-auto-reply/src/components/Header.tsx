import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export default function Header({ title, showBack, leftAction, rightAction }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -mr-1 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          )}
          {leftAction}
        </div>
        <h1 className="text-lg font-bold text-white truncate">{title}</h1>
        <div className="flex items-center gap-2">
          {rightAction}
        </div>
      </div>
    </header>
  );
}
