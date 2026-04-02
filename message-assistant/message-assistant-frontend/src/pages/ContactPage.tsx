import { useState } from "react";
import { Mail, Send, User, MessageSquare, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const feedbacks = JSON.parse(localStorage.getItem("contact_feedbacks") || "[]");
    feedbacks.push({
      name,
      email,
      message,
      timestamp: Date.now(),
    });
    localStorage.setItem("contact_feedbacks", JSON.stringify(feedbacks));
    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("contact.title")}</h1>
          <p className="text-gray-600">{t("contact.subtitle")}</p>
        </div>

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">{t("contact.sent")}</p>
              <p className="text-xs text-green-600">{t("contact.sentDesc")}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <User className="w-4 h-4 inline mr-1" />
                {t("contact.name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t("contact.namePlaceholder")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="w-4 h-4 inline mr-1" />
                {t("contact.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t("contact.emailPlaceholder")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                {t("contact.message")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder={t("contact.messagePlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-y"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-semibold shadow-md"
            >
              <Send className="w-4 h-4" />
              {t("contact.send")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
