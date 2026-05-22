"""Sentry error/performance monitoring for the BOON Community Bot.

Sentry init is intentionally optional — when ``SENTRY_DSN`` is unset
(local dev, CI lint, anyone forking the bot) all helpers in this module
become cheap no-ops, so the bot still runs identically to before.

The integration prefers structured tags over free-text breadcrumbs so
that Discord-specific facets (guild, command, user) can be used as
filters in the Sentry UI without having to scan stack traces.

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
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import discord

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
        # Send error-level logs as Sentry events; INFO+ become breadcrumbs.
        integrations=[
            AioHttpIntegration(),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
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


def set_command_context(interaction: discord.Interaction,
                        command_name: str) -> None:
    """Tag the current Sentry scope with the command + guild + user.

    Safe to call when Sentry is disabled — falls through quietly.
    """
    if not _INITIALIZED:
        return
    try:
        import sentry_sdk
    except ImportError:
        return

    scope = sentry_sdk.get_isolation_scope()
    scope.set_tag("discord.command", command_name)
    if interaction.guild_id is not None:
        scope.set_tag("discord.guild_id", str(interaction.guild_id))
    # We do NOT capture username / display name — only the numeric ID,
    # which is non-PII (it's the same ID Discord exposes in every audit
    # log). This keeps us aligned with send_default_pii=False above.
    scope.set_user({"id": str(interaction.user.id)})


def capture_exception(exc: BaseException, **extra: Any) -> None:
    """Capture an exception with optional extra context. No-op if disabled."""
    if not _INITIALIZED:
        return
    try:
        import sentry_sdk
    except ImportError:
        return
    if extra:
        scope = sentry_sdk.get_isolation_scope()
        for key, value in extra.items():
            scope.set_extra(key, value)
    sentry_sdk.capture_exception(exc)
