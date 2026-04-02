import json
from openai import AsyncOpenAI


ANALYSIS_SYSTEM_PROMPT = """You are an expert message analyst and communication assistant. Your job is to analyze incoming messages (especially from Discord or similar platforms) and provide detailed classification and suggested replies.

You MUST respond with valid JSON only. No markdown, no code blocks, just pure JSON.

Analyze the message and return a JSON object with these exact fields:

{
  "classification": {
    "message_type": "one of: inquiry, request, complaint, discussion, casual, technical, greeting, feedback",
    "needs_reply": true or false,
    "reply_level": "one of: no_reply, simple, professional, research_needed, sensitive",
    "priority": "one of: low, medium, high, urgent",
    "confidence": "one of: high, medium, low",
    "sentiment": "one of: positive, negative, neutral",
    "reasoning": "Brief explanation of why this classification was chosen"
  },
  "suggested_reply": "A well-crafted, professional reply in English appropriate for the context",
  "message_explanation": "Simple explanation of what the message means and what the sender wants",
  "research_needed": true or false,
  "research_note": "If research is needed, explain what topics should be researched. If not, say 'No research needed'",
  "sensitive_warning": true or false,
  "sensitive_note": "If the message is sensitive, explain why caution is needed. If not, say 'No sensitivity concerns'",
  "urgency_note": "Explain the urgency level - is a quick response expected?",
  "should_reply_now": true or false,
  "needs_clarification": true or false,
  "clarification_note": "If clarification is needed from the other party, explain what. If not, say 'No clarification needed'"
}

Guidelines:
- Focus on English messages primarily
- Consider Discord communication style and norms
- Be accurate in determining if a reply is actually needed
- Suggested replies should be natural, professional, and context-appropriate
- For casual messages like "lol", "ok", emoji-only messages, classify as no_reply
- For questions, always set needs_reply to true
- For complaints, use sensitive reply level
- For technical questions, consider if research is needed
- Always provide a helpful message_explanation in simple terms"""

CONVERSATION_SYSTEM_PROMPT = """You are an expert message analyst and communication assistant. You are analyzing a FULL CONVERSATION (multiple messages). Your job is to understand the entire conversation context and suggest the best reply to continue the conversation.

You MUST respond with valid JSON only. No markdown, no code blocks, just pure JSON.

The conversation will have messages from different people. Focus on the most recent messages to determine what reply is needed, but use the full context to inform your analysis.

Return the same JSON structure as for single messages, but:
- Consider the full conversation flow
- The suggested_reply should be a natural continuation of the conversation
- Pay attention to who said what and what the overall topic is
- The message_explanation should summarize the conversation, not just the last message

{
  "classification": {
    "message_type": "one of: inquiry, request, complaint, discussion, casual, technical, greeting, feedback",
    "needs_reply": true or false,
    "reply_level": "one of: no_reply, simple, professional, research_needed, sensitive",
    "priority": "one of: low, medium, high, urgent",
    "confidence": "one of: high, medium, low",
    "sentiment": "one of: positive, negative, neutral",
    "reasoning": "Brief explanation of why this classification was chosen"
  },
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
}"""


RESTYLE_SYSTEM_PROMPT = """You are an expert communication assistant. Restyle the given reply according to the requested style while keeping the same core meaning and information.

You MUST respond with valid JSON only:
{
  "restyled_reply": "The restyled reply text",
  "style_used": "Description of the style applied"
}

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
    return AsyncOpenAI(api_key=api_key)


async def analyze_message(message: str, api_key: str, mode: str = "single", context: str | None = None) -> dict:
    client = create_client(api_key)

    system_prompt = CONVERSATION_SYSTEM_PROMPT if mode == "conversation" else ANALYSIS_SYSTEM_PROMPT

    user_content = f"Message to analyze:\n\n{message}"
    if context:
        user_content += f"\n\nAdditional context: {context}"

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        temperature=0.3,
        max_tokens=2000
    )

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

    return json.loads(content)


async def restyle_reply(original_message: str, current_reply: str, style: str, api_key: str) -> dict:
    client = create_client(api_key)

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": RESTYLE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Original message received: {original_message}\n\nCurrent reply: {current_reply}\n\nRestyle this reply to be: {style}"}
        ],
        temperature=0.4,
        max_tokens=1000
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Empty response from AI")

    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

    return json.loads(content)


async def translate_text(text: str, direction: str, api_key: str) -> dict:
    client = create_client(api_key)

    direction_text = "English to Arabic" if direction == "en_to_ar" else "Arabic to English"

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": TRANSLATE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Translate the following text from {direction_text}:\n\n{text}"}
        ],
        temperature=0.2,
        max_tokens=1000
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Empty response from AI")

    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

    return json.loads(content)


async def improve_text(text: str, api_key: str) -> dict:
    client = create_client(api_key)

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": IMPROVE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Clean up and improve this text:\n\n{text}"}
        ],
        temperature=0.2,
        max_tokens=1000
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Empty response from AI")

    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

    return json.loads(content)
