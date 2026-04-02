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
import type { AnalysisResult as AnalysisResultType } from "../types";

interface Props {
  result: AnalysisResultType;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  inquiry: { label: "Inquiry", color: "bg-blue-100 text-blue-700" },
  request: { label: "Request", color: "bg-purple-100 text-purple-700" },
  complaint: { label: "Complaint", color: "bg-red-100 text-red-700" },
  discussion: { label: "Discussion", color: "bg-green-100 text-green-700" },
  casual: { label: "Casual", color: "bg-gray-100 text-gray-700" },
  technical: { label: "Technical", color: "bg-cyan-100 text-cyan-700" },
  greeting: { label: "Greeting", color: "bg-yellow-100 text-yellow-700" },
  feedback: { label: "Feedback", color: "bg-orange-100 text-orange-700" },
};

const priorityConfig: Record<string, { label: string; color: string; icon: typeof ArrowUp }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600", icon: ArrowDown },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700", icon: ArrowRight },
  high: { label: "High", color: "bg-orange-100 text-orange-700", icon: ArrowUp },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700", icon: Zap },
};

const sentimentConfig: Record<string, { label: string; color: string; icon: typeof ThumbsUp }> = {
  positive: { label: "Positive", color: "text-green-600", icon: ThumbsUp },
  negative: { label: "Negative", color: "text-red-600", icon: ThumbsDown },
  neutral: { label: "Neutral", color: "text-gray-600", icon: Minus },
};

const confidenceConfig: Record<string, { label: string; color: string }> = {
  high: { label: "High Confidence", color: "text-green-600" },
  medium: { label: "Medium Confidence", color: "text-yellow-600" },
  low: { label: "Low Confidence", color: "text-red-600" },
};

const replyLevelLabels: Record<string, string> = {
  no_reply: "No Reply Needed",
  simple: "Simple Reply",
  professional: "Professional Reply",
  research_needed: "Research Required",
  sensitive: "Sensitive - Careful Reply",
};

export default function AnalysisResultCard({ result }: Props) {
  const { classification } = result;
  const typeInfo = typeLabels[classification.message_type] || typeLabels.casual;
  const priorityInfo = priorityConfig[classification.priority] || priorityConfig.medium;
  const sentimentInfo = sentimentConfig[classification.sentiment] || sentimentConfig.neutral;
  const confidenceInfo = confidenceConfig[classification.confidence] || confidenceConfig.medium;
  const PriorityIcon = priorityInfo.icon;
  const SentimentIcon = sentimentInfo.icon;

  return (
    <div className="space-y-4">
      {/* Classification Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Message Classification
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Message Type */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Type</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          </div>

          {/* Needs Reply */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Needs Reply</p>
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${classification.needs_reply ? "text-green-600" : "text-gray-500"}`}>
              {classification.needs_reply ? (
                <><CheckCircle className="w-4 h-4" /> Yes</>
              ) : (
                <><XCircle className="w-4 h-4" /> No</>
              )}
            </span>
          </div>

          {/* Reply Level */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Reply Level</p>
            <p className="text-sm font-semibold text-gray-800">
              {replyLevelLabels[classification.reply_level] || classification.reply_level}
            </p>
          </div>

          {/* Priority */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${priorityInfo.color}`}>
              <PriorityIcon className="w-3 h-3" />
              {priorityInfo.label}
            </span>
          </div>

          {/* Sentiment */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Sentiment</p>
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${sentimentInfo.color}`}>
              <SentimentIcon className="w-4 h-4" />
              {sentimentInfo.label}
            </span>
          </div>

          {/* Confidence */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Confidence</p>
            <p className={`text-sm font-semibold ${confidenceInfo.color}`}>
              {confidenceInfo.label}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Message Explanation
        </h3>
        <p className="text-gray-700 leading-relaxed">{result.message_explanation}</p>
      </div>

      {/* Reasoning */}
      <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
        <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">
          Classification Reasoning
        </h3>
        <p className="text-indigo-800 text-sm leading-relaxed">{classification.reasoning}</p>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Research Note */}
        {result.research_needed && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Research Needed</span>
            </div>
            <p className="text-xs text-blue-600">{result.research_note}</p>
          </div>
        )}

        {/* Sensitive Warning */}
        {result.sensitive_warning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">Sensitive Message</span>
            </div>
            <p className="text-xs text-amber-600">{result.sensitive_note}</p>
          </div>
        )}

        {/* Urgency */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Urgency</span>
          </div>
          <p className="text-xs text-gray-600">{result.urgency_note}</p>
        </div>

        {/* Clarification */}
        {result.needs_clarification && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Needs Clarification</span>
            </div>
            <p className="text-xs text-purple-600">{result.clarification_note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
