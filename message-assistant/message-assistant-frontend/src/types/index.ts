export interface Classification {
  message_type: string;
  needs_reply: boolean;
  reply_level: string;
  priority: string;
  confidence: string;
  sentiment: string;
  reasoning: string;
}

export interface AnalysisResult {
  classification: Classification;
  suggested_reply: string;
  message_explanation: string;
  research_needed: boolean;
  research_note: string;
  sensitive_warning: boolean;
  sensitive_note: string;
  urgency_note: string;
  should_reply_now: boolean;
  needs_clarification: boolean;
  clarification_note: string;
}

export interface RestyleResult {
  restyled_reply: string;
  style_used: string;
}

export interface TranslateResult {
  translated_text: string;
  direction: string;
}

export interface ImproveResult {
  improved_text: string;
  changes_made: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  originalMessage: string;
  mode: string;
  result: AnalysisResult;
  selectedReply: string;
}

export type ReplyStyle =
  | "brief"
  | "professional"
  | "formal"
  | "friendly"
  | "technical"
  | "polite"
  | "direct"
  | "firm";

export type AnalysisMode = "single" | "conversation";
