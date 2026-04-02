import type {
  AnalysisResult,
  RestyleResult,
  TranslateResult,
  ImproveResult,
  ReplyStyle,
  AnalysisMode,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getApiKey(): string {
  const key = localStorage.getItem("openai_api_key") || "";
  if (!key) {
    throw new Error("Please set your OpenAI API key in Settings first.");
  }
  return key;
}

export async function analyzeMessage(
  message: string,
  mode: AnalysisMode = "single",
  context?: string
): Promise<AnalysisResult> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      api_key: getApiKey(),
      mode,
      context: context || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(error.detail || "Analysis failed");
  }

  return response.json();
}

export async function restyleReply(
  originalMessage: string,
  currentReply: string,
  style: ReplyStyle
): Promise<RestyleResult> {
  const response = await fetch(`${API_URL}/api/restyle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      original_message: originalMessage,
      current_reply: currentReply,
      style,
      api_key: getApiKey(),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Restyle failed" }));
    throw new Error(error.detail || "Restyle failed");
  }

  return response.json();
}

export async function translateText(
  text: string,
  direction: "en_to_ar" | "ar_to_en"
): Promise<TranslateResult> {
  const response = await fetch(`${API_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      direction,
      api_key: getApiKey(),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Translation failed" }));
    throw new Error(error.detail || "Translation failed");
  }

  return response.json();
}

export async function improveText(text: string): Promise<ImproveResult> {
  const response = await fetch(`${API_URL}/api/improve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      api_key: getApiKey(),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Improvement failed" }));
    throw new Error(error.detail || "Improvement failed");
  }

  return response.json();
}
