# BOON — دليل المطوّر

هذا الدليل مرجع تقني كامل لكل من يريد:

- فهم بنية BOON الداخلية
- كتابة plugin جديد
- تعديل الـ core / UI
- إضافة build target جديد

> للمساهمة عبر PR: راجع [`CONTRIBUTING.md`](CONTRIBUTING.md) أولاً.

---

## ١. نظرة عامة على المعمارية

```
                        ┌──────────────────────────────┐
                        │     BOON Framework (core)    │
                        │                              │
   ┌──────────┐         │  • pluginManager             │
   │ Plugin A │ ────────│  • settings (localStorage)   │
   ├──────────┤         │  • events (typed bus)        │
   │ Plugin B │ ────────│  • commands (..prefix)       │
   ├──────────┤         │  • commandPalette (Ctrl+K)   │
   │ Plugin C │ ────────│  • activity (live log)       │
   └──────────┘         │  • stats (counters)          │
                        │  • profiles (snapshots)      │
                        │  • updater (GitHub Releases) │
                        │  • ui (sidebar modal)        │
                        └────────────┬─────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                  ┌───────▼────────┐   ┌────────▼────────┐
                  │  userscript    │   │   extension     │
                  │  + extension   │   │   manifest +    │
                  │  share bundle  │   │   content + bg  │
                  └────────────────┘   └─────────────────┘
                          │
                  ┌───────▼────────┐
                  │   desktop      │
                  │  (Vencord rebrand
                  │   + plugins/)  │
                  └────────────────┘
```

### مبادئ التصميم

1. **Plugin = unit of feature.** كل ميزة (ثيمات، ترجمة، …) plugin مستقل.
2. **localStorage = single source of truth.** لا خادم، لا قاعدة بيانات.
3. **Targets share core.** نفس الـ TypeScript يبني ٣ targets مختلفة.
4. **Error boundaries في كل خطوة.** plugin يطيح → BOON تستمر.
5. **No webpack patching في userscript/extension.** DOM observation فقط.
   Webpack patches فقط في desktop target عبر Vencord runtime.
6. **Effect tracking auto-cleanup.** ما يسجّله الـ plugin عبر `ctx.*` يُنظَّف
   تلقائياً عند `onStop` أو الـ crash.

---

## ٢. هيكل المجلدات

```
boon/
├── src/
│   ├── core/
│   │   ├── types.ts            ← Plugin/Settings/Event/Command types
│   │   ├── events.ts           ← Typed event bus (on/emit)
│   │   ├── settings.ts         ← localStorage state + bindSettings proxy
│   │   ├── activity.ts         ← Live activity ring buffer (max 500)
│   │   ├── stats.ts            ← Per-plugin counters + lastUsedAt
│   │   ├── profiles.ts         ← Named snapshots of {enabled, settings}
│   │   ├── updater.ts          ← GitHub Releases API + changelog parser
│   │   ├── logger.ts           ← Console + forward to activity
│   │   ├── commands.ts         ← ..command interceptor in composer
│   │   ├── commandPalette.ts   ← Ctrl+K palette
│   │   ├── discord.ts          ← DOM-level helpers (channel id, send, …)
│   │   ├── pluginManager.ts    ← register/start/stop with error boundaries
│   │   ├── styles.ts           ← Style injection utilities
│   │   ├── toast.ts            ← Toast notifications
│   │   ├── ui.ts               ← Settings modal (sidebar layout)
│   │   └── index.ts            ← Entry: register built-ins, init UI
│   ├── plugins/
│   │   ├── aliThemes/          ← Theme presets + color picker + custom CSS
│   │   ├── serverTools/        ← ..purge / ..purgefrom / ..channelinfo / ..boon
│   │   ├── autoTranslate/      ← Right-click translate (Google/Gemini)
│   │   ├── musicPlayer/        ← Floating YouTube player
│   │   └── noNitroAds/         ← CSS hiding Nitro upsell
│   ├── targets/
│   │   ├── userscript/         ← Tampermonkey banner + entry
│   │   ├── extension/          ← MV3 manifest + content + background + popup
│   │   └── desktop/            ← rebrand.mjs + README for Vencord injection
│   └── shared/                 ← (reserved for cross-cutting utilities)
├── scripts/
│   └── build.mjs               ← esbuild orchestrator (3 targets)
├── dist/                       ← Output (gitignored)
├── DESIGN.md                   ← Visual + UX design notes
├── ROADMAP.md                  ← Planned features (v0.2+)
├── CONTRIBUTING.md             ← How to submit a plugin PR
├── DEVELOPER.md                ← هذا الملف
├── README.md                   ← User-facing intro + installation
├── package.json
└── tsconfig.json
```

---

## ٣. Plugin API كاملة

### تعريف Plugin

```typescript
import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    /* schema here */
} as const satisfies SettingsSchema;

export default definePlugin({
    manifest: {
        id: "uniqueId",                    // مطلوب: معرّف فريد (camelCase)
        name: "Display Name",              // مطلوب: اسم يظهر في UI
        description: "وصف بالعربية.",      // مطلوب: وصف قصير
        authors: [{ name: "you" }],        // مطلوب: قائمة المؤلفين
        version: "0.1.0",                  // مطلوب: semver
        tags: ["تصنيف1", "تصنيف2"],        // اختياري: للفلترة
        enabledByDefault: false,           // افتراضي false
        required: false,                   // افتراضي false (true = لا يمكن تعطيله)
    },
    settings: SCHEMA,
    onLoad(ctx) {
        // قبل ما يفعّل المستخدم البلجن — نادراً ما تحتاجها
    },
    onStart(ctx) {
        // عند التفعيل — هنا تسجّل listeners وأوامر وstyles
    },
    onStop(ctx) {
        // عند الإيقاف — تنظيف يدوي إن لزم
    },
});
```

### أنواع الإعدادات (SettingsSchema)

```typescript
const SCHEMA = {
    // boolean → switch
    autoEnable: {
        type: "boolean",
        label: "تفعيل تلقائي",
        description: "وصف اختياري يظهر تحت الـ label",
        default: false,
    },
    // number → input type=number
    maxItems: {
        type: "number",
        label: "الحد الأقصى",
        default: 10,
        min: 1,
        max: 100,
        step: 1,  // اختياري
    },
    // string → input type=text
    customText: {
        type: "string",
        label: "نص",
        default: "",
        placeholder: "اكتب هنا…",
    },
    // textarea → multi-line text
    customCss: {
        type: "textarea",
        label: "CSS مخصص",
        default: "",
        placeholder: "/* اكتب CSS هنا */",
    },
    // color → input type=color
    accent: {
        type: "color",
        label: "اللون",
        default: "#00ff88",
    },
    // select → dropdown
    mode: {
        type: "select",
        label: "الوضع",
        default: "auto",
        options: [
            { label: "تلقائي", value: "auto" },
            { label: "يدوي", value: "manual" },
        ],
    },
} as const satisfies SettingsSchema;
```

> ضع `as const satisfies SettingsSchema` دائماً — TypeScript يستنتج
> القيم الصحيحة (مثلاً `mode: "auto" | "manual"` بدل `string`).

### PluginContext API

```typescript
interface PluginContext<S extends SettingsSchema> {
    readonly manifest: PluginManifest;
    readonly settings: SettingsValues<S>;        // proxy: read/write مع validation
    readonly logger: BoonLogger;                  // info/warn/error/debug
    readonly stats: PluginStats;                  // bump/touch/get
    readonly dataStore: PluginDataStore;          // IndexedDB key/value
    readonly contextMenu: ContextMenuApi;         // حقن في الزر الأيمن
    readonly messageAccessories: MessageAccessoriesApi; // حقن تحت الرسائل
    readonly chatButton: ChatButtonApi;           // أزرار في صندوق الكتابة
    on<E extends keyof BoonEventMap>(event: E, handler: (p: BoonEventMap[E]) => void): () => void;
    injectStyle(css: string, key?: string): () => void;
    registerCommand(cmd: BoonCommand): () => void;
    toast(message: string, kind?: ToastKind): void;
}
```

#### `ctx.settings`

```typescript
// قراءة
const enabled = ctx.settings.autoEnable;  // typed: boolean

// كتابة (تحفظ تلقائياً + تطلق "settings:changed")
ctx.settings.maxItems = 20;
```

#### `ctx.logger`

```typescript
ctx.logger.info("started");
ctx.logger.warn("missing config", obj);
ctx.logger.error("failed", err);
ctx.logger.debug("detailed trace");  // يظهر فقط إذا BOON debug mode مفعّل
```
كل log يُرسَل أيضاً إلى Activity Log الحي في UI.

#### `ctx.stats`

```typescript
ctx.stats.bump("translated", 1);   // counter ++ بقيمة 1
ctx.stats.bump("api_calls");       // افتراضي 1
ctx.stats.touch();                  // يحدّث lastUsedAt
const all = ctx.stats.get();        // { counters: {...}, lastUsedAt: ... }
```
يظهر تحت كرت الـ plugin في UI: "24 messages translated • آخر استخدام: قبل دقيقة".

#### `ctx.on`

```typescript
const off = ctx.on("settings:changed", ({ pluginId, key, value }) => {
    if (pluginId === ctx.manifest.id) {
        // أعد التطبيق…
    }
});
// off() لإلغاء الاشتراك يدوياً (أو يُلغى تلقائياً عند onStop)
```

أحداث BOON:

| الحدث | الـ Payload |
|-------|------------|
| `plugin:enabled` | `{ pluginId }` |
| `plugin:disabled` | `{ pluginId }` |
| `plugin:crashed` | `{ pluginId, error }` |
| `settings:changed` | `{ pluginId, key, value }` |
| `profile:switched` | `{ profileId }` |
| `activity:appended` | `{ entry }` |

#### `ctx.injectStyle`

```typescript
ctx.injectStyle(`body { background: red; }`, "main");
// يحقن <style> ويعيد دالة remove
// يُحذف تلقائياً عند onStop
```

#### `ctx.registerCommand`

```typescript
ctx.registerCommand({
    name: "hello",
    description: "يطبع تحية.",
    args: [{ name: "name", required: false }],
    async execute([name], raw) {
        ctx.toast(`أهلاً ${name || "صديق"}`, "info");
    },
});
// المستخدم يكتب: ..hello علي → ينفذ ولا يُرسل كرسالة
```

#### `ctx.toast`

```typescript
ctx.toast("تم بنجاح", "success");
ctx.toast("تحذير", "warn");
ctx.toast("خطأ ما", "error");
ctx.toast("معلومة", "info");
```

#### `ctx.dataStore` — تخزين IndexedDB لكل plugin

استخدم هذا للبيانات اللي **مش** إعدادات (الإعدادات في localStorage عبر
`ctx.settings`). مفيد للـ caches، playlists، تواريخ، …

```typescript
// كل plugin له namespace خاص — لا تعارض مع plugins ثانية
await ctx.dataStore.set("lastSync", Date.now());
const last = await ctx.dataStore.get<number>("lastSync");

await ctx.dataStore.set("translations:hello", { ar: "مرحبا" });
const cached = await ctx.dataStore.get<{ ar: string }>("translations:hello");

await ctx.dataStore.delete("lastSync");
const allKeys = await ctx.dataStore.keys();
await ctx.dataStore.clear();
```

#### `ctx.contextMenu` — حقن في قائمة الزر الأيمن

```typescript
ctx.contextMenu.patch("message", (m, addItem) => {
    if (!m.messageId) return;
    addItem({
        id: "myPlugin:save",
        label: "احفظ الرسالة",
        icon: "💾",
        async onClick() {
            await ctx.dataStore.set(`saved:${m.messageId}`, true);
            ctx.toast("تم الحفظ", "success");
        },
    });
});

// kinds: "message" | "user" | "channel" | "guild" | "any"
```
يُلغى تلقائياً عند `onStop`.

#### `ctx.messageAccessories` — حقن تحت كل رسالة

```typescript
ctx.messageAccessories.add("myPlugin:tag", info => {
    if (!info.content.includes("@boon")) return null;
    const tag = document.createElement("div");
    tag.textContent = "✨ تمّت إشارتك في BOON";
    tag.style.cssText = "padding:4px 8px;background:rgba(0,255,136,0.1);border-radius:4px;";
    return tag;
});
```
يُحذف تلقائياً عند `onStop`.

#### `ctx.chatButton` — زر في صندوق الكتابة

```typescript
ctx.chatButton.add({
    id: "myPlugin:toggle",
    label: "BOON: ميزتي",
    icon: "⚡",
    onClick() {
        // افتح modal، أرسل أمر، …
    },
});
```
يُحذف تلقائياً عند `onStop`.

---

## ٤. Lifecycle تفصيلياً

```
┌────────────────────────────────────────────────────────────────┐
│  pluginManager.registerAll([plugin1, plugin2, …])              │
│                                                                │
│  لكل plugin:                                                    │
│    1. ابني ctx (logger + stats + settings proxy + …)            │
│    2. استدع onLoad(ctx)  ← في try/catch (لا يفشل البقية)         │
│    3. إذا enabled في state:                                     │
│         استدع onStart(ctx)  ← في try/catch                       │
│         إذا فشل: ضع entry.crashed = true                         │
│           نظّف كل cleanups المسجّلة                              │
│           ابقى disabled لباقي الجلسة                              │
│                                                                │
│  عند setEnabled(id, false):                                    │
│    1. استدع onStop(ctx)  ← في try/catch                          │
│    2. نفّذ كل cleanups (styles, listeners, commands)             │
│    3. set enabled=false في localStorage                         │
└────────────────────────────────────────────────────────────────┘
```

---

## ٥. UI / Settings Modal

`src/core/ui.ts` فيها كل تخطيط النافذة. الـ NAV array يحدّد الأقسام:

```typescript
const NAV = [
    { id: "home",      label: "BOON" },
    { id: "plugins",   label: "الإضافات" },
    { id: "themes",    label: "الثيمات" },
    { id: "updater",   label: "التحديثات" },
    { id: "profiles",  label: "الملفات الشخصية" },
    { id: "activity",  label: "السجل المباشر" },
    { id: "backup",    label: "نسخ احتياطي" },
];
```

لكل قسم دالة `renderXxx(main)` تنشئ DOM.

### كيف تضيف قسماً جديداً

1. أضف `{ id: "newSection", label: "..." }` في `NAV`.
2. أضف `case "newSection": renderNewSection(main); return;` في `render()`.
3. نفّذ `renderNewSection(main: HTMLElement): void`.

### اختصارات المفاتيح
- `Ctrl+Shift+B` / `Cmd+Shift+B` → فتح/إغلاق BOON
- `Ctrl+K` / `Cmd+K` → فتح Command Palette
- `Escape` → إغلاق المفتوح

---

## ٦. Build Targets

`scripts/build.mjs` يستخدم esbuild لإنتاج ٣ ملفات:

| Target | Output | Notes |
|--------|--------|-------|
| `userscript` | `dist/boon.user.js` | IIFE bundle + Tampermonkey banner |
| `extension` | `dist/extension/*` | content.js + background.js + manifest + popup |
| `desktop` | `dist/desktop/*` | rebrand.mjs + README (يطبَّق يدوياً على Vencord) |

```bash
npm run build              # كل الـ targets
npm run build:userscript   # فقط userscript
npm run build:extension    # فقط extension
npm run build:desktop      # فقط desktop (نسخ ملفات rebrand)
```

### إضافة Target جديد

1. أنشئ مجلد `src/targets/<name>/` فيه entry `.ts`.
2. أضف case في `scripts/build.mjs`.
3. حدّث `README.md` و `package.json` scripts.

---

## ٧. Discord DOM Helpers

`src/core/discord.ts` يعرّض:

| الدالة | الفائدة |
|--------|---------|
| `getCurrentChannelId()` | يقرأ معرّف القناة من URL |
| `getCurrentGuildId()` | يقرأ معرّف السيرفر من URL |
| `sendMessage(text)` | يطبع نص في صندوق الكتابة ويرسله |
| `observeMessages(cb)` | يستدعي `cb` لكل رسالة جديدة |
| `extractMessageInfo(el)` | يستخرج id/content/author من رسالة DOM |
| `installComposerInterceptor(handler)` | يلتقط `..commands` قبل الإرسال |

هذه helpers تعتمد على selectors الـ DOM، لذا قد تحتاج تحديثاً لما Discord
يغيّر بنية HTML (نتعامل مع هذا في الـ patches).

---

## ٨. Settings persistence (localStorage shape)

```jsonc
// localStorage key: BOON:state
{
  "version": 1,
  "enabled": {
    "aliThemes": true,
    "serverTools": true,
    "autoTranslate": true,
    "musicPlayer": true,
    "noNitroAds": true
  },
  "settings": {
    "aliThemes": {
      "preset": "cyber",
      "accent": "#00ff88",
      "radius": 6,
      "compact": false,
      "customCss": ""
    }
    // ...
  },
  "activeProfile": "default",
  "profiles": {
    "default": { "name": "افتراضي", "enabled": {...}, "settings": {...} }
  }
}
```

---

## ٩. أخطاء شائعة وحلولها

| الخطأ | الحل |
|-------|------|
| `Type 'literal' is not assignable to type ...` في schema | استخدم `as const satisfies SettingsSchema` |
| الـ plugin لا يظهر في UI | أضفته في `BUILT_IN_PLUGINS` array؟ |
| Settings تتعطّل عشوائياً | تأكّد أن مفاتيح schema لا تتعارض بين plugins (BOON يفصلها تلقائياً لكن انتبه) |
| `ctx is not defined` في scope | اقرأ `ctx` فقط داخل `onStart`/`onStop`/event handlers — ليس على top-level |
| المستخدم لا يرى التحديث | Tampermonkey يفحص كل ٢٤ ساعة. "تحقّق الآن" يجبر الفحص فوراً |

---

## ١٠. الترخيص

BOON تحت **GPL-3.0-or-later**. أي plugin تُضيفه عبر PR يجب أن يكون متوافقاً
(GPL-compatible). الـ desktop target يستخدم Vencord (نفس الترخيص) — راجع
[`src/targets/desktop/LICENSE-NOTICE.md`](src/targets/desktop/LICENSE-NOTICE.md).
