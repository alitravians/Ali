import { useState } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  Languages,
  Sparkles,
  MessageCircle,
  Briefcase,
  BookOpen,
  Heart,
  Code,
  HandHeart,
  ArrowRight,
  Shield,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { restyleReply, translateText } from "../services/api";
import type { ReplyStyle } from "../types";

interface Props {
  originalMessage: string;
  suggestedReply: string;
  researchBased: boolean;
}

const styleIcons: Record<ReplyStyle, typeof MessageCircle> = {
  brief: MessageCircle,
  professional: Briefcase,
  formal: BookOpen,
  friendly: Heart,
  technical: Code,
  polite: HandHeart,
  direct: ArrowRight,
  firm: Shield,
};

const styleKeys: ReplyStyle[] = ["brief", "professional", "formal", "friendly", "technical", "polite", "direct", "firm"];

export default function ReplySection({ originalMessage, suggestedReply, researchBased }: Props) {
  const [currentReply, setCurrentReply] = useState(suggestedReply);
  const [editedReply, setEditedReply] = useState(suggestedReply);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isEditing ? editedReply : currentReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = isEditing ? editedReply : currentReply;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRestyle = async (style: ReplyStyle) => {
    setLoading(true);
    setActiveStyle(style);
    setError(null);
    try {
      const result = await restyleReply(originalMessage, currentReply, style);
      setCurrentReply(result.restyled_reply);
      setEditedReply(result.restyled_reply);
      setTranslation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restyle reply");
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    setTranslating(true);
    setError(null);
    try {
      const result = await translateText(
        isEditing ? editedReply : currentReply,
        "en_to_ar"
      );
      setTranslation(result.translated_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  const handleReset = () => {
    setCurrentReply(suggestedReply);
    setEditedReply(suggestedReply);
    setActiveStyle(null);
    setTranslation(null);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          {t("reply.suggestedReply")}
        </h3>
        <div className="flex items-center gap-2">
          {researchBased && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {t("reply.researchBased")}
            </span>
          )}
          {activeStyle && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium capitalize">
              {activeStyle}
            </span>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editedReply}
          onChange={(e) => setEditedReply(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed resize-y"
        />
      ) : (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{currentReply}</p>
        </div>
      )}

      {translation && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100" dir="rtl">
          <p className="text-xs text-emerald-600 font-medium mb-1 text-right">{t("reply.translateAr")}:</p>
          <p className="text-gray-800 leading-relaxed">{translation}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? t("reply.copied") : t("reply.copy")}
        </button>

        <button
          onClick={() => {
            if (isEditing) {
              setCurrentReply(editedReply);
            }
            setIsEditing(!isEditing);
          }}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
        >
          {isEditing ? t("reply.doneEditing") : t("reply.edit")}
        </button>

        <button
          onClick={handleTranslate}
          disabled={translating}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50"
        >
          {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
          {t("reply.translateAr")}
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          {t("reply.restyle")}
        </button>
      </div>

      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">{t("reply.restyleLabel")}</p>
        <div className="flex flex-wrap gap-2">
          {styleKeys.map((style) => {
            const Icon = styleIcons[style];
            return (
              <button
                key={style}
                onClick={() => handleRestyle(style)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  activeStyle === style
                    ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                } disabled:opacity-50`}
              >
                {loading && activeStyle === style ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Icon className="w-3 h-3" />
                )}
                {t(`reply.tones.${style}`)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
