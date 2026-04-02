import { MessageSquare, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">{t("app.name")}</span>
            </div>
            <p className="text-sm text-gray-400">
              {t("app.tagline")}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.quickLinks")}</h3>
            <div className="space-y-2">
              <Link to="/analyze" className="block text-sm hover:text-indigo-400 transition-colors">
                {t("footer.analyzeMessages")}
              </Link>
              <Link to="/history" className="block text-sm hover:text-indigo-400 transition-colors">
                {t("footer.analysisHistory")}
              </Link>
              <Link to="/how-to-use" className="block text-sm hover:text-indigo-400 transition-colors">
                {t("footer.howToUse")}
              </Link>
              <Link to="/rules" className="block text-sm hover:text-indigo-400 transition-colors">
                {t("footer.rulesTerms")}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.aboutSection")}</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm hover:text-indigo-400 transition-colors">
                {t("footer.aboutUs")}
              </Link>
              <Link to="/contact" className="block text-sm hover:text-indigo-400 transition-colors">
                {t("footer.contactUs")}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-1">
            {t("footer.madeWith")} <Heart className="w-3 h-3 text-red-400" /> {t("footer.by")}
          </p>
          <p className="mt-1">&copy; {new Date().getFullYear()} {t("app.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
