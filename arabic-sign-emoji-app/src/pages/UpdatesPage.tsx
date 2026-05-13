import { ArrowRight, Languages } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { changelog } from "../data/changelog";

export default function UpdatesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Languages className="w-6 h-6" />
          آخر التحديثات
        </h2>
        <button
          onClick={() => navigate("/")}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-1"
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </button>
      </div>

      <div className="space-y-4">
        {changelog.map((entry) => (
          <div
            key={entry.id}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-white">
                الإصدار {entry.version}
              </span>
              <span className="text-xs text-purple-200">{entry.date}</span>
            </div>
            <ul className="text-sm space-y-2 text-purple-100">
              {entry.changes.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-pink-300">●</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
