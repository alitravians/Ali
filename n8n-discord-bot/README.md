# n8n Discord Bot System - alitravians

نظام بوت Discord احترافي متكامل مبني على **n8n** (workflow automation) + **Discord Gateway Bridge** + **Groq AI**.

كل شيء **مجاني 100%** ويعمل على Fly.io مع SQLite (بدون أي اشتراكات).

## نظرة عامة

النظام يوفر 12 ميزة جاهزة للتشغيل:

| # | الميزة | الوصف |
|---|--------|-------|
| 01 | **AI Bot** | بوت ذكاء اصطناعي يرد على الأسئلة عند ذكره (Groq + Llama-3.3) |
| 02 | **Ticket System** | فتح تذاكر دعم فني عبر `/ticket` مع قنوات خاصة |
| 03 | **Auto Moderation** | فحص الكلمات الممنوعة وحذف الرسائل المخالفة |
| 04 | **Welcome System** | ترحيب آلي بالأعضاء الجدد برسائل AI مخصصة |
| 05 | **Reaction Roles** | تعيين الأدوار عبر التفاعل بالايموجي |
| 06 | **Polls** | استطلاعات رأي تفاعلية مع توقيت |
| 07 | **Leveling / XP** | نظام مستويات ونقاط مع `/level` و `/leaderboard` |
| 08 | **Cross-Posting** | نسخ الرسائل بين قنوات/سيرفرات |
| 09 | **Stats Dashboard** | تقارير يومية تلقائية للسيرفر |
| 10 | **Auto-Archive** | أرشفة القنوات الخاملة تلقائياً |
| 11 | **Birthday Reminders** | تهاني أعياد ميلاد تلقائية بالـ AI |
| 12 | **Giveaway** | سحوبات جوائز تفاعلية عبر `/giveaway` |

## البنية المعمارية

```
Discord  <---->  Gateway Bridge (Node.js)  ---->  n8n Webhooks  ---->  Workflows  ---->  Discord REST API
  Gateway          (يحول الأحداث الفورية)         (12 webhook)        (12 workflow)      (إرسال الرسائل)
                                                  |
                                                  +----  Groq API (AI)
                                                  +----  Static Data (XP / birthdays / giveaways)
```

### المكونات الثلاثة

#### 1. n8n (`./n8n/`)
- منصة workflow automation
- مستضافة على Fly.io
- قاعدة بيانات SQLite محلية (volume دائم)
- تستقبل webhooks من gateway bridge وتنفذ المنطق

#### 2. Gateway Bridge (`./gateway-bridge/`)
- خدمة Node.js صغيرة (discord.js)
- متصلة بـ Discord Gateway مباشرة
- تستمع للأحداث (message_create, member_join, reactions, slash commands)
- تحول كل حدث إلى POST request على webhook n8n المناسب
- خفيفة جداً (256MB RAM كافية)

#### 3. Workflows (`./workflows/`)
- 12 ملف JSON قابل للاستيراد مباشرة في n8n
- كل workflow مستقل
- يستخدم n8n Static Data للتخزين الدائم (XP, birthdays, giveaways)
- يتصل بـ Discord API عبر HTTP Request مع Bot token

## النشر السريع (Quick Deploy)

### المتطلبات
- [Fly.io](https://fly.io) account + [flyctl](https://fly.io/docs/hands-on/install-flyctl/)
- Discord Bot Token + Application ID + Guild ID
- Groq API Key (مجاني من [console.groq.com](https://console.groq.com))

### الخطوات
```bash
# 1) Clone والدخول للمجلد
cd n8n-discord-bot

# 2) عيّن المتغيرات
export DISCORD_BOT_TOKEN="..."
export DISCORD_APP_ID="..."
export DISCORD_GUILD_ID="..."
export GROQ_API_KEY="..."
export N8N_BASIC_AUTH_PASSWORD="$(openssl rand -hex 16)"

# 3) شغّل سكريبت النشر الكامل
chmod +x scripts/*.sh
./scripts/deploy.sh

# 4) افتح n8n وأنشئ API key
# https://alitravians-n8n.fly.dev
# Settings > n8n API > Create

# 5) عيّن مفتاح n8n واستورد الـ workflows والـ credentials
export N8N_API_KEY="..."
export N8N_URL="https://alitravians-n8n.fly.dev"
./scripts/setup-credentials.sh
./scripts/import-workflows.sh

# 6) سجل slash commands على Discord
cd gateway-bridge
npm install
npm run register-commands

# 7) فعّل كل workflow من واجهة n8n
```

## التفاصيل التقنية

### Environment Variables المطلوبة

#### للـ gateway bridge:
- `DISCORD_BOT_TOKEN` - توكن البوت
- `DISCORD_GUILD_ID` - معرف السيرفر
- `N8N_WEBHOOK_BASE` - رابط n8n (مثل `https://alitravians-n8n.fly.dev`)
- `BRIDGE_SECRET` - سر مشترك بين البريدج و n8n (اختياري للأمان)

#### للـ n8n (Fly secrets):
- `N8N_ENCRYPTION_KEY` - مفتاح تشفير الـ credentials (64 hex chars)
- `N8N_BASIC_AUTH_USER` + `N8N_BASIC_AUTH_PASSWORD` - حماية الواجهة
- `WEBHOOK_URL` - الرابط العام للـ webhooks

#### Environment variables داخل workflows (تُضبط في n8n UI):
- `DISCORD_GUILD_ID` - معرف السيرفر
- `WELCOME_CHANNEL_ID` - قناة الترحيب
- `MOD_LOG_CHANNEL_ID` - قناة سجل الإشراف
- `TICKETS_CATEGORY_ID` - فئة التذاكر
- `STATS_CHANNEL_ID` - قناة الإحصائيات
- `ARCHIVE_CATEGORY_ID` - فئة المؤرشفة
- `GENERAL_CHANNEL_ID` - القناة العامة (لأعياد الميلاد)
- `DEFAULT_ROLE_ID` - الدور الافتراضي للأعضاء الجدد
- `PROTECTED_CHANNEL_IDS` - قنوات لا تُؤرشف (مفصولة بفاصلة)
- `INACTIVE_DAYS` - عدد الأيام للأرشفة التلقائية (افتراضي 30)
- `BANNED_WORDS` - كلمات ممنوعة (مفصولة بفاصلة)

### الصلاحيات المطلوبة للبوت
حسب [Discord Bot Permissions Recipe](../CompetitionsBot/) لمشروع alitravians:
- View Channels
- Send Messages
- Embed Links
- Read Message History
- Add Reactions
- Manage Channels (للتذاكر والأرشفة)
- Manage Roles (لـ reaction roles والترحيب)
- Manage Messages (للإشراف)
- Use Application Commands

**Privileged Intents (مطلوبة من Discord Developer Portal):**
- ✅ MESSAGE CONTENT INTENT
- ✅ SERVER MEMBERS INTENT
- ✅ PRESENCE INTENT (اختياري)

⚠️ **لا تعطي البوت Administrator**. اتبع مبدأ least privilege.

### Static Data Storage
بعض الـ workflows تستخدم `$getWorkflowStaticData('global')` لتخزين بيانات صغيرة في n8n نفسها:
- **XP / Leveling:** `staticData.xp[userId]`
- **Birthdays:** `staticData.birthdays[userId]`
- **Giveaways:** `staticData.giveaways[giveawayId]`
- **Reaction Roles map:** `staticData.reactionRoleMap[messageId|emoji]`
- **Cross-post routes:** `staticData.crossRoutes[sourceChannelId]`

**ملاحظة:** Static data مرتبط بـ workflow معين. للحفظ الدائم عبر workflows متعددة، أضف Supabase/Postgres لاحقاً (راجع `docs/UPGRADING.md`).

## الإدارة والتشغيل

### عرض السجلات (Logs)
```bash
# n8n logs
flyctl logs -a alitravians-n8n

# Gateway bridge logs
flyctl logs -a alitravians-discord-bridge
```

### إعادة النشر
```bash
cd n8n && flyctl deploy --remote-only
cd gateway-bridge && flyctl deploy --remote-only
```

### النسخ الاحتياطي
```bash
# اسحب database.sqlite من volume
flyctl ssh sftp shell -a alitravians-n8n
> get /data/database.sqlite
```

## التوسيع (Roadmap)
- [ ] استبدال SQLite بـ Postgres على Fly Postgres / Supabase
- [ ] إضافة Music Bot كخدمة منفصلة (discord.py)
- [ ] لوحة Web UI خاصة بـ alitravians لإدارة الـ workflows
- [ ] تكامل مع War Tracker لتنبيهات الأحداث
- [ ] تكامل مع CompetitionsBot لمشاركة ELO leaderboard

## الترخيص
Sustainable Use License (نفس ترخيص n8n)

## المساهمة
PRs مرحب بها. اتبع `CONTRIBUTING.md` (قريباً).

---

**صنع لـ alitravians بكامل الحب 🤍**
