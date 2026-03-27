import { wuduInvalidators } from '../data/wuduData';
import InfoCard from '../components/InfoCard';
import { useProgress } from '../contexts/ProgressContext';

export default function WuduInvalidatorsPage() {
  const { completeLesson } = useProgress();
  completeLesson('wudu-invalidators');

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-danger/10 rounded-xl p-3 mb-2">
        <p className="text-danger text-sm font-medium text-center">
          هذه الأمور تنقض الوضوء وتوجب إعادته
        </p>
      </div>
      {wuduInvalidators.map((inv) => (
        <InfoCard key={inv.id} id={inv.id} title={inv.title} description={inv.description} icon={inv.icon} />
      ))}
    </div>
  );
}
