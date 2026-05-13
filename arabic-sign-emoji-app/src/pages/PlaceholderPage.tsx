import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  title: string;
  icon: ReactNode;
  description: string;
  comingInPr: string;
}

export default function PlaceholderPage({
  title,
  icon,
  description,
  comingInPr,
}: Props) {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <button
          onClick={() => navigate("/")}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-1"
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center text-white space-y-3">
        <div className="text-5xl">🚧</div>
        <p className="text-purple-100 leading-relaxed">{description}</p>
        <div className="inline-block bg-yellow-500/20 border border-yellow-400/40 text-yellow-100 rounded-lg px-4 py-2 text-sm">
          هذه الصفحة قيد التطوير وسيتم إصدارها في <strong>{comingInPr}</strong>
        </div>
      </div>
    </div>
  );
}
