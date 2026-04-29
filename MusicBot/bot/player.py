"""Per-guild music player: queue, voice client, source resolution, loop modes.

Design notes:

- ``MusicPlayer`` owns a single ``discord.VoiceClient`` per guild and a
  ``deque`` of pending ``Track``s. Exactly one track plays at a time.
- ``yt-dlp`` is invoked off the event loop via ``run_in_executor`` so a
  slow extractor never blocks heartbeats.
- We pass YouTube's direct ``url`` (a stream URL with a short TTL) to
  FFmpeg only when the track is actually starting — older queued items
  re-extract on demand so their stream URLs don't expire while waiting
  in the queue.
- Voice playback uses ``FFmpegPCMAudio`` wrapped in
  ``PCMVolumeTransformer`` so volume can be adjusted live without
  re-spawning ffmpeg.
- After each track ends we either advance, repeat, or — if the queue is
  empty and nobody is in the channel — schedule an idle disconnect.
"""
from __future__ import annotations

import asyncio
import base64
import logging
import os
import time
from collections import deque
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable

import discord
from yt_dlp import YoutubeDL

_log = logging.getLogger(__name__)


def _resolve_cookiefile() -> str | None:
    """Return a path to a Netscape-format cookies file, if configured.

    YouTube enforces increasingly aggressive anti-bot challenges on
    datacenter IPs (fly.io, AWS, GCP, etc.) and will respond with
    "Sign in to confirm you're not a bot" for many videos unless the
    request carries cookies from a signed-in session.

    We support two configuration modes:

    1. ``YOUTUBE_COOKIES_FILE``: absolute path to a cookies.txt already
       on disk. Useful when the file is mounted as a fly volume.
    2. ``YOUTUBE_COOKIES_B64``: base64-encoded cookies.txt contents,
       passed as a ``flyctl secret``. We decode to ``/tmp/yt_cookies.txt``
       at startup. Preferred for stateless deploys.
    """
    explicit = os.environ.get("YOUTUBE_COOKIES_FILE")
    if explicit and Path(explicit).is_file():
        return explicit
    b64 = os.environ.get("YOUTUBE_COOKIES_B64")
    if b64:
        try:
            decoded = base64.b64decode(b64)
            target = Path("/tmp/yt_cookies.txt")
            target.write_bytes(decoded)
            return str(target)
        except Exception:
            _log.exception("failed to decode YOUTUBE_COOKIES_B64")
    return None


COOKIEFILE = _resolve_cookiefile()

# Reconnect + buffer flags shave a few seconds off the failure mode where
# the upstream stream stalls. They are widely recommended in the
# discord.py voice-streaming community.
FFMPEG_BEFORE = "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5"
FFMPEG_OPTIONS = "-vn"

# yt-dlp options. ``noplaylist=False`` lets ``/play <playlist url>`` enqueue
# the entire playlist; the cog can still override per-call.
#
# The format selector is intentionally generous: YouTube increasingly serves
# only HLS/DASH streams for some videos, and a strict ``bestaudio/best``
# fails with "Requested format is not available" on those. Using
# ``bestaudio*`` plus an explicit fallback chain through HLS/DASH protocols
# avoids that. ``-vn`` in FFMPEG_OPTIONS strips video, so even if a video
# format is selected we still only stream audio.
YDL_BASE_OPTS: dict[str, Any] = {
    "format": (
        "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio*"
        "/best[ext=mp4]/best"
    ),
    "quiet": True,
    "no_warnings": True,
    # SoundCloud as the default search source: YouTube applies aggressive
    # bot challenges to datacenter IPs (fly.io, AWS, etc.) and demands
    # a signed-in session. SoundCloud has no such restriction and serves
    # most popular music tracks. URLs are auto-detected by yt-dlp so a
    # YouTube link still works (when the video isn't gated).
    "default_search": "scsearch",
    "noplaylist": False,
    "skip_download": True,
    "extract_flat": "in_playlist",
    "source_address": "0.0.0.0",  # avoid IPv6 issues on some hosts
    "retries": 3,
    "fragment_retries": 3,
    "extractor_args": {
        # The default ``web`` client breaks on some videos in late 2025.
        # Telling yt-dlp to also try the Android + iOS clients dramatically
        # improves availability of audio-only formats.
        "youtube": {"player_client": ["android", "web", "ios"]},
    },
}
if COOKIEFILE:
    YDL_BASE_OPTS["cookiefile"] = COOKIEFILE
    _log.info("yt-dlp will use cookies from %s", COOKIEFILE)

# ``extract_flat`` returns lightweight playlist entries (id+title only).
# When the player actually needs a stream URL we re-extract that one
# entry with this fuller config.
YDL_RESOLVE_OPTS: dict[str, Any] = {
    **YDL_BASE_OPTS,
    "extract_flat": False,
}


class LoopMode(Enum):
    OFF = "off"
    TRACK = "track"
    QUEUE = "queue"


@dataclass
class Track:
    """One queued audio entry. ``stream_url`` is resolved lazily."""
    query: str                         # original input ("https://..." or search text)
    title: str | None = None
    webpage_url: str | None = None
    duration: int | None = None        # seconds
    uploader: str | None = None
    thumbnail: str | None = None
    requested_by_id: int = 0           # Discord user ID who queued it
    stream_url: str | None = None      # direct media URL for ffmpeg

    def display(self) -> str:
        return self.title or self.query


def _ydl_extract(query: str, *, resolve: bool = False) -> dict[str, Any]:
    opts = YDL_RESOLVE_OPTS if resolve else YDL_BASE_OPTS
    with YoutubeDL(opts) as ydl:
        info = ydl.extract_info(query, download=False)
    return info or {}


_YT_HOSTS = ("youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com")


def _is_youtube_url(query: str) -> bool:
    return any(h in query for h in _YT_HOSTS)


def _is_bot_challenge(err: Exception) -> bool:
    msg = str(err).lower()
    return (
        "sign in to confirm" in msg
        or "confirm you" in msg and "bot" in msg
        or "requested format is not available" in msg
    )


def _youtube_title(query: str) -> str | None:
    """Best-effort fetch of a YouTube video title via the public oEmbed
    endpoint, which does NOT require authentication or pass through the
    bot challenge. Used as a fallback so we can search SoundCloud for
    the same song when YouTube refuses to serve us the stream.
    """
    import urllib.parse
    import urllib.request

    try:
        oembed = (
            "https://www.youtube.com/oembed?format=json&url="
            + urllib.parse.quote(query, safe="")
        )
        req = urllib.request.Request(oembed, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            import json as _json
            data = _json.loads(r.read().decode("utf-8", errors="replace"))
        title = data.get("title")
        author = data.get("author_name")
        if title and author:
            return f"{author} {title}"
        return title
    except Exception:
        _log.exception("oEmbed lookup failed for %s", query)
        return None


async def resolve_query(query: str, *, requested_by_id: int) -> list[Track]:
    """Turn a user-supplied URL or search string into one or more Tracks.

    For YouTube playlists we return one Track per entry but only with the
    cheap fields populated; the actual stream URL is fetched at play time
    via :func:`prime_track`.

    If a YouTube URL is blocked by the datacenter bot challenge, we fall
    back to a SoundCloud search using the YouTube title (fetched via the
    public oEmbed endpoint, which does not require auth).
    """
    loop = asyncio.get_running_loop()
    try:
        info = await loop.run_in_executor(None, _ydl_extract, query)
    except Exception as e:
        if _is_youtube_url(query) and _is_bot_challenge(e):
            title = await loop.run_in_executor(None, _youtube_title, query)
            if title:
                _log.warning(
                    "YouTube blocked %r (bot challenge); falling back to SoundCloud search %r",
                    query, title,
                )
                fallback = f"scsearch1:{title}"
                info = await loop.run_in_executor(None, _ydl_extract, fallback)
            else:
                raise
        else:
            raise

    if not info:
        return []

    # A playlist returns ``entries`` (each a partial dict from extract_flat).
    if info.get("_type") == "playlist" and info.get("entries"):
        out: list[Track] = []
        for e in info["entries"]:
            if not e:
                continue
            out.append(Track(
                query=e.get("url") or e.get("webpage_url") or e.get("id") or query,
                title=e.get("title"),
                webpage_url=e.get("webpage_url") or (
                    f"https://www.youtube.com/watch?v={e['id']}" if e.get("id") else None
                ),
                duration=e.get("duration"),
                uploader=e.get("uploader") or e.get("channel"),
                thumbnail=(e.get("thumbnails") or [{}])[-1].get("url"),
                requested_by_id=requested_by_id,
            ))
        return out

    # Single video / search hit.
    return [_track_from_info(info, requested_by_id=requested_by_id)]


def _track_from_info(info: dict[str, Any], *, requested_by_id: int) -> Track:
    return Track(
        query=info.get("webpage_url") or info.get("url") or info.get("id") or "",
        title=info.get("title"),
        webpage_url=info.get("webpage_url"),
        duration=info.get("duration"),
        uploader=info.get("uploader") or info.get("channel"),
        thumbnail=(info.get("thumbnails") or [{}])[-1].get("url"),
        requested_by_id=requested_by_id,
        stream_url=info.get("url"),
    )


async def prime_track(track: Track) -> Track:
    """Ensure ``track.stream_url`` is set right before playback.

    YouTube stream URLs expire (~6h). We re-extract on demand for any
    track whose stream URL is missing or that came from a flat playlist
    entry.
    """
    if track.stream_url:
        return track
    loop = asyncio.get_running_loop()
    info = await loop.run_in_executor(None, lambda: _ydl_extract(track.query, resolve=True))
    if not info:
        return track
    full = _track_from_info(info, requested_by_id=track.requested_by_id)
    # Preserve original requester.
    full.requested_by_id = track.requested_by_id
    return full


@dataclass
class MusicPlayer:
    guild_id: int
    voice_client: discord.VoiceClient | None = None
    queue: deque[Track] = field(default_factory=deque)
    now_playing: Track | None = None
    volume: float = 0.7                 # 0..2.0, applied via PCMVolumeTransformer
    loop_mode: LoopMode = LoopMode.OFF
    text_channel_id: int = 0            # where to send "now playing" announcements
    started_at: float = 0.0             # epoch seconds for /nowplaying progress

    # Hooks set by the cog so the player can announce events.
    on_track_start: Callable[[Track], "asyncio.Future[Any] | None"] | None = None
    on_track_error: Callable[[Track, Exception], "asyncio.Future[Any] | None"] | None = None
    on_idle_disconnect: Callable[[], "asyncio.Future[Any] | None"] | None = None

    _idle_task: asyncio.Task[None] | None = None
    _max_queue: int = 100
    _idle_seconds: int = 300
    # Pause bookkeeping so /nowplaying progress reflects real audio time.
    _paused_at: float = 0.0
    _total_paused: float = 0.0

    def is_playing(self) -> bool:
        vc = self.voice_client
        return bool(vc and (vc.is_playing() or vc.is_paused()))

    def enqueue_many(self, tracks: list[Track]) -> int:
        before = len(self.queue)
        for t in tracks:
            if len(self.queue) >= self._max_queue:
                break
            self.queue.append(t)
        return len(self.queue) - before

    def clear(self) -> None:
        self.queue.clear()

    def progress_seconds(self) -> int:
        if not self.now_playing or not self.started_at:
            return 0
        # Subtract cumulative paused duration. If currently paused, also
        # subtract the time since the current pause started so the bar
        # freezes while paused instead of ticking forward.
        paused_total = self._total_paused
        if self._paused_at:
            paused_total += max(0.0, time.time() - self._paused_at)
        elapsed = time.time() - self.started_at - paused_total
        return max(0, int(elapsed))

    async def play_next(self) -> None:
        if not self.voice_client or not self.voice_client.is_connected():
            return

        # Already playing/paused — caller should have skipped explicitly.
        if self.voice_client.is_playing() or self.voice_client.is_paused():
            return

        # Pick the next track honouring loop mode.
        if self.loop_mode == LoopMode.TRACK and self.now_playing:
            next_track = self.now_playing
        else:
            # Recycle the *previous* track back to the queue tail BEFORE
            # checking emptiness, so single-track queues still loop.
            if self.loop_mode == LoopMode.QUEUE and self.now_playing:
                self.queue.append(self.now_playing)
            if not self.queue:
                self.now_playing = None
                self._schedule_idle_disconnect()
                return
            next_track = self.queue.popleft()

        try:
            primed = await prime_track(next_track)
        except Exception as e:  # pragma: no cover — runtime path
            _log.exception("yt-dlp prime failed for %r", next_track.query)
            await self._dispatch_error(next_track, e)
            asyncio.create_task(self.play_next())
            return

        if not primed.stream_url:
            await self._dispatch_error(primed, RuntimeError("no playable stream"))
            asyncio.create_task(self.play_next())
            return

        try:
            source = discord.FFmpegPCMAudio(
                primed.stream_url,
                before_options=FFMPEG_BEFORE,
                options=FFMPEG_OPTIONS,
            )
            source = discord.PCMVolumeTransformer(source, volume=self.volume)
        except Exception as e:  # pragma: no cover — environment issue
            _log.exception("FFmpeg source build failed")
            await self._dispatch_error(primed, e)
            asyncio.create_task(self.play_next())
            return

        self.now_playing = primed
        self.started_at = time.time()
        self._paused_at = 0.0
        self._total_paused = 0.0
        self._cancel_idle_disconnect()

        def _after(err: Exception | None) -> None:
            # ``_after`` runs in a background voice-thread; bounce back to
            # the main loop before doing anything async. Snapshot
            # ``self.voice_client`` once so a concurrent ``stop()`` (which
            # nulls the attribute) can't turn this into ``None.loop`` and
            # silently stall the queue.
            if err:
                _log.error("player after-callback error: %s", err)
            vc = self.voice_client
            if vc is not None:
                asyncio.run_coroutine_threadsafe(
                    self._after_track(err), vc.loop  # type: ignore[arg-type]
                )

        self.voice_client.play(source, after=_after)
        await self._dispatch_start(primed)

    async def _after_track(self, err: Exception | None) -> None:
        if err and self.now_playing:
            await self._dispatch_error(self.now_playing, err)
        await self.play_next()

    async def stop(self) -> None:
        # Clear state BEFORE stopping the voice client. ``voice_client.stop()``
        # synchronously triggers the ``after`` callback which schedules
        # ``_after_track`` → ``play_next``; if ``now_playing`` is still set
        # (especially under ``LoopMode.TRACK``) that re-entry would try to
        # play on a disconnecting voice client.
        self.clear()
        self.now_playing = None
        self._paused_at = 0.0
        self._total_paused = 0.0
        self._cancel_idle_disconnect()
        vc = self.voice_client
        # Drop the reference *now* so that any subsequent ``_ensure_voice``
        # call doesn't see a stale, disconnected ``VoiceClient`` and short-
        # circuit the reconnect path.
        self.voice_client = None
        if vc and vc.is_connected():
            vc.stop()
            await vc.disconnect(force=False)

    def set_volume(self, vol: int) -> None:
        # Clamp to 0..200% — Discord accepts >1.0 but it just clips.
        vol = max(0, min(200, vol))
        self.volume = vol / 100.0
        if self.voice_client and self.voice_client.source and isinstance(
            self.voice_client.source, discord.PCMVolumeTransformer
        ):
            self.voice_client.source.volume = self.volume

    def skip(self) -> None:
        if self.voice_client and (self.voice_client.is_playing() or self.voice_client.is_paused()):
            self.voice_client.stop()  # triggers _after → play_next

    def pause(self) -> bool:
        if self.voice_client and self.voice_client.is_playing():
            self.voice_client.pause()
            self._paused_at = time.time()
            return True
        return False

    def resume(self) -> bool:
        if self.voice_client and self.voice_client.is_paused():
            self.voice_client.resume()
            if self._paused_at:
                self._total_paused += max(0.0, time.time() - self._paused_at)
                self._paused_at = 0.0
            return True
        return False

    # ----- idle disconnect bookkeeping -----

    def _schedule_idle_disconnect(self) -> None:
        self._cancel_idle_disconnect()
        self._idle_task = asyncio.create_task(self._idle_then_leave())

    def _cancel_idle_disconnect(self) -> None:
        if self._idle_task and not self._idle_task.done():
            self._idle_task.cancel()
        self._idle_task = None

    async def _idle_then_leave(self) -> None:
        try:
            await asyncio.sleep(self._idle_seconds)
        except asyncio.CancelledError:
            return
        if self.is_playing() or self.queue:
            return
        await self.stop()
        if self.on_idle_disconnect:
            try:
                res = self.on_idle_disconnect()
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                _log.exception("idle disconnect hook failed")

    # ----- hook dispatchers -----

    async def _dispatch_start(self, track: Track) -> None:
        if not self.on_track_start:
            return
        try:
            res = self.on_track_start(track)
            if asyncio.iscoroutine(res):
                await res
        except Exception:
            _log.exception("on_track_start hook failed")

    async def _dispatch_error(self, track: Track, err: Exception) -> None:
        if not self.on_track_error:
            return
        try:
            res = self.on_track_error(track, err)
            if asyncio.iscoroutine(res):
                await res
        except Exception:
            _log.exception("on_track_error hook failed")
