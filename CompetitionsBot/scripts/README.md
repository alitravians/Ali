# Server Setup Scripts

Helper scripts for configuring the Discord server (channels, roles, permissions).

## fix_permissions.py

Re-applies a 3-tier permission model on every relevant channel via the Discord REST API.

| Tier | Channels | @everyone | Admin | Mod |
|---|---|---|---|---|
| 🔴 **ADMIN-ONLY** (hidden from members) | `⚙ ━ إدارة ━` (category) + `📋│سجل-البوت` | deny VIEW_CHANNEL | full | view + send |
| 🟡 **READ-ONLY** | `📋│قواعد-المسابقات`, `📢│إعلانات-المسابقات`, `🎁│جوائز-الأسبوع`, `🏅│المتصدرون`, `📜│الأرشيف`, `📊│إحصائيات-السيرفر` | view + read history + react, deny send + slash | full + manage messages + mention everyone | full + manage messages |
| 🟢 **OPEN-WRITE** | `🎮│بدء-مسابقة`, `🎯│المسابقة-الحالية`, `💬│نقاش-المسابقات`, `🐛│بلاغات-البوت`, `👋│الترحيب` | view + send + slash + history + react | (inherits) | (inherits) |
| 🔇 **BANNED** | `🎮│بدء-مسابقة`, `🎯│المسابقة-الحالية` | (n/a) | (n/a) | (n/a) — banned role denied VIEW_CHANNEL |
| 🎙️ **VOICE** | All voice channels | view + connect + speak + slash | (inherits) | (inherits) |

### Usage
```bash
export DISCORD_BOT_TOKEN="..."
python3 scripts/fix_permissions.py
```

The script is **idempotent** — running it multiple times is safe and just reapplies the
desired state. It includes 429 rate-limit handling.

### When to run
- After creating a new channel (manual creation may not pick up the right tier)
- When permissions feel "off"
- After restoring from a backup
