"""Daily DB backup task + admin commands.

Background task copies ``settings.db_path`` to a sibling ``backups/``
directory once every 24 hours, retaining the last :data:`KEEP_DAYS`
copies. Each copy is timestamped (``competitions-YYYYMMDD-HHMMSS.db``).

Admin commands:
- ``/admin_backup now`` — trigger a backup immediately.
- ``/admin_backup status`` — show the count, total size, and the latest
  backup timestamp.

The backup uses SQLite's online backup API via ``aiosqlite`` so it is safe
to run while the main DB is being written to.
"""
from __future__ import annotations

import datetime as _dt
import logging
import shutil
import time
from pathlib import Path

import aiosqlite
import discord
from discord import app_commands
from discord.ext import commands, tasks

from ..config import COLORS, Settings


_log = logging.getLogger(__name__)

INTERVAL_HOURS = 24
KEEP_DAYS = 14
BACKUP_PREFIX = "competitions-"
BACKUP_SUFFIX = ".db"


def _is_admin_or_mod(interaction: discord.Interaction) -> bool:
    if not isinstance(interaction.user, discord.Member):
        return False
    settings: Settings = interaction.client.settings  # type: ignore[attr-defined]
    if interaction.user.guild_permissions.administrator:
        return True
    role_ids = {r.id for r in interaction.user.roles}
    return bool(settings.role_mod and settings.role_mod in role_ids)


class BackupCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.settings: Settings = bot.settings  # type: ignore[attr-defined]
        self.backup_dir = Path(self.settings.db_path).parent / "backups"

    async def cog_load(self) -> None:
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.daily_backup.start()

    async def cog_unload(self) -> None:
        self.daily_backup.cancel()

    @tasks.loop(hours=INTERVAL_HOURS)
    async def daily_backup(self) -> None:
        try:
            path = await self._take_backup()
            self._prune_old()
            _log.info("Daily backup created: %s", path)
        except Exception as e:
            _log.exception("daily_backup failed: %s", e)

    @daily_backup.before_loop
    async def _before(self) -> None:
        await self.bot.wait_until_ready()

    async def _take_backup(self) -> Path:
        ts = _dt.datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        out = self.backup_dir / f"{BACKUP_PREFIX}{ts}{BACKUP_SUFFIX}"
        # Use SQLite's online backup API so concurrent writes are safe.
        async with aiosqlite.connect(self.settings.db_path) as src:
            async with aiosqlite.connect(str(out)) as dst:
                await src.backup(dst)
        return out

    def _prune_old(self) -> None:
        cutoff = time.time() - (KEEP_DAYS * 24 * 3600)
        for f in self.backup_dir.glob(f"{BACKUP_PREFIX}*{BACKUP_SUFFIX}"):
            try:
                if f.stat().st_mtime < cutoff:
                    f.unlink()
            except OSError:
                continue

    def _scan(self) -> list[Path]:
        return sorted(
            self.backup_dir.glob(f"{BACKUP_PREFIX}*{BACKUP_SUFFIX}"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )

    # --- admin commands ---
    backup_group = app_commands.Group(
        name="admin_backup",
        description="إدارة النسخ الاحتياطية لقاعدة البيانات",
        default_permissions=discord.Permissions(manage_guild=True),
    )

    @backup_group.command(name="now", description="أخذ نسخة احتياطية فورية")
    async def now(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            path = await self._take_backup()
            self._prune_old()
            size_mb = path.stat().st_size / (1024 * 1024)
            await interaction.followup.send(
                f"✅ تم إنشاء نسخة احتياطية: `{path.name}` ({size_mb:.2f} ميغابايت).",
                ephemeral=True,
            )
        except Exception as e:
            await interaction.followup.send(f"❌ فشل النسخ: `{e}`", ephemeral=True)

    @backup_group.command(name="status", description="حالة النسخ الاحتياطية")
    async def status(self, interaction: discord.Interaction):
        if not _is_admin_or_mod(interaction):
            await interaction.response.send_message("🚫 ليست لديك صلاحية.", ephemeral=True)
            return
        files = self._scan()
        total_size = sum(f.stat().st_size for f in files)
        embed = discord.Embed(
            title="🗄️ حالة النسخ الاحتياطية",
            color=COLORS.get("info", 0x3498DB),
        )
        embed.add_field(name="عدد النسخ", value=str(len(files)), inline=True)
        embed.add_field(
            name="المجموع",
            value=f"{total_size / (1024 * 1024):.2f} ميغابايت",
            inline=True,
        )
        embed.add_field(
            name="الاحتفاظ", value=f"{KEEP_DAYS} يوم", inline=True
        )
        if files:
            latest = files[0]
            mtime = _dt.datetime.fromtimestamp(latest.stat().st_mtime)
            embed.add_field(
                name="أحدث نسخة",
                value=f"`{latest.name}`\n<t:{int(latest.stat().st_mtime)}:R>",
                inline=False,
            )
            embed.add_field(
                name="جميع النسخ (آخر 10)",
                value="\n".join(f"• `{f.name}`" for f in files[:10]),
                inline=False,
            )
        else:
            embed.description = "لا توجد نسخ احتياطية بعد. استخدم `/admin_backup now`."
        embed.set_footer(text=f"المسار: {self.backup_dir}")
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(BackupCog(bot))
