# BOON Community Bot — دليل التثبيت

البوت يدير سيرفر مجتمع BOON على Discord: قنوات، رتب، صلاحيات، ترحيب آلي، ربط GitHub.

> ⚠️ **مهم**: ما يُمنح البوت صلاحية `Administrator` أبداً. كل صلاحياته على مستوى القناة الواحدة (٣-tier model) وقابلة للمراجعة.

---

## ١. متطلبات أولية

| البند | ملاحظات |
|-------|---------|
| Python 3.11+ | للتشغيل المحلي وتشغيل الـ scripts |
| حساب Discord مع سيرفر فاضي | تنشئه أنت — البوت ما يقدر ينشئ سيرفر |
| Discord Application + Bot Token | https://discord.com/developers/applications |
| (اختياري) حساب Fly.io | للنشر المجاني — `flyctl auth signup` |
| (اختياري) GitHub PAT | لـ `/report` slash command |

---

## ٢. إنشاء Discord Application

١. ادخل https://discord.com/developers/applications  
٢. اضغط **New Application** → سمّه `BOON Community Bot` → Create  
٣. اذهب لـ **Bot** من الـ sidebar → **Reset Token** → انسخه واحفظه (هذا `DISCORD_BOT_TOKEN`)  
٤. في نفس الصفحة فعّل التالي تحت Privileged Gateway Intents:
   - **SERVER MEMBERS INTENT** ✅ (مطلوب للترحيب)
   - **MESSAGE CONTENT INTENT** ❌ (غير مطلوب، اتركه مغلق)

---

## ٣. دعوة البوت لسيرفرك

١. في صفحة الـ Application → **OAuth2** → **URL Generator**  
٢. تحت **SCOPES** اختر:
   - ✅ `bot`
   - ✅ `applications.commands`
٣. تحت **BOT PERMISSIONS** اختر **هذي الصلاحيات فقط** (لا تختر `Administrator`):
   - View Channels
   - Manage Channels
   - Manage Roles
   - Send Messages
   - Send Messages in Threads
   - Manage Messages (لتثبيت رسالة الترحيب)
   - Embed Links
   - Attach Files
   - Read Message History
   - Add Reactions
   - Use Slash Commands
   - Manage Webhooks
٤. انسخ الـ URL في الأسفل، الصقه في المتصفّح، اختر السيرفر، **Authorize**.

---

## ٤. الحصول على Guild ID

في تطبيق Discord:  
**User Settings → Advanced → Developer Mode** (فعّله)، ثم **Right-click on the server icon → Copy Server ID**.

---

## ٥. تشغيل scripts/setup_server.py (بناء القنوات والرتب)

```bash
cd boon-community-bot
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export DISCORD_BOT_TOKEN="MTQxXXXXXXXXXXXXXXXX..."   # من خطوة ٢
export GUILD_ID="123456789012345678"                   # من خطوة ٤

python -m scripts.setup_server
```

**شنو يسوي**:
- ينشئ ٩ رتب: `admin / maintainer / plugin-dev / moderator / helper / VIP / member / unverified / banned / bots`
- ينشئ ٧ categories و ٢٤ قناة من ملف `bot/structure.py`
- يكتب `server_config.json` فيه كل الـ IDs

**ميزة هامة**: idempotent — تقدر تعيده مرات لا تحصى، ما يحذف شي، يضيف فقط الناقص.

---

## ٦. تطبيق نظام الصلاحيات (٣-tier)

```bash
python -m scripts.fix_permissions
```

**النظام**:

| Tier | @everyone view | @everyone send | استخدام |
|------|---------------|----------------|---------|
| 🔴 `ADMIN_ONLY` | deny | deny | bot-logs، admin-only chat |
| 🟡 `READ_ONLY` | allow | deny | announcements، rules، welcome |
| 🟢 `OPEN_WRITE` | allow | allow | discussion، general chat |
| 🎤 `VOICE_OPEN` | allow | n/a | غرفة صوت عامة |
| 🔇 `VOICE_ADMIN` | deny | n/a | اجتماعات الإدارة |

البوت يطبّق هذا تلقائياً على كل قناة حسب tier المُعرَّف في `bot/structure.py`.

---

## ٧. التحقق (audit)

```bash
python -m scripts.audit
```

يطبع لكل قناة:
- اسمها
- الـ tier المُعرَّف
- صلاحيات `@everyone` الفعلية على Discord
- ✅ لو متطابق، ❌ لو فيه فرق

**يخرج بـ exit code 0 لو كل شي تمام، 1 لو فيه deviation**. مفيد للـ CI.

---

## ٨. تشغيل البوت محلياً (للتطوير)

```bash
export DISCORD_BOT_TOKEN="..."
export GUILD_ID="..."
# اختياري (لـ /report و الـ webhook):
export GITHUB_TOKEN="ghp_..."          # GitHub PAT بصلاحية Issues
export GITHUB_WEBHOOK_SECRET="رقم سرّي"  # نفس الحرفي اللي تحطه في GitHub webhook

python -m bot.main
```

البوت يفتح:
- اتصال Gateway مع Discord (للترحيب + slash commands)
- HTTP server على port `8080` (لاستقبال GitHub webhooks)

افتح أي قناة في سيرفرك، اكتب `/version` — يرجّع آخر release من GitHub.

---

## ٩. نشر البوت على Fly.io مجاناً

١. ثبّت Fly CLI:  
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
٢. سجّل دخول:  
   ```bash
   flyctl auth login
   ```
٣. أنشئ التطبيق:  
   ```bash
   cd boon-community-bot
   flyctl launch --name boon-community-bot --no-deploy --copy-config
   ```
٤. أرسل الـ secrets:  
   ```bash
   flyctl secrets set \
     DISCORD_BOT_TOKEN="..." \
     GUILD_ID="..." \
     GITHUB_TOKEN="ghp_..." \
     GITHUB_WEBHOOK_SECRET="..."
   ```
٥. ارفع `server_config.json` (يتولّد من خطوة ٥):  
   ```bash
   flyctl deploy
   ```

بعدها CI deploy يدور تلقائياً عند كل push للـ `main` يلمس `boon-community-bot/`. شوف:  
[.github/workflows/bot-deploy.yml](../.github/workflows/bot-deploy.yml)

---

## ١٠. ربط GitHub Webhook

١. ادخل على `https://github.com/alitravians/Ali/settings/hooks` → **Add webhook**  
٢. **Payload URL**: `https://boon-community-bot.fly.dev/webhooks/github`  
٣. **Content type**: `application/json`  
٤. **Secret**: نفس قيمة `GITHUB_WEBHOOK_SECRET` (من خطوة ٩)  
٥. **Which events?** → **Let me select individual events** → اختر:  
   - ✅ Releases  
   - ✅ Issues  
   - ✅ Pull requests  
٦. Active ✅ → Save  

عند أول release، تنفتح لك رسالة في `#الإعلانات` تلقائياً.

---

## ١١. صيانة دورية

| متى | الأمر |
|----|------|
| لما تضيف plugin/قناة في `structure.py` | `python -m scripts.setup_server` |
| لما تتغير صلاحيات يدوياً وتبي ترجعها لـ baseline | `python -m scripts.fix_permissions` |
| كل أسبوع للتأكد لا أحد عبث | `python -m scripts.audit` |

---

## ١٢. troubleshooting

### "missing required env var: DISCORD_BOT_TOKEN"
ما صدّرت المتغير. اشغّل `echo $DISCORD_BOT_TOKEN` للتأكد، أو اعمل `.env` ملف:  
```bash
cp .env.example .env
# عدّل القيم في .env
```

### "guild not visible; slash commands NOT synced"
- البوت لم يُدعَ للسيرفر بعد، أو
- الـ `GUILD_ID` خطأ. تأكّد منه (Developer Mode → Copy Server ID).

### "missing perms to assign @unverified to ..."
- ترتيب الرتب: ضع رتبة البوت **فوق** رتبة `@unverified` و `@member` في **Server Settings → Roles** (اسحبها لأعلى).

### `fix_permissions.py` failing on 50013
- البوت ما عنده Manage Channels على القناة المُستهدفة. تحقّق من overwrites القناة في Discord مباشرة، أو شغّل `python -m scripts.fix_permissions` بعد ما تعطي البوت Manage Channels على الـ category مؤقتاً.

---

## ١٣. مراجع داخلية

- [`bot/structure.py`](bot/structure.py) — تعريف القنوات/الرتب/الـ tiers (canonical)
- [`scripts/setup_server.py`](scripts/setup_server.py) — بناء السيرفر idempotent
- [`scripts/fix_permissions.py`](scripts/fix_permissions.py) — تطبيق 3-tier model
- [`scripts/audit.py`](scripts/audit.py) — التحقق
- [`bot/cogs/welcome.py`](bot/cogs/welcome.py) — ترحيب + تحقّق
- [`bot/cogs/info.py`](bot/cogs/info.py) — `/install`، `/plugin`، `/version`
- [`bot/cogs/report.py`](bot/cogs/report.py) — `/report` → GitHub Issue
- [`bot/cogs/github_listener.py`](bot/cogs/github_listener.py) — webhook receiver
