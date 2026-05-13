# المساهمة في BOON

أهلاً بك أيها المطوّر — BOON قابلة بالكامل للتوسعة من خلال إضافات (plugins) جديدة
كتبها المجتمع. هذا الدليل يشرح كل ما تحتاجه لكتابة plugin وإرساله للمراجعة.

> اللغة الافتراضية لكل واجهات BOON هي **العربية**. أي plugin جديد يجب أن يكون
> labels/description بالعربية. إذا كانت الميزة تخص لغة أخرى يمكنك إضافة
> ترجمة، لكن العربية هي الأساس.

---

## ١. تجهيز بيئة التطوير

```bash
git clone https://github.com/alitravians/Ali.git
cd Ali/boon
npm install
```

أوامر مفيدة:

| الأمر | الفائدة |
|-------|---------|
| `npm run typecheck` | فحص TypeScript (يجب أن ينتهي بصفر أخطاء) |
| `npm run build:userscript` | يولّد `dist/boon.user.js` للتجربة في Tampermonkey |
| `npm run build:extension` | يولّد `dist/extension/` للتجربة في Chrome |
| `npm run build` | يبني كل الـ targets دفعة واحدة |
| `npm run clean` | يحذف مجلد `dist/` |

---

## ٢. هيكلة Plugin جديد

كل plugin مجلد مستقل تحت `src/plugins/<id>/` فيه على الأقل `index.ts`. مثال
كامل لـ plugin يضيف زر "صباح الخير" يطبع رسالة:

```typescript
// src/plugins/morningGreeting/index.ts
import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    greeting: {
        type: "string",
        label: "نص التحية",
        description: "ماذا تريد أن يكتب الأمر؟",
        default: "صباح الخير ☀️",
    },
    enabled: {
        type: "boolean",
        label: "تفعيل",
        default: true,
    },
} as const satisfies SettingsSchema;

export default definePlugin({
    manifest: {
        id: "morningGreeting",
        name: "Morning Greeting",
        description: "أمر بسيط يطبع تحية الصباح.",
        authors: [{ name: "your-name", id: "your-github-username" }],
        version: "0.1.0",
        tags: ["مساعد", "تحية"],
        enabledByDefault: false,
    },
    settings: SCHEMA,
    onStart(ctx) {
        ctx.registerCommand({
            name: "morning",
            description: "أرسل تحية الصباح.",
            execute() {
                if (!ctx.settings.enabled) return;
                ctx.toast(ctx.settings.greeting, "success");
                ctx.stats.bump("greetings_sent");
            },
        });
        ctx.logger.info("ready");
    },
    onStop(ctx) {
        ctx.logger.info("stopped");
    },
});
```

ثم سجّله في `src/core/index.ts`:

```typescript
import morningGreeting from "../plugins/morningGreeting/index.js";

export const BUILT_IN_PLUGINS: ReadonlyArray<AnyPlugin> = [
    aliThemes,
    serverTools,
    autoTranslate,
    musicPlayer,
    noNitroAds,
    morningGreeting,  // ← أضف هنا
];
```

---

## ٣. مراجع Plugin API السريعة

تفاصيل كاملة في [`DEVELOPER.md`](DEVELOPER.md). الواجهة العامة لـ `ctx` تتضمّن:

| الخاصية | الوصف |
|---------|-------|
| `ctx.settings` | كائن typed يقرأ/يكتب إعدادات الـ plugin (يحفظ تلقائياً) |
| `ctx.logger.info / warn / error / debug` | سجّل مع routing تلقائي إلى Activity Log |
| `ctx.stats.bump(key, n=1)` | عدّاد per-plugin يظهر في كرت الإضافة |
| `ctx.stats.touch()` | يحدّث "آخر استخدام" |
| `ctx.injectStyle(css, key)` | يحقن CSS؛ يُحذف تلقائياً عند `onStop` |
| `ctx.registerCommand({ name, args, execute })` | يسجّل أمر `..name`؛ يُلغى تلقائياً عند `onStop` |
| `ctx.on(event, handler)` | اشتراك في BOON events؛ يُلغى تلقائياً عند `onStop` |
| `ctx.toast(message, kind)` | إشعار سريع (`"info" \| "success" \| "warn" \| "error"`) |
| `ctx.manifest` | manifest الإضافة (read-only) |

> كل شيء يسجّله الـ plugin عبر `ctx.*` يُنظَّف تلقائياً عند الإيقاف. لا تحتاج
> إدارة cleanup بنفسك إلا للـ listeners التي تربطها مباشرة على `document`.

---

## ٤. قواعد الجودة المطلوبة لقبول الـ PR

### TypeScript
- مطلوب: `npm run typecheck` بصفر أخطاء.
- ممنوع: `any` صريح (استخدم `unknown` + narrowing).
- استخدم `as const satisfies SettingsSchema` لتعريف schema.

### الأمان
- ممنوع: `eval`, `new Function`, تحميل scripts خارجية في runtime.
- ممنوع: تسجيل أو إرسال **token** المستخدم أو رسائله إلى أي خادم خارجي.
- ممنوع: تعديل webpack الخاص بـ Discord (مسموح فقط في `targets/desktop` بمراجعة خاصة).
- مسموح: استخدام Discord REST API بـ token المستخدم محلياً فقط (مثل `serverTools`).
- إذا كان الـ plugin يرسل بيانات إلى أي API خارجي (Gemini, OpenAI, …)، يجب
  أن يكون ذلك خياراً صريحاً للمستخدم.

### الأداء
- لا تستخدم `MutationObserver` على `document.body` بدون debounce.
- نظّف كل listener/observer في `onStop` (أو سجّله عبر `ctx.injectStyle` /
  `ctx.on` لكي تُنظَّف تلقائياً).
- لا تنفّذ شغل ثقيل في `onLoad` — أجّله إلى `onStart`.

### الواجهة العربية
- كل `label` / `description` / `placeholder` في schema بالعربية.
- لو الـ plugin يضيف عناصر DOM مرئية، استخدم `dir="auto"` حتى يدعم RTL.
- رسائل الـ toast والأخطاء بالعربية.

### الـ Commits
- رسالة الـ commit بالإنجليزية (للحفاظ على سجل git قابل للقراءة).
- العنوان بصيغة `feat(plugin/<id>): short summary` أو `fix(plugin/<id>): …`.

---

## ٥. كيف ترفع Plugin جديد (الـ Workflow)

```
┌──────────────────────────────────────────────────────────────────┐
│  1. Fork repo                                                    │
│     https://github.com/alitravians/Ali                           │
│                                                                  │
│  2. Create branch                                                │
│     git checkout -b plugin/<your-plugin-id>                      │
│                                                                  │
│  3. Code                                                         │
│     - أنشئ src/plugins/<id>/index.ts                              │
│     - سجّله في src/core/index.ts                                  │
│     - npm run typecheck (يجب صفر أخطاء)                          │
│     - npm run build:userscript                                   │
│     - جرّبه محلياً في Tampermonkey                                 │
│                                                                  │
│  4. Commit & push                                                │
│     git add . && git commit -m "feat(plugin/<id>): <ميزة>"        │
│     git push origin plugin/<your-plugin-id>                      │
│                                                                  │
│  5. Open PR                                                      │
│     - الـ template في .github/PULL_REQUEST_TEMPLATE.md            │
│     - أضف فيديو/صورة توضّح الميزة                                 │
│     - أجب عن أسئلة الأمان (هل يستخدم token؟ API خارجي؟)           │
│                                                                  │
│  6. Review                                                       │
│     - مراجعة بشرية للأمان والجودة                                 │
│     - تشغيل محلي للتأكد من عدم وجود مشاكل                          │
│     - قد نطلب تعديلات قبل القبول                                   │
│                                                                  │
│  7. Merge + Release                                              │
│     - merge إلى main                                              │
│     - bump version (npm version minor)                           │
│     - GitHub Release جديد مع تغييراتك                            │
│     - كل مستخدمي BOON يستلمون الإضافة خلال ٢٤ ساعة                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## ٦. أفكار plugins نرحّب بها

- Voice Activity Tracker — تتبّع وقت كل عضو في الروم الصوتي
- Better Embeds — معاينات أحدث للروابط
- Custom Status Saver — احفظ statuses متعددة وتبديلها بسرعة
- ServerStats — عرض إحصائيات السيرفر في badge
- Quick React — Emoji reactions بضغطة واحدة من keyboard
- Read All — زر "اقرأ الكل" في الـ servers list
- Auto-Pin Important — pin تلقائي للرسائل بكلمات معيّنة

---

## ٧. تواصل

- اقتراح ميزة كبيرة قبل بدء العمل؟ افتح **Issue** فيها قبل الـ PR لتجنّب وقت ضائع.
- سؤال تقني عن الـ API؟ اقرأ `DEVELOPER.md` أولاً، ثم افتح **Discussion**.
- وجدت خطأ في BOON نفسها (مش plugin)؟ افتح **Issue** بعنوان `bug: …`.

شكراً لمساهمتك ❤️
