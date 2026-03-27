import { useEffect } from 'react';
import { salahSunnah } from '../data/salahData';
import InfoCard from '../components/InfoCard';
import { useProgress } from '../contexts/ProgressContext';

export default function SalahSunnahPage() {
  const { completeLesson } = useProgress();
  useEffect(() => { completeLesson('salah-sunnah'); }, [completeLesson]);

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-accent/10 rounded-xl p-3 mb-2">
        <p className="text-accent text-sm font-medium text-center">
          سنن الصلاة مستحبة ولا تبطل الصلاة بتركها
        </p>
      </div>
      {salahSunnah.map((s, i) => (
        <InfoCard key={i} id={`ss-${i}`} title={s.title} description={s.description} icon={s.icon} />
      ))}
    </div>
  );
}
