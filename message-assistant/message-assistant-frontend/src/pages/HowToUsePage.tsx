import {
  ClipboardPaste,
  Send,
  Eye,
  Copy,
  Settings,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Languages,
  Wand2,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HowToUsePage() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Settings,
      title: t("guide.steps.s1.title"),
      description: t("guide.steps.s1.desc"),
      color: "from-gray-500 to-gray-600",
    },
    {
      icon: ClipboardPaste,
      title: t("guide.steps.s2.title"),
      description: t("guide.steps.s2.desc"),
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: Send,
      title: t("guide.steps.s3.title"),
      description: t("guide.steps.s3.desc"),
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: Eye,
      title: t("guide.steps.s4.title"),
      description: t("guide.steps.s4.desc"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Copy,
      title: t("guide.steps.s5.title"),
      description: t("guide.steps.s5.desc"),
      color: "from-pink-500 to-red-500",
    },
    {
      icon: Sparkles,
      title: t("guide.steps.s6.title"),
      description: t("guide.steps.s6.desc"),
      color: "from-red-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("guide.title")}</h1>
          <p className="text-gray-600">{t("guide.subtitle")}</p>
        </div>

        <div className="space-y-6 mb-12">
          {steps.map((step, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("guide.tips.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Languages className="w-5 h-5 text-emerald-600 mt-0.5" />
              <p className="text-xs text-gray-600">{t("guide.tips.t3")}</p>
            </div>
            <div className="flex items-start gap-3">
              <Wand2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <p className="text-xs text-gray-600">{t("guide.tips.t1")}</p>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
              <p className="text-xs text-gray-600">{t("guide.tips.t2")}</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <p className="text-xs text-gray-600">{t("guide.tips.t5")}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{t("guide.tips.t4")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
