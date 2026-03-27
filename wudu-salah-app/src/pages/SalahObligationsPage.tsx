import { useEffect } from 'react';
import { salahObligations } from '../data/salahData';
import InfoCard from '../components/InfoCard';
import { useProgress } from '../contexts/ProgressContext';

export default function SalahObligationsPage() {
  const { completeLesson } = useProgress();
  useEffect(() => { completeLesson('salah-obligations'); }, [completeLesson]);

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-secondary/10 dark:bg-secondary/20 rounded-xl p-3 mb-2">
        <p className="text-secondary dark:text-secondary-light text-sm font-medium text-center">
          واجبات الصلاة تسقط بالسهو وتُجبر بسجود السهو
        </p>
      </div>
      {salahObligations.map((o, i) => (
        <InfoCard key={i} id={`so-${i}`} title={o.title} description={o.description} icon={o.icon} />
      ))}
    </div>
  );
}
