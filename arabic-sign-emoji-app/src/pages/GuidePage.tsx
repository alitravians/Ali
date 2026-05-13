import { Link } from "react-router-dom";
import { HelpCircle, Play, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { guideSections } from "../data/guideSections";

export default function GuidePage() {
  const { restartTutorial } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                دليل الاستخدام الشامل
              </h1>
              <p className="text-white/70 text-sm mt-1">
                شرح تفصيلي لكل ميزة في التطبيق وطرق الاستفادة منها بالكامل.
              </p>
            </div>
          </div>

          <button
            onClick={restartTutorial}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-purple-700 font-bold hover:bg-white/90 transition shadow-lg"
            aria-label="إعادة الجولة التعريفية"
          >
            <Play className="w-4 h-4" />
            <span>إعادة الجولة التعريفية</span>
          </button>
        </div>
      </header>

      <nav className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-white/70 text-xs mb-2">انتقل بسرعة:</p>
        <div className="flex flex-wrap gap-2">
          {guideSections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition"
            >
              <span aria-hidden="true">{s.icon}</span>
              <span>{s.title}</span>
            </a>
          ))}
        </div>
      </nav>

      {guideSections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6 shadow-xl scroll-mt-20"
        >
          <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-white mb-4">
            <span className="text-2xl" aria-hidden="true">
              {section.icon}
            </span>
            <span>{section.title}</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            {section.cards.map((c, i) => (
              <div
                key={i}
                className="p-4 bg-white/10 rounded-xl border border-white/5"
              >
                <h3 className="font-bold text-white mb-2">{c.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <Link
        to="/"
        className="flex items-center justify-center gap-2 mx-auto w-fit px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium transition"
      >
        <span>الرجوع إلى المترجم</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
