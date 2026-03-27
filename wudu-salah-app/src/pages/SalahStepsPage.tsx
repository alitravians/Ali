import { salahSteps } from '../data/salahData';
import StepCard from '../components/StepCard';
import { useProgress } from '../contexts/ProgressContext';

export default function SalahStepsPage() {
  const { completeLesson } = useProgress();
  completeLesson('salah-steps');

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-secondary/10 dark:bg-secondary/20 rounded-xl p-3 mb-2">
        <p className="text-secondary dark:text-secondary-light text-sm font-medium text-center">
          اتبع الخطوات بالترتيب لصلاة صحيحة
        </p>
      </div>
      {salahSteps.map((step) => (
        <StepCard key={step.id} id={step.id} number={step.number} title={step.title}
          description={step.description} details={step.details} icon={step.icon}
          childDescription={step.childDescription} saying={step.saying} />
      ))}
    </div>
  );
}
