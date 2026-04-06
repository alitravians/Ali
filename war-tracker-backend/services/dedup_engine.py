"""Event deduplication and merging engine.

Groups similar events from multiple sources into single unified events,
assigns trust levels based on source count and reliability.
"""
from difflib import SequenceMatcher
from datetime import timedelta
from models import TrackerEvent, TrustLevel


def _similarity(a: str, b: str) -> float:
    """Compute text similarity between two strings."""
    a_lower = a.lower().strip()
    b_lower = b.lower().strip()
    if a_lower == b_lower:
        return 1.0
    return SequenceMatcher(None, a_lower, b_lower).ratio()


def _location_close(e1: TrackerEvent, e2: TrackerEvent, km_threshold: float = 100.0) -> bool:
    """Check if two events are geographically close (rough estimate)."""
    lat_diff = abs(e1.location.lat - e2.location.lat)
    lng_diff = abs(e1.location.lng - e2.location.lng)
    # ~111km per degree latitude, ~85km per degree longitude at 30N
    dist_km = ((lat_diff * 111) ** 2 + (lng_diff * 85) ** 2) ** 0.5
    return dist_km < km_threshold


def _time_close(e1: TrackerEvent, e2: TrackerEvent, hours: int = 6) -> bool:
    """Check if two events happened within a time window."""
    return abs(e1.timestamp - e2.timestamp) < timedelta(hours=hours)


def _are_similar(e1: TrackerEvent, e2: TrackerEvent) -> bool:
    """Determine if two events describe the same incident."""
    # Same category is a strong signal
    same_category = e1.category == e2.category

    # Title similarity
    title_sim = _similarity(e1.title, e2.title)

    # Location proximity
    loc_close = _location_close(e1, e2)

    # Time proximity
    time_close = _time_close(e1, e2)

    # High title similarity = almost certainly same event
    if title_sim > 0.7:
        return True

    # Same category + close location + close time = likely same event
    if same_category and loc_close and time_close and title_sim > 0.3:
        return True

    # Close location + close time + moderate similarity
    if loc_close and time_close and title_sim > 0.45:
        return True

    return False


def _upgrade_trust(event: TrackerEvent) -> TrackerEvent:
    """Upgrade trust level based on number of sources."""
    n = len(event.sources)
    source_domains = [s.sourceName.lower() for s in event.sources]

    official = ["reuters", "ap ", "apnews", "bbc", "aljazeera", "acled"]
    has_official = any(any(o in d for o in official) for d in source_domains)

    if n >= 3 and has_official:
        event.trustLevel = TrustLevel.confirmed
        event.trustReason = f"Confirmed by {n} sources including official media"
        event.trustReasonAr = f"مؤكد من {n} مصادر بما فيها وسائل إعلام رسمية"
    elif n >= 3:
        event.trustLevel = TrustLevel.confirmed
        event.trustReason = f"Confirmed by {n} independent sources"
        event.trustReasonAr = f"مؤكد من {n} مصادر مستقلة"
    elif n >= 2 and has_official:
        event.trustLevel = TrustLevel.high
        event.trustReason = f"Reported by {n} sources including official media"
        event.trustReasonAr = f"أفادت {n} مصادر بما فيها وسائل إعلام رسمية"
    elif n >= 2:
        event.trustLevel = TrustLevel.high
        event.trustReason = f"Reported by {n} independent sources"
        event.trustReasonAr = f"أفادت {n} مصادر مستقلة"
    elif has_official:
        event.trustLevel = TrustLevel.high
        event.trustReason = "Reported by official media"
        event.trustReasonAr = "صادر عن وسائل إعلام رسمية"

    return event


def deduplicate_and_merge(events: list[TrackerEvent]) -> list[TrackerEvent]:
    """Deduplicate events and merge similar ones from different sources."""
    if not events:
        return []

    # Sort by timestamp descending (newest first)
    events.sort(key=lambda e: e.timestamp, reverse=True)

    merged: list[TrackerEvent] = []
    used: set[int] = set()

    for i, event in enumerate(events):
        if i in used:
            continue

        # Find all similar events
        group = [event]
        for j in range(i + 1, len(events)):
            if j in used:
                continue
            if _are_similar(event, events[j]):
                group.append(events[j])
                used.add(j)

        used.add(i)

        if len(group) == 1:
            merged.append(_upgrade_trust(event))
            continue

        # Merge group into primary event (the newest one)
        primary = group[0]  # Already sorted by timestamp desc

        # Collect all sources
        all_sources = []
        seen_source_ids: set[str] = set()
        merged_ids: list[str] = []

        for ev in group:
            for src in ev.sources:
                if src.sourceId not in seen_source_ids:
                    all_sources.append(src)
                    seen_source_ids.add(src.sourceId)
            if ev.id != primary.id:
                merged_ids.append(ev.id)

        primary.sources = all_sources
        primary.mergedEventIds = merged_ids
        primary.isDuplicate = False

        # Use the best title (prefer longer, more descriptive)
        best_title_event = max(group, key=lambda e: len(e.title))
        primary.title = best_title_event.title
        primary.titleAr = best_title_event.titleAr

        best_desc_event = max(group, key=lambda e: len(e.description))
        primary.description = best_desc_event.description
        primary.descriptionAr = best_desc_event.descriptionAr

        # Collect all related cities
        all_cities: list[str] = []
        seen_cities: set[str] = set()
        for ev in group:
            for city in ev.relatedCities:
                if city not in seen_cities:
                    all_cities.append(city)
                    seen_cities.add(city)
        primary.relatedCities = all_cities

        # Keep breaking if any source says breaking
        primary.isBreaking = any(ev.isBreaking for ev in group)

        # Keep whyItMatters if any has it
        for ev in group:
            if ev.whyItMattersAr:
                primary.whyItMattersAr = ev.whyItMattersAr
                primary.whyItMatters = ev.whyItMatters
                break

        # Upgrade trust based on merged source count
        primary = _upgrade_trust(primary)

        merged.append(primary)

    return merged
