import { salahPillars } from '../data/salahData';
import InfoCard from '../components/InfoCard';
import { useProgress } from '../contexts/ProgressContext';

export default function SalahPillarsPage() {
  const { completeLesson } = useProgress();
  completeLesson('salah-pillars');

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-secondary/10 dark:bg-secondary/20 rounded-xl p-3 mb-2">
        <p className="text-secondary dark:text-secondary-light text-sm font-medium text-center">
          أركان الصلاة لا تسقط عمداً ولا سهواً ولا جهلاً
        </p>
      </div>
      {salahPillars.map((p, i) => (
        <InfoCard key={i} id={`sp-${i}`} title={p.title} description={p.description} icon={p.icon} />
      ))}
    </div>
  );
}
