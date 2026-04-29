"""Public music slash commands.

Members in a voice channel can queue songs, skip, pause, resume, etc.
Admin-only commands (clear queue, force-stop) live in admin_music.py.
"""
from __future__ import annotations

import logging
from typing import Optional

import discord
from discord import app_commands
from discord.ext import commands

from ..config import COLORS, Settings
from ..player import LoopMode, MusicPlayer, Track, resolve_query

_log = logging.getLogger(__name__)


def _fmt_duration(seconds: int | None) -> str:
    if not seconds or seconds < 0:
        return "—"
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def _progress_bar(elapsed: int, total: int | None, *, width: int = 20) -> str:
    if not total or total <= 0:
        return "🟪" * width
    ratio = max(0.0, min(1.0, elapsed / total))
    filled = int(ratio * width)
    return "🟪" * filled + "⬛" * (width - filled)


class MusicCog(commands.Cog):
    """Slash commands for queue management + playback."""

    def __init__(self, bot: commands.Bot, settings: Settings):
        self.bot = bot
        self.settings = settings
        # One MusicPlayer per guild.
        self.players: dict[int, MusicPlayer] = {}

    # ----- helpers -----

    def get_player(self, guild_id: int) -> MusicPlayer:
        p = self.players.get(guild_id)
        if p is None:
            p = MusicPlayer(
                guild_id=guild_id,
                volume=self.settings.default_volume / 100.0,
                _max_queue=self.settings.max_queue_length,
                _idle_seconds=self.settings.idle_disconnect_seconds,
            )
            p.on_track_start = lambda track: self._announce_now_playing(p, track)
            p.on_track_error = lambda track, err: self._announce_error(p, track, err)
            p.on_idle_disconnect = lambda: self._announce_idle(p)
            self.players[guild_id] = p
        return p

    async def _ensure_voice(
        self, interaction: discord.Interaction, *, must_be_in_same_channel: bool = False
    ) -> MusicPlayer | None:
        """Validate the user is in voice and return (or create) the player."""
        if not interaction.guild:
            await interaction.response.send_message(
                "هذا الأمر يعمل داخل السيرفر فقط.", ephemeral=True
            )
            return None
        member = interaction.user
        if not isinstance(member, discord.Member) or not member.voice or not member.voice.channel:
            await interaction.response.send_message(
                "🔇 لازم تكون داخل قناة صوتية أولاً.", ephemeral=True
            )
            return None

        player = self.get_player(interaction.guild.id)

        # Connect / move as needed.
        target = member.voice.channel
        vc = player.voice_client or interaction.guild.voice_client
        if vc and vc.channel != target:
            if must_be_in_same_channel:
                await interaction.response.send_message(
                    f"⚠️ البوت في قناة مختلفة (`{vc.channel}`). انضم لها أو استخدم `/leave` ثم حاول مجدداً.",
                    ephemeral=True,
                )
                return None
            try:
                await vc.move_to(target)
            except Exception:
                _log.exception("voice move failed")
        elif not vc:
            try:
                vc = await target.connect(self_deaf=True, reconnect=True)
            except discord.errors.ClientException as e:
                await interaction.response.send_message(
                    f"⚠️ ما قدرت أنضم: {e}", ephemeral=True
                )
                return None
            except Exception as e:
                _log.exception("voice connect failed")
                await interaction.response.send_message(
                    f"⚠️ خطأ بالاتصال: {e}", ephemeral=True
                )
                return None

        # ``vc`` from ``guild.voice_client`` is the canonical reference.
        player.voice_client = vc  # type: ignore[assignment]
        # Attach the channel so we know where to announce.
        if interaction.channel and interaction.channel.id:
            player.text_channel_id = interaction.channel.id
        return player

    # ----- announcements (player hooks) -----

    async def _send_to_text(self, player: MusicPlayer, embed: discord.Embed) -> None:
        ch = self.bot.get_channel(player.text_channel_id) if player.text_channel_id else None
        if isinstance(ch, (discord.TextChannel, discord.Thread)):
            try:
                await ch.send(embed=embed)
            except discord.Forbidden:
                _log.warning("missing perms to send in #%s", getattr(ch, "name", "?"))
            except Exception:
                _log.exception("failed to send announcement")

    async def _announce_now_playing(self, player: MusicPlayer, track: Track) -> None:
        embed = discord.Embed(
            title="🎵 الآن يُشغَّل",
            description=f"**[{track.display()}]({track.webpage_url or 'https://youtube.com'})**",
            color=COLORS["music"],
        )
        if track.uploader:
            embed.add_field(name="القناة", value=track.uploader, inline=True)
        embed.add_field(name="المدة", value=_fmt_duration(track.duration), inline=True)
        if track.requested_by_id:
            embed.add_field(name="طلب بواسطة", value=f"<@{track.requested_by_id}>", inline=True)
        if track.thumbnail:
            embed.set_thumbnail(url=track.thumbnail)
        await self._send_to_text(player, embed)
        # Bot-logs notification (best-effort)
        log_ch = self.bot.get_channel(self.settings.log_play)
        if isinstance(log_ch, discord.TextChannel):
            try:
                await log_ch.send(
                    f"▶️ `{track.display()}` — طلب <@{track.requested_by_id}> "
                    f"(guild={player.guild_id})"
                )
            except Exception:
                pass

    async def _announce_error(self, player: MusicPlayer, track: Track, err: Exception) -> None:
        embed = discord.Embed(
            title="⚠️ تعذّر تشغيل الأغنية",
            description=f"`{track.display()}` — {type(err).__name__}: {err}",
            color=COLORS["danger"],
        )
        await self._send_to_text(player, embed)
        log_ch = self.bot.get_channel(self.settings.log_errors)
        if isinstance(log_ch, discord.TextChannel):
            try:
                await log_ch.send(f"❌ `{track.display()}` — {type(err).__name__}: {err}")
            except Exception:
                pass

    async def _announce_idle(self, player: MusicPlayer) -> None:
        embed = discord.Embed(
            title="😴 خروج تلقائي",
            description="ما فيه أغانٍ بالقائمة منذ فترة — البوت سحب نفسه من القناة الصوتية.",
            color=COLORS["info"],
        )
        await self._send_to_text(player, embed)

    # ----- commands -----

    @app_commands.command(name="play", description="🎶 تشغيل أغنية أو رابط YouTube (يضيفها للقائمة)")
    @app_commands.describe(query="رابط YouTube أو كلمات بحث")
    async def play(self, interaction: discord.Interaction, query: str) -> None:
        player = await self._ensure_voice(interaction)
        if player is None:
            return

        await interaction.response.defer(thinking=True)

        try:
            tracks = await resolve_query(query, requested_by_id=interaction.user.id)
        except Exception as e:
            _log.exception("resolve_query failed")
            await interaction.followup.send(
                f"⚠️ ما قدرت أحلّل الرابط/الكلمات: `{type(e).__name__}: {e}`",
                ephemeral=True,
            )
            return

        if not tracks:
            await interaction.followup.send(
                "🔎 ما لقيت نتيجة. جرّب كلمات بحث أخرى أو رابط YouTube مباشر.",
                ephemeral=True,
            )
            return

        added = player.enqueue_many(tracks)
        if not player.is_playing():
            await player.play_next()

        if len(tracks) == 1:
            t = tracks[0]
            embed = discord.Embed(
                title="✅ أُضيفت للقائمة",
                description=f"**[{t.display()}]({t.webpage_url or 'https://youtube.com'})**",
                color=COLORS["success"],
            )
            embed.add_field(name="المدة", value=_fmt_duration(t.duration), inline=True)
            embed.add_field(name="الموقع في القائمة", value=str(len(player.queue)), inline=True)
            if t.thumbnail:
                embed.set_thumbnail(url=t.thumbnail)
            await interaction.followup.send(embed=embed)
        else:
            await interaction.followup.send(
                embed=discord.Embed(
                    title=f"🎶 أُضيفت {added} أغنية للقائمة",
                    description=f"إجمالي القائمة الآن: **{len(player.queue)}**",
                    color=COLORS["success"],
                )
            )

    @app_commands.command(name="skip", description="⏭️ تخطّي الأغنية الحالية")
    async def skip(self, interaction: discord.Interaction) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        if not player.is_playing():
            await interaction.response.send_message(
                "⏸️ لا توجد أغنية تُشغَّل حالياً.", ephemeral=True
            )
            return
        title = player.now_playing.display() if player.now_playing else "?"
        player.skip()
        await interaction.response.send_message(f"⏭️ تم تخطّي **{title}**.")

    @app_commands.command(name="queue", description="📋 عرض قائمة الأغاني")
    async def queue_(self, interaction: discord.Interaction) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        embed = discord.Embed(title="📋 قائمة الأغاني", color=COLORS["music"])

        if player.now_playing:
            embed.add_field(
                name="🎵 الآن يُشغَّل",
                value=f"**{player.now_playing.display()}** "
                      f"({_fmt_duration(player.progress_seconds())} / "
                      f"{_fmt_duration(player.now_playing.duration)})",
                inline=False,
            )

        if not player.queue:
            embed.description = "لا توجد أغانٍ في قائمة الانتظار."
        else:
            preview = []
            for i, t in enumerate(list(player.queue)[:10], start=1):
                preview.append(
                    f"`{i}.` **{t.display()}** — {_fmt_duration(t.duration)} "
                    f"(<@{t.requested_by_id}>)"
                )
            if len(player.queue) > 10:
                preview.append(f"… و **{len(player.queue) - 10}** أغنية إضافية")
            embed.description = "\n".join(preview)

        embed.set_footer(
            text=f"وضع التكرار: {player.loop_mode.value} | الصوت: "
                 f"{int(player.volume * 100)}%"
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="pause", description="⏸️ إيقاف مؤقت")
    async def pause(self, interaction: discord.Interaction) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        if player.pause():
            await interaction.response.send_message("⏸️ تم الإيقاف المؤقت.")
        else:
            await interaction.response.send_message(
                "ℹ️ لا توجد أغنية قيد التشغيل لإيقافها.", ephemeral=True
            )

    @app_commands.command(name="resume", description="▶️ متابعة التشغيل بعد الإيقاف المؤقت")
    async def resume(self, interaction: discord.Interaction) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        if player.resume():
            await interaction.response.send_message("▶️ تم استئناف التشغيل.")
        else:
            await interaction.response.send_message(
                "ℹ️ لا توجد أغنية متوقّفة مؤقتاً.", ephemeral=True
            )

    @app_commands.command(name="stop", description="⏹️ إيقاف التشغيل ومسح القائمة")
    async def stop(self, interaction: discord.Interaction) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        await player.stop()
        await interaction.response.send_message(
            "⏹️ تم الإيقاف ومسح قائمة الانتظار، وخرج البوت من القناة الصوتية."
        )

    @app_commands.command(name="loop", description="🔁 وضع التكرار: off / track / queue")
    @app_commands.describe(mode="off=بدون | track=تكرار الأغنية | queue=تكرار القائمة")
    @app_commands.choices(mode=[
        app_commands.Choice(name="إيقاف التكرار", value="off"),
        app_commands.Choice(name="تكرار الأغنية الحالية", value="track"),
        app_commands.Choice(name="تكرار قائمة الانتظار", value="queue"),
    ])
    async def loop(self, interaction: discord.Interaction, mode: app_commands.Choice[str]) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        try:
            player.loop_mode = LoopMode(mode.value)
        except ValueError:
            player.loop_mode = LoopMode.OFF
        await interaction.response.send_message(
            f"🔁 وضع التكرار الآن: **{player.loop_mode.value}**"
        )

    @app_commands.command(name="volume", description="🔊 مستوى الصوت (0-200)")
    @app_commands.describe(level="مستوى الصوت من 0 إلى 200")
    async def volume(self, interaction: discord.Interaction, level: app_commands.Range[int, 0, 200]) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        player.set_volume(level)
        await interaction.response.send_message(
            f"🔊 مستوى الصوت الآن: **{int(player.volume * 100)}%**"
        )

    @app_commands.command(name="nowplaying", description="🎵 معلومات الأغنية الحالية")
    async def nowplaying(self, interaction: discord.Interaction) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        if not player.now_playing:
            await interaction.response.send_message(
                "⏸️ لا توجد أغنية تُشغَّل حالياً.", ephemeral=True
            )
            return
        t = player.now_playing
        elapsed = player.progress_seconds()
        embed = discord.Embed(
            title="🎵 الآن يُشغَّل",
            description=f"**[{t.display()}]({t.webpage_url or 'https://youtube.com'})**",
            color=COLORS["music"],
        )
        bar = _progress_bar(elapsed, t.duration)
        embed.add_field(
            name="التقدّم",
            value=f"{bar}\n`{_fmt_duration(elapsed)} / {_fmt_duration(t.duration)}`",
            inline=False,
        )
        if t.uploader:
            embed.add_field(name="القناة", value=t.uploader, inline=True)
        if t.requested_by_id:
            embed.add_field(name="طلب بواسطة", value=f"<@{t.requested_by_id}>", inline=True)
        embed.add_field(name="القائمة", value=f"**{len(player.queue)}** بانتظار", inline=True)
        if t.thumbnail:
            embed.set_thumbnail(url=t.thumbnail)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="join", description="📥 ضمّ البوت إلى قناتك الصوتية")
    async def join(self, interaction: discord.Interaction) -> None:
        player = await self._ensure_voice(interaction)
        if player is None:
            return
        await interaction.response.send_message(
            f"✅ انضممت إلى **{player.voice_client.channel}**." if player.voice_client else "✅ انضممت."
        )

    @app_commands.command(name="leave", description="📤 إخراج البوت من القناة الصوتية")
    async def leave(self, interaction: discord.Interaction) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        if not player.voice_client or not player.voice_client.is_connected():
            await interaction.response.send_message(
                "ℹ️ البوت ليس في أي قناة صوتية.", ephemeral=True
            )
            return
        await player.stop()
        await interaction.response.send_message("👋 إلى اللقاء.")

    @app_commands.command(name="remove", description="🗑️ حذف أغنية من القائمة (1 = الأولى)")
    @app_commands.describe(position="رقم الأغنية في القائمة")
    async def remove(self, interaction: discord.Interaction, position: app_commands.Range[int, 1, 1000]) -> None:
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        if position > len(player.queue):
            await interaction.response.send_message(
                f"⚠️ القائمة فيها **{len(player.queue)}** فقط.", ephemeral=True
            )
            return
        # deque doesn't support O(1) random delete; pop+rebuild is fine for ≤100 items.
        items = list(player.queue)
        removed = items.pop(position - 1)
        player.queue.clear()
        player.queue.extend(items)
        await interaction.response.send_message(
            f"🗑️ حُذفت من القائمة: **{removed.display()}**"
        )

    @app_commands.command(name="shuffle", description="🔀 خلط ترتيب القائمة عشوائياً")
    async def shuffle(self, interaction: discord.Interaction) -> None:
        import random
        if not interaction.guild:
            return
        player = self.get_player(interaction.guild.id)
        if len(player.queue) < 2:
            await interaction.response.send_message(
                "ℹ️ القائمة قصيرة جداً للخلط.", ephemeral=True
            )
            return
        items = list(player.queue)
        random.shuffle(items)
        player.queue.clear()
        player.queue.extend(items)
        await interaction.response.send_message(f"🔀 خُلطت **{len(items)}** أغنية.")


async def setup(bot: commands.Bot):
    settings: Optional[Settings] = getattr(bot, "settings", None)
    if settings is None:
        raise RuntimeError("MusicCog requires bot.settings to be set")
    await bot.add_cog(MusicCog(bot, settings))
