import { useEffect } from 'react';
import { wuduSteps } from '../data/wuduData';
import StepCard from '../components/StepCard';
import { useProgress } from '../contexts/ProgressContext';

export default function WuduStepsPage() {
  const { completeLesson } = useProgress();
  useEffect(() => { completeLesson('wudu-steps'); }, [completeLesson]);

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-3 mb-2">
        <p className="text-primary dark:text-primary-light text-sm font-medium text-center">
          اتبع الخطوات بالترتيب لوضوء صحيح
        </p>
      </div>
      {wuduSteps.map((step) => (
        <StepCard key={step.id} id={step.id} number={step.number} title={step.title}
          description={step.description} details={step.details} icon={step.icon}
          childDescription={step.childDescription} />
      ))}
    </div>
  );
}
