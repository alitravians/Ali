import {
  MessageSquare,
  AlertTriangle,
  Search,
  Clock,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Shield,
  Zap,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AnalysisResult as AnalysisResultType } from "../types";

interface Props {
  result: AnalysisResultType;
}

const typeColors: Record<string, string> = {
  inquiry: "bg-blue-100 text-blue-700",
  request: "bg-purple-100 text-purple-700",
  complaint: "bg-red-100 text-red-700",
  discussion: "bg-green-100 text-green-700",
  casual: "bg-gray-100 text-gray-700",
  technical: "bg-cyan-100 text-cyan-700",
  greeting: "bg-yellow-100 text-yellow-700",
  feedback: "bg-orange-100 text-orange-700",
};

const priorityConfig: Record<string, { color: string; icon: typeof ArrowUp }> = {
  low: { color: "bg-gray-100 text-gray-600", icon: ArrowDown },
  medium: { color: "bg-yellow-100 text-yellow-700", icon: ArrowRight },
  high: { color: "bg-orange-100 text-orange-700", icon: ArrowUp },
  urgent: { color: "bg-red-100 text-red-700", icon: Zap },
};

const sentimentConfig: Record<string, { color: string; icon: typeof ThumbsUp }> = {
  positive: { color: "text-green-600", icon: ThumbsUp },
  negative: { color: "text-red-600", icon: ThumbsDown },
  neutral: { color: "text-gray-600", icon: Minus },
};

const confidenceColors: Record<string, string> = {
  high: "text-green-600",
  medium: "text-yellow-600",
  low: "text-red-600",
};

export default function AnalysisResultCard({ result }: Props) {
  const { classification } = result;
  const { t } = useTranslation();
  const typeColor = typeColors[classification.message_type] || typeColors.casual;
  const priorityInfo = priorityConfig[classification.priority] || priorityConfig.medium;
  const sentimentInfo = sentimentConfig[classification.sentiment] || sentimentConfig.neutral;
  const confidenceColor = confidenceColors[classification.confidence] || confidenceColors.medium;
  const PriorityIcon = priorityInfo.icon;
  const SentimentIcon = sentimentInfo.icon;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {t("result.analysisResult")}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">{t("result.messageType")}</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${typeColor}`}>
              {classification.message_type}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">{t("result.needsReply")}</p>
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${classification.needs_reply ? "text-green-600" : "text-gray-500"}`}>
              {classification.needs_reply ? (
                <><CheckCircle className="w-4 h-4" /> {t("result.yes")}</>
              ) : (
                <><XCircle className="w-4 h-4" /> {t("result.no")}</>
              )}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">{t("result.priority")}</p>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${priorityInfo.color}`}>
              <PriorityIcon className="w-3 h-3" />
              {classification.priority}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">{t("result.sentiment")}</p>
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${sentimentInfo.color}`}>
              <SentimentIcon className="w-4 h-4" />
              {classification.sentiment}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">{t("result.confidence")}</p>
            <p className={`text-sm font-semibold ${confidenceColor}`}>
              {classification.confidence}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          {t("result.reasoning")}
        </h3>
        <p className="text-gray-700 leading-relaxed">{result.message_explanation}</p>
      </div>

      <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
        <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">
          {t("result.reasoning")}
        </h3>
        <p className="text-indigo-800 text-sm leading-relaxed">{classification.reasoning}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {result.research_needed && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">{t("result.needsResearch")}</span>
            </div>
            <p className="text-xs text-blue-600">{result.research_note}</p>
          </div>
        )}

        {result.sensitive_warning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">{t("result.sensitiveNote")}</span>
            </div>
            <p className="text-xs text-amber-600">{result.sensitive_note}</p>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">{t("result.priority")}</span>
          </div>
          <p className="text-xs text-gray-600">{result.urgency_note}</p>
        </div>

        {result.needs_clarification && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">{t("result.needsClarification")}</span>
            </div>
            <p className="text-xs text-purple-600">{result.clarification_note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
