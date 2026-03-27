import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface SubSectionCardProps {
  title: string;
  description: string;
  icon: string;
  path: string;
  count?: number;
}

export default function SubSectionCard({ title, description, icon, path, count }: SubSectionCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className="w-full bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-right animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="font-bold text-text-primary dark:text-dark-text">{title}</h3>
          <p className="text-text-secondary dark:text-dark-text-secondary text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-text-tertiary">
          {count !== undefined && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{count}</span>}
          <ChevronLeft size={18} />
        </div>
      </div>
    </button>
  );
}
