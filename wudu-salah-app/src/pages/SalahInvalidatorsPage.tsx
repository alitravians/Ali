import { salahInvalidators } from '../data/salahData';
import InfoCard from '../components/InfoCard';
import { useProgress } from '../contexts/ProgressContext';

export default function SalahInvalidatorsPage() {
  const { completeLesson } = useProgress();
  completeLesson('salah-invalidators');

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-danger/10 rounded-xl p-3 mb-2">
        <p className="text-danger text-sm font-medium text-center">
          هذه الأمور تبطل الصلاة وتوجب إعادتها
        </p>
      </div>
      {salahInvalidators.map((inv, i) => (
        <InfoCard key={i} id={`si-${i}`} title={inv.title} description={inv.description} icon={inv.icon} />
      ))}
    </div>
  );
}
