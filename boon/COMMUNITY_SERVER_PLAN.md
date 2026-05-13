# BOON Community Server — Plan

Reference: Vencord's `libVencore` server structure (May 2026 snapshot).

This document is a **roadmap**, not part of the v0.1.0 release. It will be
executed when BOON has enough users to justify a dedicated Discord server.

---

## Suggested category & channel layout

```
🌟 ابدأ من هنا  (Get Started)
   #الترحيب           — رسالة ترحيب + روابط مهمة (rules, faq, install)
   #الإعلانات          — تحديثات BOON الرئيسية، إصدارات جديدة
   #القواعد            — قواعد السيرفر
   #الأسئلة-الشائعة      — FAQ مع تعليقات pinned
   #تثبيت-BOON         — شرح خطوة بخطوة لكل target

📦 BOON Core
   #اقتراحات-إضافات    — plugin-requests (مثل Vencord)
   #أخبار-الإضافات     — plugin-news (تحديثات الإضافات)
   #تقارير-الأخطاء     — bug-reports (مرتبط بـ GitHub Issues عبر webhook)
   #المعروفة             — known-issues (pinned messages لكل مشكلة)

🛟 الدعم
   #دعم-BOON          — sticky thread per user model (مثل Vencord)
   #دعم-Vesktop       — لمستخدمي desktop target
   #دعم-الثيمات        — لمستخدمي Studio و الـ Themes

🎨 محتوى المجتمع
   #ثيمات-CSS          — مشاركة ثيمات
   #snippets-JS        — community-made plugins/snippets
   #showcase            — معرض screenshots للمستخدمين

💻 التطوير
   #تطوير-القلب         — core development discussion
   #تطوير-الإضافات      — plugin development
   #PRs                — auto-feed من GitHub
   #commits             — auto-feed من GitHub

💬 دردشة
   #عام                — دردشة عامة (عربي + إنجليزي)
   #off-topic          — خارج الموضوع
   #ميمز               — memes
   #اصدقاء-BOON       — friend-finding (مثل shiggy-and-friends)

🔊 صوتي
   🔊 لاونج عام         — voice chat
   🔊 لاونج تطوير        — for development sessions
   🔊 ميوزك              — paired with MusicPlayer plugin

📬 مودميل
   #modmail            — للتواصل مع admins بخصوصية
```

---

## Bots needed

### 1. BOON Bot (مخصّص)
- **Trigger**: webhook من GitHub releases → يرسل في #الإعلانات تلقائياً
- **Trigger**: webhook من GitHub issues → ينسخ في #تقارير-الأخطاء
- **Slash commands**:
  - `/install` — يعطي رابط التثبيت الصحيح حسب الـ target
  - `/plugin <name>` — معلومات عن plugin
  - `/version` — آخر إصدار
- **Auto-roles**: لما يدخل عضو، يعطيه role @مستخدم
- **Verification**: captcha بسيطة قبل ما يقدر يكتب (مثل Vencord)

### 2. Modmail bot
- Vencord يستخدم modmail bot جاهز — نستخدم نفس الشي
- اقتراح: ModMail (https://modmail.dev)

### 3. Carl-bot / MEE6
- للـ roles عبر reactions
- للـ leveling (اختياري)

---

## Roles structure

```
@admin           — أنا (ali)
@maintainer       — مطوّري BOON الأساسيين
@plugin-dev      — مطوّري plugins community
@moderator        — مودات السيرفر
@helper           — يساعد في الدعم
@VIP             — مساهمين كبار (donate أو contribute)
@member          — كل من يكمل verification
@unverified       — لسّى ما تحقّق
```

اللون الأساسي لكل الـ admin/maintainer roles: **#00FF88** (مطابق لـ BOON brand).

---

## Verification flow

1. عضو جديد ينضم → role @unverified
2. يشوف قناة #الترحيب فقط (read-only)
3. يضغط react على رسالة "قبول القواعد"
4. الـ BOON Bot يعطيه @member
5. يفتح له كل القنوات

---

## مواد الإطلاق

- ✅ سيرفر icon (logo BOON بحجم 512x512 PNG)
- ✅ Banner (1920x480 PNG، مع شعار BOON على خلفية cyber)
- ✅ Invite link permanent مع vanity URL (لو متاح)
- ✅ Pinned message في #الترحيب فيه:
  - شرح BOON
  - أزرار التثبيت لكل target
  - روابط: GitHub, Docs, Twitter (لو فيه)

---

## مقاييس النجاح

نعتبر السيرفر "نشط بشكل صحي" لما:
- +100 عضو في أول أسبوع
- 5-10 رسائل يومياً في #عام
- 2-5 plugin-requests/أسبوع
- أقل من 24 ساعة response time في #دعم-BOON

إذا ما وصلنا للأرقام، نراجع التنظيم وندمج قنوات.

---

## ملاحظات إضافية من Vencord server

- يستخدمون **slowmode** في #الترحيب و #moderator-only (يمنع spam)
- عندهم قناة **#aoc-leaderboard** للـ Advent of Code (موسمي)
- عندهم قنوات صوتية بأسماء غريبة (`yap = explode`, `overwatch gamers`) — جو fun
- استخدامهم لـ thread system في #دعم-Vencord بحيث كل user له thread خاص
- **مهم**: Vencord يطلب عضوية ١٠ دقائق قبل ما تقدر تكتب — نسوّي ٥ دقائق
