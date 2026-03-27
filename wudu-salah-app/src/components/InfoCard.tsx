import { Heart } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';

interface InfoCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  showFavorite?: boolean;
}

export default function InfoCard({ id, title, description, icon, showFavorite = true }: InfoCardProps) {
  const { toggleFavorite, isFavorite } = useProgress();
  const fav = isFavorite(id);

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{icon}</span>
        <div className="flex-1">
          <h3 className="font-bold text-text-primary dark:text-dark-text mb-1">{title}</h3>
          <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">{description}</p>
        </div>
        {showFavorite && (
          <button onClick={() => toggleFavorite(id)} className={`p-1 rounded-full transition-colors ${fav ? 'text-danger' : 'text-text-tertiary hover:text-danger'}`}>
            <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    </div>
  );
}
