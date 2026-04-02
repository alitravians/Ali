import json
import asyncio
from openai import AsyncOpenAI

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
GEMINI_MODEL = "gemini-2.0-flash"
MAX_RETRIES = 3
RETRY_BASE_DELAY = 2  # seconds


def get_analysis_system_prompt(language: str = "en") -> str:
    lang_instruction = ""
    if language == "ar":
        lang_instruction = """\n\nIMPORTANT LANGUAGE INSTRUCTIONS:
- The "suggested_reply" MUST be written in Arabic (professional Arabic).
- The "message_explanation" MUST be written in Arabic.
- The "reasoning" MUST be written in Arabic.
- The "research_note", "sensitive_note", "urgency_note", and "clarification_note" MUST be written in Arabic.
- Keep the JSON field names in English, but all values should be in Arabic.
- Classification enum values (message_type, reply_level, priority, confidence, sentiment) stay in English."""
    else:
        lang_instruction = """\n\nIMPORTANT LANGUAGE INSTRUCTIONS:
- All text values in the response should be in English."""

    return f"""You are an expert message analyst and communication assistant with deep analytical thinking capabilities. Your job is to analyze incoming messages (especially from Discord or similar platforms) and provide detailed classification and suggested replies.

BEFORE responding, you MUST perform deep thinking analysis:
1. Carefully read and understand the full message context
2. Identify the sender's true intent, emotional state, and expectations
3. Consider cultural context and communication norms
4. Evaluate the best possible response strategy
5. Craft a reply that is professional, thoughtful, and perfectly suited to the situation

You MUST respond with valid JSON only. No markdown, no code blocks, just pure JSON.

Analyze the message and return a JSON object with these exact fields:

{{
  "classification": {{
    "message_type": "one of: inquiry, request, complaint, discussion, casual, technical, greeting, feedback",
    "needs_reply": true or false,
    "reply_level": "one of: no_reply, simple, professional, research_needed, sensitive",
    "priority": "one of: low, medium, high, urgent",
    "confidence": "one of: high, medium, low",
    "sentiment": "one of: positive, negative, neutral",
    "reasoning": "Brief explanation of why this classification was chosen"
  }},
  "suggested_reply": "A well-crafted, professional reply appropriate for the context",
  "message_explanation": "Simple explanation of what the message means and what the sender wants",
  "research_needed": true or false,
  "research_note": "If research is needed, explain what topics should be researched. If not, say 'No research needed'",
  "sensitive_warning": true or false,
  "sensitive_note": "If the message is sensitive, explain why caution is needed. If not, say 'No sensitivity concerns'",
  "urgency_note": "Explain the urgency level - is a quick response expected?",
  "should_reply_now": true or false,
  "needs_clarification": true or false,
  "clarification_note": "If clarification is needed from the other party, explain what. If not, say 'No clarification needed'"
}}

Guidelines:
- Think deeply before crafting any reply - consider multiple angles and choose the best approach
- Suggested replies should be natural, professional, and context-appropriate
- For casual messages like "lol", "ok", emoji-only messages, classify as no_reply
- For questions, always set needs_reply to true
- For complaints, use sensitive reply level
- For technical questions, consider if research is needed
- Always provide a helpful message_explanation in simple terms
- Consider Discord communication style and norms{lang_instruction}"""

def get_conversation_system_prompt(language: str = "en") -> str:
    lang_instruction = ""
    if language == "ar":
        lang_instruction = """\n\nIMPORTANT LANGUAGE INSTRUCTIONS:
- The "suggested_reply" MUST be written in Arabic (professional Arabic).
- The "message_explanation" MUST be written in Arabic.
- The "reasoning" MUST be written in Arabic.
- All note fields MUST be written in Arabic.
- Keep JSON field names in English, but all values should be in Arabic.
- Classification enum values stay in English."""
    else:
        lang_instruction = """\n\nIMPORTANT LANGUAGE INSTRUCTIONS:
- All text values in the response should be in English."""

    return f"""You are an expert message analyst and communication assistant with deep analytical thinking capabilities. You are analyzing a FULL CONVERSATION (multiple messages). Your job is to understand the entire conversation context and suggest the best reply to continue the conversation.

BEFORE responding, you MUST perform deep thinking analysis:
1. Read the entire conversation carefully to understand the flow
2. Identify each participant's role, tone, and intentions
3. Understand the underlying needs and expectations
4. Consider the best strategy for continuing the conversation
5. Craft a reply that addresses all points raised and moves the conversation forward productively

You MUST respond with valid JSON only. No markdown, no code blocks, just pure JSON.

The conversation will have messages from different people. Focus on the most recent messages to determine what reply is needed, but use the full context to inform your analysis.

Return the same JSON structure as for single messages, but:
- Consider the full conversation flow
- The suggested_reply should be a natural continuation of the conversation
- Pay attention to who said what and what the overall topic is
- The message_explanation should summarize the conversation, not just the last message

{{
  "classification": {{
    "message_type": "one of: inquiry, request, complaint, discussion, casual, technical, greeting, feedback",
    "needs_reply": true or false,
    "reply_level": "one of: no_reply, simple, professional, research_needed, sensitive",
    "priority": "one of: low, medium, high, urgent",
    "confidence": "one of: high, medium, low",
    "sentiment": "one of: positive, negative, neutral",
    "reasoning": "Brief explanation of why this classification was chosen"
  }},
  "suggested_reply": "A well-crafted reply that fits the conversation context",
  "message_explanation": "Summary of the conversation and what the other party wants",
  "research_needed": true or false,
  "research_note": "If research is needed, explain what. Otherwise 'No research needed'",
  "sensitive_warning": true or false,
  "sensitive_note": "If sensitive, explain why. Otherwise 'No sensitivity concerns'",
  "urgency_note": "Explain urgency level",
  "should_reply_now": true or false,
  "needs_clarification": true or false,
  "clarification_note": "If clarification needed, explain. Otherwise 'No clarification needed'"
}}{lang_instruction}"""


RESTYLE_SYSTEM_PROMPT = """You are an expert communication assistant with deep thinking capabilities. Restyle the given reply according to the requested style while keeping the same core meaning and information.

Before restyling, think deeply about:
1. The core message that must be preserved
2. The target tone and how to best achieve it
3. Cultural appropriateness of the restyled version
4. Maintaining the same language as the original reply

You MUST respond with valid JSON only:
{
  "restyled_reply": "The restyled reply text",
  "style_used": "Description of the style applied"
}

IMPORTANT: Keep the restyled reply in the SAME LANGUAGE as the original reply. If the reply is in Arabic, restyle it in Arabic. If in English, restyle in English.

Style guidelines:
- brief: Short, concise, 1-2 sentences max
- professional: Well-structured, business-appropriate language
- formal: Very formal, proper language, respectful tone
- friendly: Warm, casual, approachable tone with a personal touch
- technical: Detailed technical language, precise terminology
- polite: Extra courteous, gentle, considerate wording
- direct: Clear, straightforward, no fluff
- firm: Assertive but respectful, confident tone"""


TRANSLATE_SYSTEM_PROMPT = """You are a professional translator. Translate the given text accurately.

You MUST respond with valid JSON only:
{
  "translated_text": "The translated text"
}

Guidelines:
- Maintain the original meaning and tone
- For en_to_ar: Translate English to Arabic
- For ar_to_en: Translate Arabic to English
- Keep technical terms when appropriate
- Produce natural, fluent translations"""


IMPROVE_SYSTEM_PROMPT = """You are a text cleanup expert. Clean up and improve the given text while preserving its original meaning.

You MUST respond with valid JSON only:
{
  "improved_text": "The cleaned up and improved text",
  "changes_made": "Brief description of what was changed"
}

Guidelines:
- Fix spelling and grammar errors
- Remove unnecessary whitespace or formatting issues
- Organize messy text (e.g., from copy-paste)
- Keep the original meaning intact
- Make the text more readable
- Do NOT change the language of the text"""


def create_client(api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, base_url=GEMINI_BASE_URL)


async def call_with_retry(client: AsyncOpenAI, **kwargs) -> str:
    """Call the API with exponential backoff retry for rate limit errors."""
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = await client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from AI")
            # Clean up potential markdown code blocks
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[1] if "\n" in content else content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
            return content
        except Exception as e:
            error_msg = str(e)
            last_error = e
            if "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower() or "resource_exhausted" in error_msg.lower():
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_BASE_DELAY * (2 ** attempt)
                    await asyncio.sleep(delay)
                    continue
                raise ValueError(
                    "Gemini API rate limit exceeded. The free tier has limited requests per minute. "
                    "Please wait a moment and try again, or check your quota at https://ai.google.dev/gemini-api/docs/rate-limits"
                )
            raise
    raise last_error  # type: ignore


async def analyze_message(message: str, api_key: str, mode: str = "single", context: str | None = None, language: str = "en") -> dict:
    client = create_client(api_key)

    system_prompt = get_conversation_system_prompt(language) if mode == "conversation" else get_analysis_system_prompt(language)

    user_content = f"Message to analyze:\n\n{message}"
    if context:
        user_content += f"\n\nAdditional context: {context}"

    content = await call_with_retry(
        client,
        model=GEMINI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        temperature=0.3,
        max_tokens=2000
    )

    return json.loads(content)


async def restyle_reply(original_message: str, current_reply: str, style: str, api_key: str) -> dict:
    client = create_client(api_key)

    content = await call_with_retry(
        client,
        model=GEMINI_MODEL,
        messages=[
            {"role": "system", "content": RESTYLE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Original message received: {original_message}\n\nCurrent reply: {current_reply}\n\nRestyle this reply to be: {style}"}
        ],
        temperature=0.4,
        max_tokens=1000
    )

    return json.loads(content)


async def translate_text(text: str, direction: str, api_key: str) -> dict:
    client = create_client(api_key)

    direction_text = "English to Arabic" if direction == "en_to_ar" else "Arabic to English"

    content = await call_with_retry(
        client,
        model=GEMINI_MODEL,
        messages=[
            {"role": "system", "content": TRANSLATE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Translate the following text from {direction_text}:\n\n{text}"}
        ],
        temperature=0.2,
        max_tokens=1000
    )

    return json.loads(content)


async def improve_text(text: str, api_key: str) -> dict:
    client = create_client(api_key)

    content = await call_with_retry(
        client,
        model=GEMINI_MODEL,
        messages=[
            {"role": "system", "content": IMPROVE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Clean up and improve this text:\n\n{text}"}
        ],
        temperature=0.2,
        max_tokens=1000
    )

    return json.loads(content)
