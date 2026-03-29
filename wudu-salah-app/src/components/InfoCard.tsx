import { Heart } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import TappableText from './TappableText';

interface InfoCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  showFavorite?: boolean;
}

export default function InfoCard({ id, title, description, icon, showFavorite = true }: InfoCardProps) {
  const { toggleFavorite, isFavorite, progress } = useProgress();
  const fav = isFavorite(id);
  const isChild = progress.childMode;

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{icon}</span>
        <div className="flex-1">
          {isChild ? (
            <TappableText text={title} speakText={`${title}. ${description}`} as="h3" className="font-bold text-text-primary dark:text-dark-text mb-1">
              {title}
            </TappableText>
          ) : (
            <h3 className="font-bold text-text-primary dark:text-dark-text mb-1">{title}</h3>
          )}
          {isChild ? (
            <TappableText text={description} as="p" className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
              {description}
            </TappableText>
          ) : (
            <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">{description}</p>
          )}
        </div>
        {showFavorite && (
          <button onClick={() => toggleFavorite(id)} className={`p-1 rounded-full transition-colors shrink-0 ${fav ? 'text-danger' : 'text-text-tertiary hover:text-danger'}`}>
            <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    </div>
  );
}
