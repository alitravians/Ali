"""Music slash commands — wavelink/Lavalink rewrite (2026-04-29).

Same command surface as the legacy davey-based bot:
    /play  /skip  /queue  /pause  /resume  /stop  /loop  /volume
    /nowplaying  /join  /leave  /remove  /shuffle

All audio streaming is delegated to Lavalink. wavelink owns the
``wavelink.Player`` (a ``discord.VoiceProtocol`` that forwards voice state
updates to Lavalink rather than opening a voice WebSocket itself), so
the bot never touches DAVE/MLS, opus or PyNaCl.
"""
from __future__ import annotations

import logging
import re
from typing import cast

import discord
import wavelink
from discord import app_commands
from discord.ext import commands

from ..config import COLORS, Settings

log = logging.getLogger(__name__)


URL_RE = re.compile(r"^https?://", re.IGNORECASE)


def _fmt_duration(ms: int | float | None) -> str:
    if ms is None:
        return "—"
    seconds = int(ms // 1000)
    if seconds < 0:
        seconds = 0
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h:d}:{m:02d}:{s:02d}" if h else f"{m:d}:{s:02d}"


def _track_embed(track: wavelink.Playable, *, title: str, color: int,
                 requester_id: int | None = None,
                 queue_position: int | None = None) -> discord.Embed:
    embed = discord.Embed(title=title, description=f"**{track.title}**", color=color)
    if track.uri:
        embed.url = track.uri
    if track.author:
        embed.add_field(name="القناة", value=track.author, inline=True)
    embed.add_field(name="المدة", value=_fmt_duration(track.length), inline=True)
    if requester_id:
        embed.add_field(name="طلب بواسطة", value=f"<@{requester_id}>", inline=True)
    if queue_position is not None:
        embed.add_field(name="الموقع في القائمة", value=str(queue_position), inline=True)
    if track.artwork:
        embed.set_thumbnail(url=track.artwork)
    return embed


async def _ensure_voice(interaction: discord.Interaction) -> wavelink.Player | None:
    """Connect to the user's voice channel if not already, return the player.

    Returns None and sends an ephemeral error if the user is not in voice.
    """
    if not isinstance(interaction.user, discord.Member):
        await interaction.response.send_message(
            "هذا الأمر متاح في السيرفر فقط.", ephemeral=True
        )
        return None

    voice_state = interaction.user.voice
    if not voice_state or not voice_state.channel:
        await interaction.response.send_message(
            "🔇 ادخل قناة صوتية أولاً، ثم استخدم الأمر.", ephemeral=True
        )
        return None

    guild = interaction.guild
    assert guild is not None
    player = cast("wavelink.Player | None", guild.voice_client)

    if player is None:
        try:
            player = await voice_state.channel.connect(  # type: ignore[arg-type]
                cls=wavelink.Player, self_deaf=False, self_mute=False
            )
        except Exception:
            log.exception("voice_channel.connect failed")
            await interaction.response.send_message(
                "❌ فشل الاتصال بالقناة الصوتية.", ephemeral=True
            )
            return None
    elif player.channel != voice_state.channel:
        await interaction.response.send_message(
            f"البوت في قناة أخرى ({player.channel.mention}). استخدم /leave أولاً.",
            ephemeral=True,
        )
        return None

    return player


class Music(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]

    # -------- wavelink event handlers --------

    @commands.Cog.listener()
    async def on_wavelink_track_start(
        self, payload: wavelink.TrackStartEventPayload
    ) -> None:
        player = payload.player
        if player is None:
            return
        track = payload.track
        log.info("track start: guild=%s title=%r length=%sms",
                 player.guild and player.guild.id, track.title, track.length)
        # Post "now playing" to the configured log channel if set.
        log_channel_id = self.settings.log_play
        if log_channel_id and player.guild:
            channel = player.guild.get_channel(log_channel_id)
            if isinstance(channel, discord.TextChannel):
                requester_id = getattr(track.extras, "requester_id", None)
                try:
                    await channel.send(
                        embed=_track_embed(
                            track,
                            title="🎵 الآن يُشغَّل",
                            color=COLORS["music"],
                            requester_id=requester_id,
                        )
                    )
                except Exception:
                    log.exception("failed to post now-playing log")

    @commands.Cog.listener()
    async def on_wavelink_track_end(
        self, payload: wavelink.TrackEndEventPayload
    ) -> None:
        log.info(
            "track end: reason=%s queue=%d",
            payload.reason, len(payload.player.queue) if payload.player else -1,
        )
        # wavelink autoplay handles next-track playback when
        # `player.autoplay = wavelink.AutoPlayMode.partial` is set (see /play).

    # -------- /play --------

    @app_commands.command(
        name="play",
        description="🎶 تشغيل أغنية أو رابط YouTube/SoundCloud (يضيفها للقائمة)",
    )
    @app_commands.describe(query="رابط أو اسم الأغنية")
    async def play(self, interaction: discord.Interaction, query: str) -> None:
        await interaction.response.defer(thinking=True)

        player = await _ensure_voice_after_defer(interaction)
        if player is None:
            return

        # Wavelink picks search source from URL pattern; for free text we
        # default to YouTube (Music client via the youtube-source plugin
        # configured on the Lavalink side).
        try:
            tracks: wavelink.Search = await wavelink.Playable.search(query)
        except Exception:
            log.exception("wavelink search failed for %r", query)
            await interaction.followup.send(
                "❌ تعذّر البحث. حاول رابط مباشر أو اسم آخر.", ephemeral=True
            )
            return

        if not tracks:
            await interaction.followup.send(
                f"🔎 ما لقيت أي نتيجة لـ `{query}`.", ephemeral=True
            )
            return

        # Tag the track with requester metadata so /nowplaying can render it.
        first = tracks[0]
        first.extras = {"requester_id": interaction.user.id}

        if isinstance(tracks, wavelink.Playlist):
            for t in tracks.tracks:
                t.extras = {"requester_id": interaction.user.id}
            await player.queue.put_wait(tracks)
            await interaction.followup.send(
                embed=discord.Embed(
                    title="📋 أُضيفت قائمة تشغيل",
                    description=f"**{tracks.name}** ({len(tracks.tracks)} أغنية)",
                    color=COLORS["music"],
                )
            )
        else:
            await player.queue.put_wait(first)
            position = len(player.queue)
            if not player.playing:
                await interaction.followup.send(
                    embed=_track_embed(
                        first,
                        title="▶️ يُشغَّل الآن",
                        color=COLORS["music"],
                        requester_id=interaction.user.id,
                    )
                )
            else:
                await interaction.followup.send(
                    embed=_track_embed(
                        first,
                        title="➕ أُضيفت للقائمة",
                        color=COLORS["info"],
                        requester_id=interaction.user.id,
                        queue_position=position,
                    )
                )

        # Kick off playback if idle. wavelink's autoplay handles the
        # rest (it auto-pulls from queue when a track ends).
        if not player.playing:
            next_track = player.queue.get()
            await player.play(next_track, volume=self.settings.default_volume)

        # Enable partial autoplay so the queue advances automatically and
        # wavelink fetches similar tracks once the queue empties.
        player.autoplay = wavelink.AutoPlayMode.partial

    # -------- /skip --------

    @app_commands.command(name="skip", description="⏭ تخطي الأغنية الحالية")
    async def skip(self, interaction: discord.Interaction) -> None:
        player = _player_for(interaction)
        if not player or not player.playing:
            await interaction.response.send_message(
                "❌ لا توجد أغنية تعمل حالياً.", ephemeral=True
            )
            return
        await player.skip(force=True)
        await interaction.response.send_message(
            "⏭ تم تخطّي الأغنية.", ephemeral=True
        )

    # -------- /queue --------

    @app_commands.command(name="queue", description="📋 عرض قائمة الأغاني")
    async def queue(self, interaction: discord.Interaction) -> None:
        player = _player_for(interaction)
        if not player:
            await interaction.response.send_message(
                "❌ البوت ليس في قناة صوتية.", ephemeral=True
            )
            return

        embed = discord.Embed(title="📋 قائمة التشغيل", color=COLORS["music"])
        if player.current:
            embed.add_field(
                name="🎵 الآن يُشغَّل",
                value=f"**{player.current.title}** ({_fmt_duration(player.current.length)})",
                inline=False,
            )

        if not player.queue:
            embed.description = "_القائمة فارغة_"
        else:
            lines = []
            for i, t in enumerate(list(player.queue)[:10], start=1):
                lines.append(f"`{i}.` {t.title} — {_fmt_duration(t.length)}")
            if len(player.queue) > 10:
                lines.append(f"…و **{len(player.queue) - 10}** أغنية إضافية")
            embed.description = "\n".join(lines)

        await interaction.response.send_message(embed=embed)

    # -------- /pause /resume /stop --------

    @app_commands.command(name="pause", description="⏸ إيقاف مؤقت")
    async def pause(self, interaction: discord.Interaction) -> None:
        player = _player_for(interaction)
        if not player or not player.playing:
            await interaction.response.send_message(
                "❌ لا توجد أغنية تعمل حالياً.", ephemeral=True
            )
            return
        await player.pause(True)
        await interaction.response.send_message("⏸ تم الإيقاف المؤقت.")

    @app_commands.command(name="resume", description="▶ متابعة التشغيل")
    async def resume(self, interaction: discord.Interaction) -> None:
        player = _player_for(interaction)
        if not player:
            await interaction.response.send_message(
                "❌ البوت ليس في قناة صوتية.", ephemeral=True
            )
            return
        await player.pause(False)
        await interaction.response.send_message("▶ تم استئناف التشغيل.")

    @app_commands.command(name="stop", description="⏹ إيقاف ومسح القائمة")
    async def stop(self, interaction: discord.Interaction) -> None:
        player = _player_for(interaction)
        if not player:
            await interaction.response.send_message(
                "❌ البوت ليس في قناة صوتية.", ephemeral=True
            )
            return
        player.queue.clear()
        await player.stop(force=True)
        await interaction.response.send_message("⏹ تم الإيقاف ومسح القائمة.")

    # -------- /loop --------

    @app_commands.command(
        name="loop", description="🔁 وضع التكرار: off / track / queue"
    )
    @app_commands.choices(mode=[
        app_commands.Choice(name="إيقاف التكرار", value="off"),
        app_commands.Choice(name="تكرار الأغنية الحالية", value="track"),
        app_commands.Choice(name="تكرار القائمة بالكامل", value="queue"),
    ])
    async def loop(
        self, interaction: discord.Interaction, mode: app_commands.Choice[str]
    ) -> None:
        player = _player_for(interaction)
        if not player:
            await interaction.response.send_message(
                "❌ البوت ليس في قناة صوتية.", ephemeral=True
            )
            return
        modes = {
            "off": wavelink.QueueMode.normal,
            "track": wavelink.QueueMode.loop,
            "queue": wavelink.QueueMode.loop_all,
        }
        player.queue.mode = modes[mode.value]
        labels = {"off": "❎ إيقاف التكرار",
                  "track": "🔂 تكرار الأغنية الحالية",
                  "queue": "🔁 تكرار القائمة"}
        await interaction.response.send_message(labels[mode.value])

    # -------- /volume --------

    @app_commands.command(name="volume", description="🔊 مستوى الصوت (0-200)")
    @app_commands.describe(level="0..200 (افتراضي 70)")
    async def volume(
        self, interaction: discord.Interaction, level: app_commands.Range[int, 0, 200]
    ) -> None:
        player = _player_for(interaction)
        if not player:
            await interaction.response.send_message(
                "❌ البوت ليس في قناة صوتية.", ephemeral=True
            )
            return
        await player.set_volume(level)
        await interaction.response.send_message(f"🔊 مستوى الصوت الآن: **{level}**")

    # -------- /nowplaying --------

    @app_commands.command(name="nowplaying", description="🎵 معلومات الأغنية الحالية")
    async def nowplaying(self, interaction: discord.Interaction) -> None:
        player = _player_for(interaction)
        if not player or not player.current:
            await interaction.response.send_message(
                "❌ لا توجد أغنية تعمل حالياً.", ephemeral=True
            )
            return
        track = player.current
        embed = _track_embed(track, title="🎵 الآن يُشغَّل", color=COLORS["music"])
        embed.add_field(
            name="التقدم",
            value=f"{_fmt_duration(player.position)} / {_fmt_duration(track.length)}",
            inline=False,
        )
        embed.add_field(name="القائمة",
                        value=f"**{len(player.queue)}** بانتظار", inline=True)
        await interaction.response.send_message(embed=embed)

    # -------- /join /leave --------

    @app_commands.command(name="join", description="📥 ضم البوت إلى قناتك الصوتية")
    async def join(self, interaction: discord.Interaction) -> None:
        # Defer first: voice WS handshake can exceed Discord's 3-second
        # interaction response window.
        await interaction.response.defer(thinking=True, ephemeral=True)
        player = await _ensure_voice_after_defer(interaction)
        if player:
            await interaction.followup.send(
                f"📥 انضممت لـ {player.channel.mention}", ephemeral=True
            )

    @app_commands.command(name="leave", description="📤 إخراج البوت من القناة الصوتية")
    async def leave(self, interaction: discord.Interaction) -> None:
        player = _player_for(interaction)
        if not player:
            await interaction.response.send_message(
                "❌ البوت ليس في قناة صوتية.", ephemeral=True
            )
            return
        await player.disconnect()
        await interaction.response.send_message("👋 خرجت من القناة الصوتية.")

    # -------- /remove --------

    @app_commands.command(name="remove", description="🗑 حذف أغنية من القائمة (1=الأولى)")
    async def remove(
        self,
        interaction: discord.Interaction,
        position: app_commands.Range[int, 1, 1000],
    ) -> None:
        player = _player_for(interaction)
        if not player or not player.queue:
            await interaction.response.send_message(
                "❌ القائمة فارغة.", ephemeral=True
            )
            return
        try:
            track = player.queue.peek(position - 1)
            player.queue.delete(position - 1)
        except (IndexError, KeyError):
            await interaction.response.send_message(
                f"❌ لا يوجد عنصر في الموقع {position}.", ephemeral=True
            )
            return
        await interaction.response.send_message(
            f"🗑 حُذفت **{track.title}** من القائمة."
        )

    # -------- /shuffle --------

    @app_commands.command(name="shuffle", description="🔀 خلط ترتيب القائمة عشوائياً")
    async def shuffle(self, interaction: discord.Interaction) -> None:
        player = _player_for(interaction)
        if not player or not player.queue:
            await interaction.response.send_message(
                "❌ القائمة فارغة.", ephemeral=True
            )
            return
        player.queue.shuffle()
        await interaction.response.send_message(
            f"🔀 تم خلط القائمة ({len(player.queue)} أغنية)."
        )


def _player_for(interaction: discord.Interaction) -> wavelink.Player | None:
    if not interaction.guild:
        return None
    return cast("wavelink.Player | None", interaction.guild.voice_client)


async def _ensure_voice_after_defer(
    interaction: discord.Interaction,
) -> wavelink.Player | None:
    """Same as `_ensure_voice` but for commands that have already deferred.

    Sends followup messages instead of initial responses.
    """
    if not isinstance(interaction.user, discord.Member):
        await interaction.followup.send(
            "هذا الأمر متاح في السيرفر فقط.", ephemeral=True
        )
        return None

    voice_state = interaction.user.voice
    if not voice_state or not voice_state.channel:
        await interaction.followup.send(
            "🔇 ادخل قناة صوتية أولاً، ثم استخدم الأمر.", ephemeral=True
        )
        return None

    guild = interaction.guild
    assert guild is not None
    player = cast("wavelink.Player | None", guild.voice_client)

    if player is None:
        try:
            player = await voice_state.channel.connect(  # type: ignore[arg-type]
                cls=wavelink.Player, self_deaf=False, self_mute=False
            )
        except Exception:
            log.exception("voice_channel.connect failed")
            await interaction.followup.send(
                "❌ فشل الاتصال بالقناة الصوتية.", ephemeral=True
            )
            return None
    elif player.channel != voice_state.channel:
        await interaction.followup.send(
            f"البوت في قناة أخرى ({player.channel.mention}). استخدم /leave أولاً.",
            ephemeral=True,
        )
        return None

    return player


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Music(bot))
