import { useState, useCallback } from "react";
import {
  Send,
  Trash2,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Wand2,
  Languages,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { analyzeMessage, improveText, translateText } from "../services/api";
import AnalysisResultCard from "../components/AnalysisResult";
import ReplySection from "../components/ReplySection";
import type { AnalysisResult, AnalysisMode, HistoryEntry } from "../types";

export default function AnalyzePage() {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<AnalysisMode>("single");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [translatingMsg, setTranslatingMsg] = useState(false);
  const [messageTranslation, setMessageTranslation] = useState<string | null>(null);
  const [analyzedMessage, setAnalyzedMessage] = useState("");
  const { t, i18n } = useTranslation();

  const hasApiKey = !!localStorage.getItem("openai_api_key");

  const handleAnalyze = useCallback(async () => {
    if (!message.trim()) return;
    if (!hasApiKey) {
      setError(t("analyze.noApiKey"));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setMessageTranslation(null);

    try {
      const trimmedMessage = message.trim();
      const analysisResult = await analyzeMessage(trimmedMessage, mode, undefined, i18n.language);
      setResult(analysisResult);
      setAnalyzedMessage(trimmedMessage);

      // Save to history
      const history: HistoryEntry[] = JSON.parse(localStorage.getItem("analysis_history") || "[]");
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        originalMessage: message.trim(),
        mode,
        result: analysisResult,
        selectedReply: analysisResult.suggested_reply,
      };
      history.unshift(entry);
      // Keep last 50 entries
      if (history.length > 50) history.pop();
      localStorage.setItem("analysis_history", JSON.stringify(history));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("analyze.error"));
    } finally {
      setLoading(false);
    }
  }, [message, mode, hasApiKey, t, i18n.language]);

  const handleClear = () => {
    setMessage("");
    setResult(null);
    setError(null);
    setMessageTranslation(null);
  };

  const handleImprove = async () => {
    if (!message.trim() || !hasApiKey) return;
    setImproving(true);
    setError(null);
    try {
      const improved = await improveText(message.trim());
      setMessage(improved.improved_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("analyze.error"));
    } finally {
      setImproving(false);
    }
  };

  const handleTranslateMessage = async () => {
    if (!message.trim() || !hasApiKey) return;
    setTranslatingMsg(true);
    setError(null);
    try {
      const translated = await translateText(message.trim(), "en_to_ar");
      setMessageTranslation(translated.translated_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("analyze.error"));
    } finally {
      setTranslatingMsg(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("analyze.title")}</h1>
          <p className="text-gray-600">{t("analyze.subtitle")}</p>
        </div>

        {/* API Key Warning */}
        {!hasApiKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">{t("analyze.apiKeyRequired")}</p>
              <p className="text-xs text-amber-600 mt-0.5">{t("analyze.apiKeyHint")}</p>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setMode("single")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "single"
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-100 border border-transparent"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              {t("analyze.singleMode")}
            </button>
            <button
              onClick={() => setMode("conversation")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "conversation"
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-100 border border-transparent"
              }`}
            >
              <MessagesSquare className="w-4 h-4" />
              {t("analyze.conversationMode")}
            </button>
          </div>

          {/* Text Area */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              mode === "single"
                ? t("analyze.placeholder")
                : t("analyze.conversationPlaceholder")
            }
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed resize-y placeholder:text-gray-400"
          />

          {/* Message Translation */}
          {messageTranslation && (
            <div className="mt-3 bg-emerald-50 rounded-xl p-4 border border-emerald-100" dir="rtl">
              <p className="text-xs text-emerald-600 font-medium mb-1 text-right">{t("analyze.messageTranslation")}:</p>
              <p className="text-gray-800 leading-relaxed text-sm">{messageTranslation}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleAnalyze}
              disabled={loading || !message.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-md hover:shadow-lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? t("analyze.analyzing") : t("analyze.analyzeBtn")}
            </button>

            <button
              onClick={handleImprove}
              disabled={improving || !message.trim() || !hasApiKey}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-medium"
            >
              {improving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {t("analyze.cleanUp")}
            </button>

            <button
              onClick={handleTranslateMessage}
              disabled={translatingMsg || !message.trim() || !hasApiKey}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-medium"
            >
              {translatingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              {t("analyze.translate")}
            </button>

            <button
              onClick={handleClear}
              disabled={!message.trim() && !result}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {t("analyze.clear")}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{t("analyze.errorTitle")}</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center mb-6">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">{t("analyze.analyzingMessage")}</p>
            <p className="text-gray-400 text-sm mt-1">{t("analyze.deepThinking")}</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            <AnalysisResultCard result={result} />

            {result.classification.needs_reply && result.suggested_reply && (
              <ReplySection
                originalMessage={analyzedMessage}
                suggestedReply={result.suggested_reply}
                researchBased={result.research_needed}
              />
            )}

            {!result.classification.needs_reply && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
                <p className="text-gray-600 font-medium">{t("analyze.noReplyNeeded")}</p>
                <p className="text-gray-400 text-sm mt-1">{result.classification.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
