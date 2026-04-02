from pydantic import BaseModel
from typing import Optional
from enum import Enum


class AnalysisMode(str, Enum):
    SINGLE = "single"
    CONVERSATION = "conversation"


class MessageType(str, Enum):
    INQUIRY = "inquiry"
    REQUEST = "request"
    COMPLAINT = "complaint"
    DISCUSSION = "discussion"
    CASUAL = "casual"
    TECHNICAL = "technical"
    GREETING = "greeting"
    FEEDBACK = "feedback"


class ReplyLevel(str, Enum):
    NO_REPLY = "no_reply"
    SIMPLE = "simple"
    PROFESSIONAL = "professional"
    RESEARCH_NEEDED = "research_needed"
    SENSITIVE = "sensitive"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ReplyStyle(str, Enum):
    BRIEF = "brief"
    PROFESSIONAL = "professional"
    FORMAL = "formal"
    FRIENDLY = "friendly"
    TECHNICAL = "technical"
    POLITE = "polite"
    DIRECT = "direct"
    FIRM = "firm"


class TranslationDirection(str, Enum):
    EN_TO_AR = "en_to_ar"
    AR_TO_EN = "ar_to_en"


# Request models
class AnalyzeRequest(BaseModel):
    message: str
    api_key: str
    mode: AnalysisMode = AnalysisMode.SINGLE
    context: Optional[str] = None


class RestyleRequest(BaseModel):
    original_message: str
    current_reply: str
    style: ReplyStyle
    api_key: str


class TranslateRequest(BaseModel):
    text: str
    direction: TranslationDirection
    api_key: str


class ImproveRequest(BaseModel):
    text: str
    api_key: str


# Response models
class Classification(BaseModel):
    message_type: str
    needs_reply: bool
    reply_level: str
    priority: str
    confidence: str
    sentiment: str
    reasoning: str


class AnalyzeResponse(BaseModel):
    classification: Classification
    suggested_reply: str
    message_explanation: str
    research_needed: bool
    research_note: str
    sensitive_warning: bool
    sensitive_note: str
    urgency_note: str
    should_reply_now: bool
    needs_clarification: bool
    clarification_note: str


class RestyleResponse(BaseModel):
    restyled_reply: str
    style_used: str


class TranslateResponse(BaseModel):
    translated_text: str
    direction: str


class ImproveResponse(BaseModel):
    improved_text: str
    changes_made: str
