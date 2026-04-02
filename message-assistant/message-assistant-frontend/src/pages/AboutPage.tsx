import {
  MessageSquare,
  Brain,
  Target,
  Globe,
  Sparkles,
  Shield,
  Zap,
  Heart,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("about.title")}</h1>
          <p className="text-gray-600">{t("about.subtitle")}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              {t("about.what.title")}
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">{t("about.what.desc")}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              {t("about.why.title")}
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">{t("about.why.desc")}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-600" />
              {t("about.how.title")}
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">{t("about.how.desc")}</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              {t("app.name")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Sparkles, text: t("home.features.analysis.title") },
                { icon: Shield, text: t("home.features.replies.title") },
                { icon: Globe, text: t("home.features.translation.title") },
                { icon: Zap, text: t("result.priority") },
                { icon: Heart, text: t("reply.suggestedReply") },
                { icon: Brain, text: t("result.reasoning") },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/60 rounded-lg p-3">
                  <item.icon className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
