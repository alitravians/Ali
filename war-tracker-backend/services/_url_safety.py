"""Shared URL safety validation for event-source ingestion.

All services that pull articles/events from third-party feeds (RSS, GDELT,
NewsAPI, MediaStack, ACLED, …) must run every external ``url`` through
``is_safe_event_url`` before persisting it on a ``TrackerEvent``. This is
the backend half of the defence-in-depth chain whose frontend half lives
in ``war-tracker/src/utils/helpers.ts`` (``safeExternalUrl``) and
``war-tracker/src/context/LiveDataContext.tsx`` (``_isSafeIngestUrl``).

Why it matters. A hostile (or compromised) upstream feed can emit
``url="javascript:alert('xss')"`` or ``url="data:text/html,<script>…"``.
Rendered as an ``<a href>`` that would execute arbitrary JavaScript on
click. ``rel="noopener noreferrer"`` does NOT block ``javascript:`` URLs;
only rejecting the scheme does. We also reject them server-side so the
payload never reaches the in-memory DataStore or the SQLite persistence
layer, where it would survive restarts and be redelivered to every
future WebSocket subscriber.
"""
from __future__ import annotations

from urllib.parse import urlparse


_SAFE_SCHEMES = frozenset(("http", "https"))


def is_safe_event_url(link: object) -> bool:
    """Return True iff ``link`` is a plain ``http(s)://host/…`` URL.

    All of the following are rejected:

    - non-string values (``None``, ``int``, dict, …)
    - empty / whitespace-only strings
    - schemes other than ``http`` / ``https`` (``javascript:``,
      ``data:``, ``vbscript:``, ``file:``, ``about:``, mailto, tel, …)
    - URLs missing a host (e.g. ``http:///path``)
    - anything the stdlib ``urllib`` refuses to parse

    This function is deliberately strict — it is applied to *external
    feed content*, where a relative URL or a mailto: link is far more
    likely to be a parser glitch than a real citation.
    """
    if not isinstance(link, str):
        return False
    trimmed = link.strip()
    if not trimmed:
        return False
    try:
        parsed = urlparse(trimmed)
    except (ValueError, AttributeError):
        return False
    return parsed.scheme.lower() in _SAFE_SCHEMES and bool(parsed.netloc)
