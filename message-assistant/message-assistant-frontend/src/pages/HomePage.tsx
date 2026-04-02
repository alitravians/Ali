import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  Brain,
  Sparkles,
  Languages,
  Search,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Brain,
      title: t("home.features.analysis.title"),
      description: t("home.features.analysis.desc"),
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: Sparkles,
      title: t("home.features.replies.title"),
      description: t("home.features.replies.desc"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Languages,
      title: t("home.features.translation.title"),
      description: t("home.features.translation.desc"),
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Search,
      title: t("home.features.analysis.title"),
      description: t("home.features.analysis.desc"),
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Shield,
      title: t("home.features.replies.title"),
      description: t("home.features.replies.desc"),
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Zap,
      title: t("home.features.translation.title"),
      description: t("home.features.translation.desc"),
      color: "from-cyan-500 to-blue-500",
    },
  ];

  const replyTones = [
    t("reply.tones.brief"),
    t("reply.tones.professional"),
    t("reply.tones.formal"),
    t("reply.tones.friendly"),
    t("reply.tones.technical"),
    t("reply.tones.polite"),
    t("reply.tones.direct"),
    t("reply.tones.firm"),
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-8">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{t("home.badge")}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {t("home.title")}
              <br />
              <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                {t("home.titleHighlight")}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-indigo-100 mb-10 leading-relaxed max-w-2xl mx-auto">
              {t("home.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/analyze"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl text-lg"
              >
                {t("home.startButton")}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/how-to-use"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                {t("home.learnMore")}
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L48 45C96 40 192 30 288 35C384 40 480 60 576 65C672 70 768 60 864 50C960 40 1056 30 1152 35C1248 40 1344 60 1392 70L1440 80V100H0V50Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-indigo-200"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reply Styles */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {replyTones.map((style) => (
              <div key={style} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-indigo-300 hover:shadow-md transition-all">
                <CheckCircle className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">{style}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">{t("home.title")}</h2>
          <p className="text-indigo-100 mb-8 text-lg">{t("home.subtitle")}</p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-lg text-lg"
          >
            {t("home.startButton")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
