# BOON

**Discord Client Modification Framework** — by ali travians.

BOON adds features to Discord through a single plugin system that ships in three
flavors:

| Target | What it is | Discord version |
|--------|------------|-----------------|
| **Userscript** | A `.user.js` file you install in Tampermonkey/Violentmonkey | Discord Web (discord.com) |
| **Browser Extension** | Chrome/Firefox MV3 unpacked extension | Discord Web (discord.com) |
| **Desktop Mod** | Built on top of Vencord's Electron injector, fully rebranded as BOON | Discord Desktop (Windows/macOS/Linux) |

All three targets share the same plugins — write once, run anywhere.

---

## الميزات المدمجة

تأتي BOON بخمس إضافات جاهزة:

| الإضافة | الوصف |
|---------|-------|
| **AliThemes** | ثيمات جاهزة (Midnight / Sunset / Ocean / Cyber / Sand) + لون مخصص + زوايا قابلة للضبط + CSS مخصص |
| **ServerTools** | أوامر مودريشن: `..purge` لحذف رسائلك، `..purgefrom` لحذف رسائل مستخدم، `..channelinfo` لمعلومات القناة |
| **AutoTranslate** | ترجمة بالنقر بالزر الأيمن. خياران: Google Translate المجاني، أو Gemini AI |
| **MusicPlayer** | مشغّل يوتيوب عائم داخل Discord. اسحبه، صغّره، احفظ موقعه |
| **NoNitroAds** | إخفاء إعلانات Nitro: زر الهدية، تبويب Nitro، نوافذ الترقية، Stickers المدفوعة |

افتح إعدادات BOON بالضغط على **`Ctrl+Shift+B`** (أو `Cmd+Shift+B` على macOS).

---

## التثبيت

### 1. كـ Userscript (الأسرع)

ثبّت [Tampermonkey](https://www.tampermonkey.net/) أو [Violentmonkey](https://violentmonkey.github.io/) في متصفحك، ثم:

```bash
cd boon
pnpm install   # أو npm install
pnpm run build:userscript
```

ينتج ملف `dist/boon.user.js` — افتحه في متصفحك ليقوم Tampermonkey بتثبيته. تلقائياً يعمل على `https://discord.com/*`.

### 2. كـ Browser Extension

```bash
pnpm run build:extension
```

ينتج مجلد `dist/extension/`. في Chrome: `chrome://extensions` → "Load unpacked" → اختر المجلد.

### 3. كـ Desktop Client Mod (BOON الكامل)

راجع [`src/targets/desktop/README.md`](src/targets/desktop/README.md) للتعليمات الكاملة.

التلخيص:
1. كلون Vencord
2. شغّل `node boon/src/targets/desktop/rebrand.mjs ./Vencord` لتطبيق علامة BOON
3. انسخ `boon/src/plugins/*` إلى `Vencord/src/userplugins/`
4. `pnpm install && pnpm build && pnpm inject`

النتيجة: في إعدادات Discord سترى:

```
BOON Settings
├─ BOON
├─ Plugins
├─ Themes
├─ Updater
├─ Cloud
├─ Backup & Restore
└─ Startup Timings
```

---

## الأوامر

البادئة الافتراضية للأوامر هي `..` (نقطتين). اكتب الأمر في صندوق الرسائل واضغط Enter — يتم تنفيذه محلياً ولا يُرسل كرسالة.

| الأمر | الإضافة | المثال |
|-------|---------|--------|
| `..purge <عدد>` | ServerTools | `..purge 20` يحذف آخر 20 من رسائلك |
| `..purgefrom <userId> <عدد>` | ServerTools | يحذف رسائل مستخدم معيّن |
| `..channelinfo` | ServerTools | يطبع معلومات القناة |
| `..tr <نص>` | AutoTranslate | `..tr Hello world` |
| `..play <استعلام>` | MusicPlayer | `..play despacito` |
| `..music` | MusicPlayer | يفتح/يغلق نافذة المشغّل |
| `..boon` | Core | يفتح لوحة إعدادات BOON |

---

## بنية المشروع

```
boon/
├── src/
│   ├── core/                Plugin API, lifecycle, settings, logger, UI
│   ├── plugins/             الإضافات الخمس (كل واحدة في مجلد منفصل)
│   ├── targets/
│   │   ├── userscript/      نقطة دخول Tampermonkey
│   │   ├── extension/       Chrome MV3 manifest + content script
│   │   └── desktop/         تعليمات + سكريبت rebrand لـ Vencord
│   └── shared/              utilities (placeholder)
├── scripts/build.mjs        esbuild orchestrator
├── dist/                    artifacts بعد البناء
└── package.json
```

---

## كتابة Plugin جديد

```typescript
import { definePlugin } from "@core/types";

export default definePlugin({
    manifest: {
        id: "myPlugin",
        name: "My Plugin",
        description: "وصف قصير.",
        authors: [{ name: "you" }],
        version: "0.1.0",
        tags: ["مثال"],
    },
    settings: {
        greeting: {
            type: "string",
            label: "تحية",
            default: "السلام عليكم",
        },
    },
    onStart(ctx) {
        ctx.logger.info("started");
        ctx.injectStyle(`body { outline: 1px solid red; }`);
        ctx.registerCommand({
            name: "hi",
            description: "يرسل تحية",
            execute() {
                ctx.toast(ctx.settings.greeting, "info");
            },
        });
    },
    onStop(ctx) {
        ctx.logger.info("stopped");
    },
});
```

ثم سجّله في `src/core/index.ts` ضمن مصفوفة `BUILT_IN_PLUGINS`.

> للمرجع الكامل لـ Plugin API (DataStore / ContextMenu / MessageAccessories /
> ChatButton / Settings / Lifecycle) راجع <ref_file file="DEVELOPER.md" />.

---

## للمساهمين

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — دليل المساهمة وآلية فتح PR لإضافة plugin جديد.
- **[DEVELOPER.md](DEVELOPER.md)** — مرجع Plugin API كامل (typed، أمثلة، أنماط).
- **[docs/DISCORD_API_NOTES.md](docs/DISCORD_API_NOTES.md)** — مرجع Discord REST endpoints لمطوّري الـ plugins.
- **[ROADMAP.md](ROADMAP.md)** — الميزات القادمة في v0.2 و v0.3 وما بعد.
- **[DESIGN.md](DESIGN.md)** — قرارات التصميم والمعمارية.

---

## التحذير القانوني / ⚠️

استخدام أي تعديل على عميل Discord (BOON, Vencord, BetterDiscord) **مخالف
لشروط خدمة Discord**. عملياً Discord لا يحظر المستخدمين بسبب هذا، لكن المخاطرة
موجودة. يُنصح بشدّة باستخدام BOON على حساب ثانوي للاختبار.

---

## الترخيص

GPL-3.0-or-later. مبنية على [Vencord](https://github.com/Vendicated/Vencord)
في نهج Desktop target مع الالتزام الكامل بشروط GPL — انظر
[`src/targets/desktop/LICENSE-NOTICE.md`](src/targets/desktop/LICENSE-NOTICE.md).
