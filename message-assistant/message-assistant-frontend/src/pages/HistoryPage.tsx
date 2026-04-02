import { useState, useEffect } from "react";
import {
  History,
  Trash2,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Search,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HistoryEntry } from "../types";

const priorityIcons: Record<string, typeof ArrowUp> = {
  low: ArrowDown,
  medium: ArrowRight,
  high: ArrowUp,
  urgent: Zap,
};

const priorityColors: Record<string, string> = {
  low: "text-gray-500",
  medium: "text-yellow-600",
  high: "text-orange-600",
  urgent: "text-red-600",
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("analysis_history") || "[]");
    setEntries(stored);
  }, []);

  const filteredEntries = entries.filter((entry) =>
    entry.originalMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.result.classification.message_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem("analysis_history", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setEntries([]);
    localStorage.removeItem("analysis_history");
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("time.justNow");
    if (minutes < 60) return t("time.minutesAgo", { count: minutes });
    if (hours < 24) return t("time.hoursAgo", { count: hours });
    if (days < 7) return t("time.daysAgo", { count: days });
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <History className="w-8 h-8 text-indigo-600" />
              {t("history.title")}
            </h1>
            <p className="text-gray-600 mt-1">{entries.length} {t("history.count")} — {t("history.subtitle")}</p>
          </div>
          {entries.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-4 py-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {t("history.clearAll")}
            </button>
          )}
        </div>

        {entries.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("history.title")}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        )}

        {entries.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t("history.empty")}</h3>
            <p className="text-gray-500 text-sm">{t("history.emptyDesc")}</p>
          </div>
        )}

        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const PIcon = priorityIcons[entry.result.classification.priority] || ArrowRight;
            const pColor = priorityColors[entry.result.classification.priority] || "text-gray-500";

            return (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate font-medium">
                      {entry.originalMessage.substring(0, 100)}
                      {entry.originalMessage.length > 100 ? "..." : ""}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium capitalize">
                        {entry.result.classification.message_type}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${pColor}`}>
                        <PIcon className="w-3 h-3" />
                        {entry.result.classification.priority}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatTime(entry.timestamp)}
                      </span>
                      {entry.result.research_needed && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{t("history.needsResearch")}</span>
                      )}
                      {entry.result.sensitive_warning && (
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">{t("history.original")}</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">
                        {entry.originalMessage}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">{t("result.reasoning")}</p>
                      <p className="text-sm text-gray-700">{entry.result.message_explanation}</p>
                    </div>

                    {entry.result.classification.needs_reply && entry.result.suggested_reply && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">{t("history.suggestedReply")}</p>
                        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.result.suggested_reply}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(entry.result.suggested_reply, entry.id)}
                          className="flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          {copiedId === entry.id ? (
                            <><Check className="w-3 h-3" /> {t("reply.copied")}</>
                          ) : (
                            <><Copy className="w-3 h-3" /> {t("reply.copy")}</>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                      >
                        <Trash2 className="w-3 h-3" />
                        {t("analyze.clear")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
