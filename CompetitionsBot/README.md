# 🏆 بوت المسابقات (Competitions Bot)

بوت Discord احترافي لإدارة المسابقات في سيرفر **A💗M's**. يدعم 8+ أنواع من المسابقات بواجهة عربية تفاعلية، نظام نقاط ومستويات، شارات إنجاز، رتب تلقائية، ولوحة متصدرين أسبوعية وشهرية وإجمالية.

![Status](https://img.shields.io/badge/status-production-success) ![Discord.py](https://img.shields.io/badge/discord.py-2.4-blue) ![Python](https://img.shields.io/badge/python-3.12-green) ![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ المميزات الأساسية

- 🎯 **8 أوامر slash تفاعلية**: `/quiz`, `/race`, `/contest`, `/tournament`, `/daily`, `/leaderboard`, `/profile`, `/help`, `/about`, `/stats`, `/admin`
- 🎉 **رسائل ترحيب تلقائية** قبل كل مسابقة + countdown محرك بصرياً
- 🎨 **4+ أنماط بصرية مختلفة** للأسئلة (Card, Compact, Story, List)
- 🎨 **8 ثيمات لونية** عشوائية لكل سؤال
- 🎮 **3 أنواع من واجهات الإدخال**: Buttons (A/B/C/D), Select Menu، True/False
- 💰 **نظام نقاط ومستويات (XP)** + سلسلة إجابات صحيحة + bonus سرعة
- 🏅 **8 إنجازات/شارات** قابلة للفتح
- 🎖️ **رتب تلقائية** تُمنح حسب الإنجاز (نشيط، خبير، بطل)
- 📊 **لوحة متصدرين** أسبوعية / شهرية / إجمالية تتحدّث تلقائياً
- 🌟 **سؤال يومي** بنقاط مضاعفة + سلسلة أيام
- 🏆 **بطولة إقصائية 1v1** بتسجيل تفاعلي + brackets ديناميكية
- 🎮 **مسابقات مخصصة** للإدمن (MCQ أو سؤال مفتوح)
- 📚 **70+ سؤال عربي** بـ 9 فئات (عام، عربي، تاريخ، جغرافيا، رياضة، تقنية، إسلامي، علوم، أفلام)
- 💾 **قاعدة بيانات SQLite** للحفظ الدائم (مع دعم mounted volume على fly.io)

## 📦 هيكل المشروع

```
CompetitionsBot/
├── bot/
│   ├── main.py            # نقطة الدخول
│   ├── config.py          # تحميل الإعدادات (env + server_config.json)
│   ├── db.py              # SQLite async layer
│   ├── utils.py           # Embeds, Views, Buttons, Themes
│   ├── questions.py       # بنك الأسئلة العربي
│   └── cogs/
│       ├── help_cmd.py    # /help, /about
│       ├── welcome.py     # ترحيب تلقائي بالأعضاء + helper
│       ├── quiz.py        # /quiz - المحرك الرئيسي
│       ├── race.py        # /race - سباق سرعة
│       ├── daily.py       # /daily - سؤال يومي
│       ├── contest.py     # /contest - مسابقة مخصصة
│       ├── tournament.py  # /tournament - بطولة 1v1
│       ├── leaderboard.py # /leaderboard
│       ├── profile.py     # /profile
│       ├── admin.py       # /admin reset/ban/announce
│       └── stats_loop.py  # /stats + auto-update background loop
├── data/                  # SQLite database location (gitignored)
├── server_config.json     # IDs للقنوات والرتب
├── requirements.txt
├── pyproject.toml
├── Dockerfile             # للنشر على fly.io
├── fly.toml               # إعدادات fly.io
├── .env.example
└── README.md
```

## 🚀 التشغيل المحلي

### المتطلبات
- Python 3.11+
- مكتبات: `discord.py`, `aiohttp`, `python-dotenv`, `aiosqlite`

### الخطوات

```bash
# 1) Clone
git clone https://github.com/alitravians/CompetitionsBot.git
cd CompetitionsBot

# 2) Virtual env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3) Configure
cp .env.example .env
# Edit .env and set DISCORD_BOT_TOKEN

# 4) Run
python -m bot.main
```

سيبدأ البوت ويُسجل أوامر slash في السيرفر. أول إقلاع يأخذ بضع ثوانٍ لمزامنة الأوامر.

## 🐳 النشر على fly.io

```bash
# 1) Login
flyctl auth login

# 2) Initialize (auto-detects Dockerfile)
flyctl launch --no-deploy --copy-config --name competitions-bot-am

# 3) Set the bot token as a secret
flyctl secrets set DISCORD_BOT_TOKEN="your_bot_token_here"

# 4) Create persistent volume for SQLite
flyctl volumes create competitions_data --size 1 --region fra

# 5) Deploy
flyctl deploy
```

البوت سيعمل **24/7** ويعيد التشغيل تلقائياً عند الفشل.

### عرض اللوقات
```bash
flyctl logs
```

## ⚙️ التكوين (Configuration)

يقرأ البوت إعداداته من مصدرين، بالأولوية:
1. **متغيرات البيئة** (`.env` أو `flyctl secrets`)
2. **server_config.json** — مولّد تلقائياً عند إعداد السيرفر

### المتغيرات المطلوبة
| المتغير | الوصف |
|--------|--------|
| `DISCORD_BOT_TOKEN` | توكن البوت (إلزامي) |
| `GUILD_ID` | معرّف السيرفر |
| `DB_PATH` | مسار قاعدة البيانات |

## 🎮 الأوامر

| الأمر | الوصف | الصلاحيات |
|------|--------|----------|
| `/quiz` | بدء مسابقة ترفيا (فئة + صعوبة + عدد أسئلة) | الكل |
| `/race` | سباق سرعة (1-5 جولات) | الكل |
| `/daily` | السؤال اليومي (نقاط مضاعفة) | الكل |
| `/contest` | مسابقة مخصصة (MCQ/مفتوح) | إدمن/منسق |
| `/tournament` | بطولة 1v1 إقصائية (4 أو 8 لاعبين) | الكل |
| `/leaderboard` | لوحة المتصدرين (أسبوع/شهر/كل الوقت) | الكل |
| `/profile [user]` | الملف الشخصي والإحصائيات | الكل |
| `/stats` | إحصائيات السيرفر | الكل |
| `/help` | قائمة الأوامر التفاعلية | الكل |
| `/about` | معلومات البوت | الكل |
| `/admin reset_weekly` | تصفير نقاط الأسبوع | إدمن/منسق |
| `/admin reset_monthly` | تصفير نقاط الشهر | إدمن/منسق |
| `/admin announce <message>` | إرسال إعلان | إدمن/منسق |
| `/admin grant_points <user> <pts>` | منح نقاط يدوياً | إدمن/منسق |
| `/admin ban <user>` | حظر من المسابقات | إدمن/منسق |
| `/admin unban <user>` | رفع الحظر | إدمن/منسق |

## 🏗️ البنية الداخلية

### Cogs Pattern
كل أمر في cog مستقل تحت `bot/cogs/`. يتم تحميلها ديناميكياً عند الإقلاع في `main.py`.

### قاعدة البيانات
- `users`: نقاط، إنجازات، سلسلة، إحصائيات
- `competitions`: سجل كامل لكل مسابقة
- `daily_state`: تتبّع السؤال اليومي
- `bot_state`: مفاتيح/قيم لإعدادات البوت

### الترحيب وتنوع الأسئلة
- `utils.build_welcome_embed()` يختار رسالة ترحيب عشوائية من 8 رسائل
- `utils.countdown_message()` countdown محرك بـ 3-2-1
- `utils.build_question_embed_card()` بـ 4 أنماط: card, compact, story, list
- 8 ثيمات لونية في `QUESTION_THEMES` تُختار عشوائياً
- 3 أنواع views: `MultipleChoiceView`, `SelectMenuView`, `TrueFalseView`

## 🛠️ التطوير

### إضافة سؤال جديد
عدّل `bot/questions.py` وأضف dict جديدة بنفس الشكل:
```python
{"id": "x1", "category": "...", "difficulty": "...", "type": "mcq",
 "question": "...", "choices": ["A","B","C","D"], "answer_index": 0}
```

### إضافة cog جديد
أنشئ ملف `bot/cogs/<name>.py` بـ `setup(bot)` async function وكلاس `commands.Cog`. أضفه لقائمة `setup_hook` في `main.py`.

## 🤝 المساهمة
PRs مرحب بها! اقرأ `.env.example` وابدأ من `bot/main.py`.

## 📝 الترخيص
MIT

---

من تطوير [Devin](https://devin.ai) من [Cognition AI](https://cognition.ai) لـ ali (alitravians).
