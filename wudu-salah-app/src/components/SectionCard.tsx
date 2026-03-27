import { useNavigate } from 'react-router-dom';

interface SectionCardProps {
  title: string;
  description: string;
  icon: string;
  path: string;
  gradient: string;
  delay?: number;
}

export default function SectionCard({ title, description, icon, path, gradient, delay = 0 }: SectionCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className="w-full text-right rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
      style={{ background: gradient, animationDelay: delay + 'ms', animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-white font-bold text-base">{title}</h3>
          <p className="text-white/80 text-sm mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}
