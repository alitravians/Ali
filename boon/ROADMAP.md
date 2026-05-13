# BOON Roadmap

تاريخ آخر تحديث: 2026-05-13.

> هذا الملف يلخّص ما تم وما هو قادم. التواريخ تقريبية وقد تتغيّر حسب الأولويات.

---

## ✅ v0.1.0 — الأساس (الإصدار الحالي)

**النواة (core):**
- TypeScript strict + esbuild + 3 build targets (userscript / extension / desktop)
- Plugin lifecycle (onLoad / onStart / onStop) مع error boundaries
- Effect tracking تلقائي (cleanups مسجّلة عبر `ctx.*`)
- Settings مع persistence في localStorage + validation
- Profiles (snapshots مسمّاة من {enabled, settings})
- Activity log حي (ring buffer 500 entry)
- Stats counters per-plugin
- Toast notifications
- Command palette (Ctrl+K)
- Updater يقرأ GitHub Releases
- Vencord-style sidebar UI (Arabic-first, cyber-green #00FF88)

**Plugin APIs:**
- DataStore (IndexedDB wrapper) — بيانات أكبر من ٥ ميجا أو cache
- ContextMenu (DOM-based) — حقن عناصر في القائمة عند الزر الأيمن
- MessageAccessories — حقن DOM تحت كل رسالة
- ChatButton — زر في صندوق الكتابة

**الإضافات المدمجة:**
- AliThemes — ٥ ثيمات + لون مخصص + radius + CSS
- ServerTools — `..purge`, `..purgefrom`, `..channelinfo`, `..boon`
- AutoTranslate — Google / Gemini (ContextMenu + MessageAccessories + DataStore cache)
- MusicPlayer — مشغّل يوتيوب عائم + ChatButton toggle
- NoNitroAds — إخفاء إعلانات Nitro

---

## 🟡 v0.2.0 — التوسعة (مخطط لها — أسبوعين)

**Plugin APIs جديدة:**
- **MessagePopover API** — أزرار تطفو فوق رسالة عند الـ hover (translate، save، …)
- **Notices API** — شريط إعلان في أعلى Discord للتنبيهات المهمة
- **Badges API** — شارات على بروفايلات المستخدمين
- **TextReplace API** — استبدال نصوص في الرسائل (مثل markdown extensions)
- **Discord REST helpers** — wrapper جاهز لـ Discord User API مع rate limit handling

**ميزات Framework:**
- Plugin dependencies (plugin يقدر يعتمد على plugin ثاني)
- Themes كـ `.theme.css` منفصلة (لا تحتاج كود JS)
- "Test mode" — تفعيل/إيقاف plugin مؤقت للاختبار

**إضافات مدمجة جديدة:**
- **MessageBookmarks** — احفظ رسائل وعرضها في قائمة جانبية
- **ReactionShortcuts** — keyboard shortcuts لإضافة reactions
- **VoiceTimestamps** — وقت انضمام كل عضو للروم الصوتي
- **QuickAFK** — تبديل وضع AFK بضغطة

---

## 🔵 v0.3.0 — البيئة (مخطط — شهر)

**Community Plugins:**
- `registry.json` في الريبو يحوي قائمة الـ community plugins
- تبويب "تصفّح إضافات المجتمع" في BOON
- مراجعة الكود قبل التثبيت + تحذير أمني
- Plugin sandboxing (تشغيل في Worker أو contextisolated)
- Trust levels: verified (مراجَع من Maintainers) / community / experimental

**Themes Library:**
- مكتبة ثيمات مرئية (gallery) داخل BOON
- معاينة حية قبل التطبيق
- مشاركة الثيم برابط

**Discord Server:**
- إنشاء سيرفر BOON الرسمي
- بوت داخلي لـ bug reports + announcements
- قنوات: #showcase, #plugin-requests, #support, #plugin-dev

---

## 🟣 v0.4.0 — Desktop Power (مخطط — شهرين)

**Desktop-only features (تستخدم webpack patches):**
- Patches API — تعديل Discord internals بـ regex patches (مثل Vencord)
- Deep theme customization (CSS variables overrides)
- Better Vencord migration tool (استورد إعدادات Vencord مباشرة)
- BetterDiscord plugin compatibility layer

---

## 🟤 v1.0.0 — الإطلاق العالمي

- Translation للوحات الإعدادات (EN / FR / TR / ES) — العربية تبقى الافتراضية
- وثائق كاملة بالعربية والإنجليزية على الموقع
- نشر extension على Chrome Web Store و Firefox AMO
- نشر userscript على GreasyFork
- BOON Web (موقع مع cdn للـ user.js + documentation)

---

## معايير الترقية بين الإصدارات

| الترقية | متى تحدث |
|---------|---------|
| **patch** (`x.y.Z`) | إصلاح خطأ صغير، تحديث CSS، …لا breaking changes |
| **minor** (`x.Y.0`) | إضافة API جديد، إضافة plugin جديد، …backwards compatible |
| **major** (`X.0.0`) | breaking change في Plugin API أو في settings shape |

---

## أفكار قيد التقييم (لم تُحدّد لإصدار بعد)

- خدمة sync اختيارية (للمستخدمين الذين يريدون مزامنة إعداداتهم بين أجهزة) — لا خادم بل GitHub Gist مع توقيع
- BOON Mobile (لـ Discord في المتصفح على الموبايل عبر Userscript Manager)
- AI Plugin Generator — يصف المستخدم الميزة → AI يولّد plugin template
- Voice Activity Stats — تتبّع تاريخي لاستخدامك للروم الصوتي
- Snippet Library — احفظ markdown snippets لإدخالها بسرعة

---

## كيف تساهم في الـ Roadmap

افتح **Issue** بعنوان `[feature] …` يصف:
- الميزة + لماذا مفيدة
- في أي إصدار يفضّل أن تُدرَج (v0.2 / v0.3 / …)
- هل تريد كتابتها بنفسك أم اقتراح للـ maintainers؟

النقاش يفتح، إذا توافق المجتمع تُضاف للـ Roadmap.
