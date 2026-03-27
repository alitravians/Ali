interface MistakeCardProps {
  mistake: string;
  correction: string;
  icon: string;
}

export default function MistakeCard({ mistake, correction, icon }: MistakeCardProps) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{icon}</span>
        <div className="flex-1">
          <div className="bg-danger/10 rounded-lg p-2 mb-2">
            <p className="text-danger text-sm font-medium">❌ {mistake}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-2">
            <p className="text-success text-sm font-medium">✔ {correction}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
