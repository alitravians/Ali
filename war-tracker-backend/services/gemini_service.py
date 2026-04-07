"""Google Gemini AI integration for event analysis and Arabic translation."""
import google.generativeai as genai
import json
import asyncio
from datetime import datetime, timezone
from typing import Optional
from models import TrackerEvent, AISummary
from config import GEMINI_API_KEY

try:
    from deep_translator import GoogleTranslator
    _has_deep_translator = True
except ImportError:
    _has_deep_translator = False

_model = None
# Track if Gemini is rate-limited so we skip it and go straight to fallback
_gemini_rate_limited = False


def _get_model():
    """Lazy-initialize Gemini model."""
    global _model
    if _model is None and GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-2.0-flash")
    return _model


def _is_arabic(text: str) -> bool:
    """Check if text is already predominantly Arabic."""
    arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF' or '\u0750' <= c <= '\u077F')
    total_alpha = sum(1 for c in text if c.isalpha())
    if total_alpha == 0:
        return False
    return arabic_chars / total_alpha > 0.5


def _translate_with_google(text: str) -> str:
    """Translate text to Arabic using free Google Translate."""
    if not _has_deep_translator or not text:
        return text
    try:
        return GoogleTranslator(source='auto', target='ar').translate(text)
    except Exception:
        return text


async def _fallback_translate_batch(events: list, indices_and_events: list) -> int:
    """Translate events using free Google Translate as fallback.
    
    Returns the number of successfully translated events.
    """
    if not _has_deep_translator:
        print("[Translation] deep-translator not available, skipping fallback")
        return 0

    translated = 0
    for original_idx, ev in indices_and_events:
        try:
            ar_title = await asyncio.to_thread(_translate_with_google, ev.title)
            if ar_title and ar_title != ev.title:
                events[original_idx].titleAr = ar_title
                translated += 1
            # Small delay to avoid hitting Google rate limits
            await asyncio.sleep(0.3)
        except Exception:
            pass

    if translated > 0:
        print(f"[GoogleTranslate] Translated {translated}/{len(indices_and_events)} titles to Arabic")
    return translated


async def translate_event(event: TrackerEvent) -> TrackerEvent:
    """Translate event title and description to Arabic using Gemini, with Google Translate fallback."""
    # Skip if already Arabic
    if _is_arabic(event.titleAr):
        return event

    global _gemini_rate_limited
    model = _get_model()

    # Try Gemini first (if not rate-limited)
    if model and not _gemini_rate_limited:
        try:
            prompt = f"""Translate the following news headline and description to professional Arabic.
Return ONLY a JSON object with "titleAr" and "descriptionAr" keys. No markdown.

Title: {event.title}
Description: {event.description}"""

            response = await model.generate_content_async(prompt)
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

            data = json.loads(text)
            event.titleAr = data.get("titleAr", event.title)
            event.descriptionAr = data.get("descriptionAr", event.description)
            return event
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                _gemini_rate_limited = True
                print(f"[Gemini] Rate limited, switching to Google Translate fallback")
            else:
                print(f"[Gemini] Translation error: {e}")

    # Fallback: Google Translate (free, no API key needed)
    ar_title = await asyncio.to_thread(_translate_with_google, event.title)
    if ar_title and ar_title != event.title:
        event.titleAr = ar_title
    ar_desc = await asyncio.to_thread(_translate_with_google, event.description)
    if ar_desc and ar_desc != event.description:
        event.descriptionAr = ar_desc

    return event


async def batch_translate_events(events: list[TrackerEvent]) -> list[TrackerEvent]:
    """Batch-translate multiple event titles to Arabic.
    
    Uses Gemini AI for high-quality translation. Falls back to free Google Translate
    when Gemini quota is exhausted.
    """
    if not events:
        return events

    # Filter out events that already have Arabic titles
    needs_translation = [(i, ev) for i, ev in enumerate(events) if not _is_arabic(ev.titleAr)]
    if not needs_translation:
        return events

    global _gemini_rate_limited
    model = _get_model()

    # Try Gemini batch translation first (if available and not rate-limited)
    if model and not _gemini_rate_limited:
        batch_size = 20
        gemini_success = True
        for batch_start in range(0, len(needs_translation), batch_size):
            batch = needs_translation[batch_start:batch_start + batch_size]
            titles_list = "\n".join(f"{j+1}. {ev.title}" for j, (_, ev) in enumerate(batch))

            prompt = f"""Translate these news headlines to professional Arabic. 
Return ONLY a JSON array of objects, each with "n" (number) and "ar" (Arabic translation). No markdown.

{titles_list}"""

            try:
                response = await model.generate_content_async(prompt)
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

                translations = json.loads(text)
                for item in translations:
                    idx = item.get("n", 0) - 1
                    if 0 <= idx < len(batch):
                        original_idx = batch[idx][0]
                        ar_text = item.get("ar", "")
                        if ar_text:
                            events[original_idx].titleAr = ar_text

                print(f"[Gemini] Batch translated {len(translations)}/{len(batch)} titles to Arabic")

            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower():
                    _gemini_rate_limited = True
                    print(f"[Gemini] Rate limited, switching to Google Translate for remaining")
                    gemini_success = False
                    # Translate remaining untranslated with Google Translate
                    remaining = [(i, ev) for i, ev in needs_translation if not _is_arabic(events[i].titleAr)]
                    await _fallback_translate_batch(events, remaining)
                    break
                else:
                    print(f"[Gemini] Batch translation error: {e}")

        return events

    # Gemini not available or rate-limited — use Google Translate for all
    print(f"[Translation] Using Google Translate for {len(needs_translation)} titles")
    await _fallback_translate_batch(events, needs_translation)

    return events


async def analyze_events(events: list[TrackerEvent]) -> Optional[AISummary]:
    """Generate AI analysis summary of recent events."""
    model = _get_model()
    if not model or not events:
        return None

    try:
        events_text = "\n".join([
            f"- [{e.category.value}] {e.title} ({e.location.name}, {e.timestamp.strftime('%H:%M')})"
            for e in events[:20]
        ])

        prompt = f"""You are a military intelligence analyst. Analyze these recent events from the Iran-Israel conflict region.

Events:
{events_text}

Provide analysis in BOTH English and Arabic. Return ONLY a JSON object with these keys:
- whatHappened: Brief English summary (2-3 sentences)
- whatHappenedAr: Arabic translation of above
- whatsNew: What's new/changed (1-2 sentences English)
- whatsNewAr: Arabic translation
- isEscalation: boolean - is this an escalation?
- escalationDetails: If escalation, explain why (English)
- escalationDetailsAr: Arabic translation
- hotspots: Array of active location names (English)
- hotspotsAr: Array of Arabic location names
- confirmedOnly: Array of confirmed events only (English)
- confirmedOnlyAr: Arabic translations

No markdown, just valid JSON."""

        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)

        return AISummary(
            id=f"analysis-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            timestamp=datetime.now(timezone.utc),
            whatHappened=data.get("whatHappened", ""),
            whatHappenedAr=data.get("whatHappenedAr", ""),
            whatsNew=data.get("whatsNew", ""),
            whatsNewAr=data.get("whatsNewAr", ""),
            isEscalation=data.get("isEscalation", False),
            escalationDetails=data.get("escalationDetails"),
            escalationDetailsAr=data.get("escalationDetailsAr"),
            hotspots=data.get("hotspots", []),
            hotspotsAr=data.get("hotspotsAr", []),
            confirmedOnly=data.get("confirmedOnly", []),
            confirmedOnlyAr=data.get("confirmedOnlyAr", []),
        )

    except Exception as e:
        print(f"[Gemini] Analysis error: {e}")
        return None


async def generate_why_it_matters(event: TrackerEvent) -> TrackerEvent:
    """Generate 'why it matters' context for an event."""
    model = _get_model()
    if not model:
        return event

    try:
        prompt = f"""For this conflict event, write a brief "Why this matters now" explanation (1 sentence each in English and Arabic).

Event: {event.title}
Category: {event.category.value}
Location: {event.location.name}

Return ONLY JSON: {{"whyItMatters": "...", "whyItMattersAr": "..."}}"""

        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        event.whyItMatters = data.get("whyItMatters")
        event.whyItMattersAr = data.get("whyItMattersAr")
    except Exception as e:
        print(f"[Gemini] Why-it-matters error: {e}")

    return event
