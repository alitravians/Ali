import { salahMistakes } from '../data/salahData';
import MistakeCard from '../components/MistakeCard';
import { useProgress } from '../contexts/ProgressContext';

export default function SalahMistakesPage() {
  const { completeLesson } = useProgress();
  completeLesson('salah-mistakes');

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-warning/10 rounded-xl p-3 mb-2">
        <p className="text-warning text-sm font-medium text-center">
          تجنب هذه الأخطاء لصلاة صحيحة
        </p>
      </div>
      {salahMistakes.map((m, i) => (
        <MistakeCard key={i} mistake={m.mistake} correction={m.correction} icon={m.icon} />
      ))}
    </div>
  );
}
