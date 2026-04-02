import {
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function RulesPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("rules.title")}</h1>
          <p className="text-gray-600">{t("rules.subtitle")}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              {t("rules.sections.usage.title")}
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              {(t("rules.sections.usage.items", { returnObjects: true }) as string[]).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-green-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              {t("rules.sections.allowed.title")}
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              {(t("rules.sections.allowed.items", { returnObjects: true }) as string[]).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              {t("rules.sections.notAllowed.title")}
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              {(t("rules.sections.notAllowed.items", { returnObjects: true }) as string[]).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              {t("rules.sections.responsibility.title")}
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              {(t("rules.sections.responsibility.items", { returnObjects: true }) as string[]).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
