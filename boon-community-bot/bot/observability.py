"""Sentry error/performance monitoring for the BOON Community Bot.

Sentry init is intentionally optional — when ``SENTRY_DSN`` is unset
(local dev, CI lint, anyone forking the bot) all helpers in this module
become cheap no-ops, so the bot still runs identically to before.

The slash-command error handler in ``main.py`` passes Discord-specific
context (command name, guild ID, user ID) as ``extra`` kwargs to
``capture_exception``, which scopes them to that single Sentry event
via ``sentry_sdk.new_scope()``. This avoids the classic ``Hub``-scope
leak where tags from one error report bleed into the next.

Operationally, set the DSN as a Fly.io secret:

    flyctl secrets set SENTRY_DSN='https://<key>@oXXX.ingest.de.sentry.io/YYY'

Optional env vars:

    SENTRY_ENVIRONMENT   default: production
    SENTRY_RELEASE       default: unset (lets Sentry auto-detect git SHA)
    SENTRY_TRACES_SAMPLE_RATE  default: 0.0 (errors only — cheaper)
"""

from __future__ import annotations

import logging
import os
from typing import Any

log = logging.getLogger("boon-bot.observability")

_INITIALIZED = False


def init_sentry() -> bool:
    """Initialize Sentry if ``SENTRY_DSN`` is set. Returns True on success."""
    global _INITIALIZED
    if _INITIALIZED:
        return True

    dsn = os.environ.get("SENTRY_DSN", "").strip()
    if not dsn:
        log.info("SENTRY_DSN unset — Sentry disabled")
        return False

    try:
        import sentry_sdk
        from sentry_sdk.integrations.aiohttp import AioHttpIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
    except ImportError:
        log.warning("sentry-sdk not installed — Sentry disabled")
        return False

    try:
        sample_rate = float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.0"))
    except ValueError:
        sample_rate = 0.0

    sentry_sdk.init(
        dsn=dsn,
        environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
        release=os.environ.get("SENTRY_RELEASE") or None,
        traces_sample_rate=sample_rate,
        # INFO+ logs become breadcrumbs. ``event_level=None`` suppresses
        # automatic event creation from ERROR-level log records, so the
        # only Sentry events are the ones the bot explicitly captures
        # via ``capture_exception`` — avoids the double-report path
        # where ``log.exception(...) + capture_exception(...)`` sitting
        # next to each other in main.py would otherwise generate two
        # separate Sentry events (DedupeIntegration is best-effort).
        integrations=[
            AioHttpIntegration(),
            LoggingIntegration(level=logging.INFO, event_level=None),
        ],
        # Bot tokens, github PATs, and discord webhook signing secrets must
        # never leave the process. ``send_default_pii`` defaults to False
        # already; pin it explicitly so a future SDK default flip can't
        # surprise us.
        send_default_pii=False,
        max_breadcrumbs=50,
    )
    _INITIALIZED = True
    log.info("Sentry initialized (env=%s)",
             os.environ.get("SENTRY_ENVIRONMENT", "production"))
    return True


def capture_exception(exc: BaseException, **extra: Any) -> None:
    """Capture an exception with optional extra context. No-op if disabled.

    Extras are scoped to this single call via ``sentry_sdk.new_scope()``
    so they cannot leak into unrelated Sentry events fired later from
    the same task (or from child tasks that inherit the contextvar).
    """
    if not _INITIALIZED:
        return
    try:
        import sentry_sdk
    except ImportError:
        return
    with sentry_sdk.new_scope() as scope:
        for key, value in extra.items():
            scope.set_extra(key, value)
        sentry_sdk.capture_exception(exc)
