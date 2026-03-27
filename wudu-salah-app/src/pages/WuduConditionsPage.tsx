import { wuduConditions } from '../data/wuduData';
import InfoCard from '../components/InfoCard';
import { useProgress } from '../contexts/ProgressContext';

export default function WuduConditionsPage() {
  const { completeLesson } = useProgress();
  completeLesson('wudu-conditions');

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-3 mb-2">
        <p className="text-primary dark:text-primary-light text-sm font-medium text-center">
          شروط الوضوء هي الأمور التي يجب توفرها لصحة الوضوء
        </p>
      </div>
      {wuduConditions.map((c) => (
        <InfoCard key={c.id} id={c.id} title={c.title} description={c.description} icon={c.icon} />
      ))}
    </div>
  );
}
