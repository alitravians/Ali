import { wuduMistakes } from '../data/wuduData';
import MistakeCard from '../components/MistakeCard';
import { useProgress } from '../contexts/ProgressContext';

export default function WuduMistakesPage() {
  const { completeLesson } = useProgress();
  completeLesson('wudu-mistakes');

  return (
    <div className="px-4 py-4 space-y-3 animate-fade-in">
      <div className="bg-warning/10 rounded-xl p-3 mb-2">
        <p className="text-warning text-sm font-medium text-center">
          تجنب هذه الأخطاء لوضوء صحيح
        </p>
      </div>
      {wuduMistakes.map((m) => (
        <MistakeCard key={m.id} mistake={m.mistake} correction={m.correction} icon={m.icon} />
      ))}
    </div>
  );
}
