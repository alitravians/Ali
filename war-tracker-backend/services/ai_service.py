"""AI integration for event analysis and Arabic translation.

Uses Groq/Llama AI (primary), Devin API (deep analysis), and statistical analysis (fallback).
Gemini has been removed — all analysis is now branded as "Devin AI".
"""
import json
import asyncio
import httpx
from urllib.parse import quote
from datetime import datetime, timezone, timedelta
from typing import Optional
from models import TrackerEvent, AISummary
from config import GROQ_API_KEY, DEVIN_API_KEY, DEVIN_API_URL

# Groq API configuration (primary AI engine — fast & free)
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"
_groq_rate_limited_until: datetime | None = None


def _is_groq_rate_limited() -> bool:
    """Check if Groq is currently rate-limited."""
    global _groq_rate_limited_until
    if _groq_rate_limited_until is None:
        return False
    if datetime.now(timezone.utc) > _groq_rate_limited_until:
        _groq_rate_limited_until = None
        print("[Devin AI] Rate limit cooldown expired, re-enabling")
        return False
    return True


def _set_groq_rate_limited():
    """Set Groq as rate-limited with a 5-minute cooldown."""
    global _groq_rate_limited_until
    _groq_rate_limited_until = datetime.now(timezone.utc) + timedelta(minutes=5)
    print(f"[Devin AI] Rate limited, will retry after {_groq_rate_limited_until.isoformat()}")


async def _groq_chat(prompt: str, system_prompt: str = "") -> Optional[str]:
    """Send a chat completion request to Groq API. Returns the response text."""
    if not GROQ_API_KEY or _is_groq_rate_limited():
        return None

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 2000,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(GROQ_API_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
            elif resp.status_code == 429:
                _set_groq_rate_limited()
                print("[Devin AI] Rate limited (429)")
                return None
            else:
                print(f"[Devin AI] Error {resp.status_code}: {resp.text[:200]}")
                return None
    except Exception as e:
        print(f"[Devin AI] Request error: {e}")
        return None


def _is_arabic(text: str) -> bool:
    """Check if text is already predominantly Arabic."""
    arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF' or '\u0750' <= c <= '\u077F')
    total_alpha = sum(1 for c in text if c.isalpha())
    if total_alpha == 0:
        return False
    return arabic_chars / total_alpha > 0.5


async def _google_translate(text: str, target: str = "ar") -> str:
    """Translate text using Google Translate's free API via httpx."""
    if not text or len(text.strip()) == 0:
        return text
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target}&dt=t&q={quote(text)}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data and data[0]:
                    return "".join(part[0] for part in data[0] if part[0])
    except Exception as e:
        print(f"[GoogleTranslate] Error: {e}")
    return text


async def _fallback_translate_batch(events: list, indices_and_events: list) -> int:
    """Translate events using free Google Translate as fallback."""
    translated = 0
    for original_idx, ev in indices_and_events:
        try:
            ar_title = await _google_translate(ev.title)
            if ar_title and ar_title != ev.title and _is_arabic(ar_title):
                events[original_idx].titleAr = ar_title
                translated += 1
            await asyncio.sleep(0.2)
        except Exception:
            pass

    if translated > 0:
        print(f"[GoogleTranslate] Translated {translated}/{len(indices_and_events)} titles to Arabic")
    return translated


async def translate_event(event: TrackerEvent) -> TrackerEvent:
    """Translate event title and description to Arabic using Groq AI, with Google Translate fallback."""
    if _is_arabic(event.titleAr):
        return event

    # Try Groq AI first
    if GROQ_API_KEY and not _is_groq_rate_limited():
        try:
            prompt = f"""Translate the following news headline and description to professional Arabic.
Return ONLY a JSON object with "titleAr" and "descriptionAr" keys. No markdown.

Title: {event.title}
Description: {event.description}"""

            response = await _groq_chat(prompt)
            if response:
                text = response.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
                data = json.loads(text)
                event.titleAr = data.get("titleAr", event.title)
                event.descriptionAr = data.get("descriptionAr", event.description)
                return event
        except Exception as e:
            print(f"[Devin AI] Translation error: {e}")

    # Fallback: Google Translate
    ar_title = await _google_translate(event.title)
    if ar_title and ar_title != event.title:
        event.titleAr = ar_title
    ar_desc = await _google_translate(event.description)
    if ar_desc and ar_desc != event.description:
        event.descriptionAr = ar_desc

    return event


async def batch_translate_events(events: list[TrackerEvent]) -> list[TrackerEvent]:
    """Batch-translate multiple event titles to Arabic using Groq AI."""
    if not events:
        return events

    needs_translation = [(i, ev) for i, ev in enumerate(events) if not _is_arabic(ev.titleAr)]
    if not needs_translation:
        return events

    # Try Groq AI batch translation
    if GROQ_API_KEY and not _is_groq_rate_limited():
        batch_size = 20
        for batch_start in range(0, len(needs_translation), batch_size):
            batch = needs_translation[batch_start:batch_start + batch_size]
            titles_list = "\n".join(f"{j+1}. {ev.title}" for j, (_, ev) in enumerate(batch))

            prompt = f"""Translate these news headlines to professional Arabic. 
Return ONLY a JSON array of objects, each with "n" (number) and "ar" (Arabic translation). No markdown.

{titles_list}"""

            try:
                response = await _groq_chat(prompt)
                if response:
                    text = response.strip()
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

                    print(f"[Devin AI] Batch translated {len(translations)}/{len(batch)} titles to Arabic")

            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower():
                    _set_groq_rate_limited()
                    remaining = [(i, ev) for i, ev in needs_translation if not _is_arabic(events[i].titleAr)]
                    await _fallback_translate_batch(events, remaining)
                    break
                else:
                    print(f"[Devin AI] Batch translation error: {e}")

        return events

    # Groq not available — use Google Translate
    print(f"[Translation] Using Google Translate for {len(needs_translation)} titles")
    await _fallback_translate_batch(events, needs_translation)

    return events


def _build_statistical_analysis(events: list[TrackerEvent]) -> Optional[AISummary]:
    """Build a statistical analysis summary when AI services are unavailable."""
    if not events:
        return None

    from collections import Counter

    location_counts: Counter = Counter()
    location_ar_map: dict[str, str] = {}
    for e in events:
        loc = e.location.name
        location_counts[loc] += 1
        location_ar_map[loc] = e.location.nameAr

    category_counts: Counter = Counter()
    for e in events:
        category_counts[e.category.value] += 1

    confirmed_events = [e for e in events if e.trustLevel in ("confirmed", "high")]
    breaking_events = [e for e in events if e.isBreaking]
    multi_source = [e for e in events if len(e.sources) >= 2]

    top_locations = location_counts.most_common(5)
    hotspots = [loc for loc, _ in top_locations]
    hotspots_ar = [location_ar_map.get(loc, loc) for loc in hotspots]

    military_count = category_counts.get("military", 0)
    alert_count = category_counts.get("alert", 0)
    is_escalation = military_count >= 5 or alert_count >= 3 or len(breaking_events) >= 2

    total = len(events)
    cat_ar = {"military": "عسكري", "alert": "إنذار", "official": "رسمي",
              "airspace": "مجال جوي", "maritime": "بحري", "fire": "حريق",
              "humanitarian": "إنساني"}

    top_cats = category_counts.most_common(3)
    cats_en = ", ".join(f"{c} ({n})" for c, n in top_cats)
    cats_ar = ", ".join(f"{cat_ar.get(c, c)} ({n})" for c, n in top_cats)

    locs_en = ", ".join(f"{loc} ({n})" for loc, n in top_locations[:3])
    locs_ar = ", ".join(f"{location_ar_map.get(loc, loc)} ({n})" for loc, n in top_locations[:3])

    what_happened = f"{total} events tracked across the Middle East. Most active areas: {locs_en}. Primary categories: {cats_en}."
    what_happened_ar = f"تم رصد {total} حدث في الشرق الأوسط. المناطق الأكثر نشاطاً: {locs_ar}. التصنيفات الرئيسية: {cats_ar}."

    whats_new = f"{len(confirmed_events)} events from trusted sources, {len(multi_source)} corroborated by multiple sources."
    whats_new_ar = f"{len(confirmed_events)} حدث من مصادر موثوقة، {len(multi_source)} مؤكد من عدة مصادر."

    escalation_details = None
    escalation_details_ar = None
    if is_escalation:
        escalation_details = f"Elevated activity: {military_count} military events, {alert_count} alerts, {len(breaking_events)} breaking news."
        escalation_details_ar = f"نشاط مرتفع: {military_count} أحداث عسكرية، {alert_count} إنذارات، {len(breaking_events)} أخبار عاجلة."

    confirmed_titles = [e.title for e in confirmed_events[:5]]
    confirmed_titles_ar = [e.titleAr for e in confirmed_events[:5]]

    return AISummary(
        id=f"analysis-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        timestamp=datetime.now(timezone.utc),
        whatHappened=what_happened,
        whatHappenedAr=what_happened_ar,
        whatsNew=whats_new,
        whatsNewAr=whats_new_ar,
        isEscalation=is_escalation,
        escalationDetails=escalation_details,
        escalationDetailsAr=escalation_details_ar,
        hotspots=hotspots,
        hotspotsAr=hotspots_ar,
        confirmedOnly=confirmed_titles,
        confirmedOnlyAr=confirmed_titles_ar,
    )


async def analyze_events(events: list[TrackerEvent]) -> Optional[AISummary]:
    """Generate AI analysis summary of recent events.

    Fallback chain: Groq/Llama AI → Statistical analysis.
    """
    if not events:
        return None

    events_text = "\n".join([
        f"- [{e.category.value}] {e.title} ({e.location.name}, {e.timestamp.strftime('%H:%M')})"
        for e in events[:20]
    ])

    analysis_prompt = f"""You are a military intelligence analyst. Analyze these recent events from the Iran-Israel conflict region.

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

    system_prompt = "You are a military intelligence analyst specializing in Middle East geopolitics. Always respond with valid JSON only."

    # 1) Try Groq/Llama AI (primary)
    if GROQ_API_KEY and not _is_groq_rate_limited():
        try:
            groq_response = await _groq_chat(analysis_prompt, system_prompt)
            if groq_response:
                text = groq_response
                if text.startswith("```"):
                    text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
                data = json.loads(text)
                print("[Devin AI] Analysis generated successfully")
                return _parse_ai_analysis(data)
        except json.JSONDecodeError as e:
            print(f"[Devin AI] JSON parse error: {e}")
        except Exception as e:
            print(f"[Devin AI] Analysis error: {e}")

    # 2) Fallback: statistical analysis (always available, no API needed)
    print("[Devin AI] Using statistical fallback")
    return _build_statistical_analysis(events)


def _parse_ai_analysis(data: dict) -> AISummary:
    """Parse AI response JSON into AISummary model."""
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


async def generate_why_it_matters(event: TrackerEvent) -> TrackerEvent:
    """Generate 'why it matters' context for an event using Groq AI."""
    if not GROQ_API_KEY or _is_groq_rate_limited():
        return event

    try:
        prompt = f"""For this conflict event, write a brief "Why this matters now" explanation (1 sentence each in English and Arabic).

Event: {event.title}
Category: {event.category.value}
Location: {event.location.name}

Return ONLY JSON: {{"whyItMatters": "...", "whyItMattersAr": "..."}}"""

        response = await _groq_chat(prompt)
        if response:
            text = response.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            data = json.loads(text)
            event.whyItMatters = data.get("whyItMatters")
            event.whyItMattersAr = data.get("whyItMattersAr")
    except Exception as e:
        print(f"[Devin AI] Why-it-matters error: {e}")

    return event
