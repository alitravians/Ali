import { Heart } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import SpeakButton from './SpeakButton';

interface StepCardProps {
  id: string;
  number: number;
  title: string;
  description: string;
  details: string;
  icon: string;
  childDescription?: string;
  saying?: string;
}

export default function StepCard({ id, number, title, description, details, icon, childDescription, saying }: StepCardProps) {
  const { progress, toggleFavorite, isFavorite, completeLesson } = useProgress();
  const isChild = progress.childMode;
  const fav = isFavorite(id);

  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-md animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
          {number}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{icon}</span>
            <h3 className="font-bold text-text-primary dark:text-dark-text">{title}</h3>
          </div>
          <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
            {isChild && childDescription ? childDescription : description}
          </p>
          {!isChild && <p className="text-text-tertiary dark:text-dark-text-secondary text-xs mt-2 leading-relaxed">{details}</p>}
          {saying && !isChild && (
            <div className="mt-2 bg-primary/10 dark:bg-primary/20 rounded-lg p-2">
              <p className="text-primary dark:text-primary-light text-sm font-medium">{saying}</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        {isChild && (
          <SpeakButton text={`${title}. ${childDescription || description}`} />
        )}
        <button onClick={() => toggleFavorite(id)} className={`p-2 rounded-full transition-colors ${fav ? 'text-danger' : 'text-text-tertiary hover:text-danger'}`}>
          <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => completeLesson(id)}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${
            progress.completedLessons.includes(id) ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          {progress.completedLessons.includes(id) ? 'تم التعلم' : 'مارك كمكتمل'}
        </button>
      </div>
    </div>
  );
}
