import { salahConditions } from '../data/salahData';
import InfoCard from '../components/InfoCard';
import { useProgress } from '../contexts/ProgressContext';

export default function SalahConditionsPage() {
  const { completeLesson } = useProgress();
  completeLesson('salah-conditions');

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-secondary/10 dark:bg-secondary/20 rounded-xl p-3 mb-2">
        <p className="text-secondary dark:text-secondary-light text-sm font-medium text-center">
          شروط الصلاة هي الأمور التي يجب توفرها قبل الصلاة وأثناءها
        </p>
      </div>
      {salahConditions.map((c, i) => (
        <InfoCard key={i} id={`sc-${i}`} title={c.title} description={c.description} icon={c.icon} />
      ))}
    </div>
  );
}
