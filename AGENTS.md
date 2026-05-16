# AGENTS.md — خريطة الريبو لـ Devin/Claude/الوكلاء البرمجيين

> هذا الملف هو **النقطة الأولى** اللي لازم أي عميل برمجي يقرأها بعد ما يفتح الريبو.
> يتبع معيار [AGENTS.md](https://agents.md) ويُلتقَط أوتوماتيكياً من Devin و Claude Code.

## ما هذا المشروع؟

**alitravians** — إطار تعديل لـ Discord Desktop (مماثل لـ Vencord/BetterDiscord)،
مكتوب بـ TypeScript مع مُثبِّت بـ Go. الواجهة بالعربية حصراً.

كود المصدر: `boon/` (اسم تاريخي محفوظ في الـ tag prefix `boon-v*` للتوافق
مع المُثبِّتات القديمة، اسم العرض هو "alitravians").

## بنية المجلدات

```
.
├── boon/                              # ← مصدر الأداة (TS): plugins + renderer + patcher
│   ├── src/
│   │   ├── plugins/                   # plugins (autoTranslate, typingIndicator, ...)
│   │   ├── core/                      # API الأساسي + webpack patcher + ipc
│   │   ├── ui/                        # واجهات (Updates modal, settings card, ...)
│   │   ├── patcher.ts                 # Electron main-process patcher (IPC + CSP bypass)
│   │   └── renderer.ts                # renderer entry point (يحمّل plugins + UI)
│   ├── scripts/build.mjs              # esbuild script يبني 3 targets
│   ├── dist/                          # مخرجات البناء (مُتجاهَلة بـ .gitignore)
│   └── package.json
│
├── boon-installer/                    # ← المُثبِّت بـ Go (GUI، windows/mac/linux)
│   ├── main.go
│   ├── runtime/                       # patcher.js + renderer.js مضمّنة عند build
│   └── assets/
│
└── .github/workflows/
    └── boon-release.yml               # يبني الكل + يرفع لـ GitHub Release عند tag `boon-v*`
```

## الفروع

- **`alitravians-tool`** (هذا الفرع) — البيت الدائم لكل شغل الأداة. كل PRs الأداة تستهدفه.
- **`arabic-localization`** — الفرع الافتراضي للريبو، يحوي مشاريع ثانية (CompetitionsBot,
  war-tracker, chat-platform, إلخ) **غير ذات صلة بالأداة**. تجاهله إذا تشتغل على alitravians.

> الـ default branch على GitHub يبقى `arabic-localization` عمداً، لأن الريبو يحوي
> مشاريع متعددة. لما تشتغل على الأداة، اطلب من المستخدم الفرع `alitravians-tool` صراحة
> أو ابدأ بـ `git checkout alitravians-tool`.

## كيف تُصدِر نسخة جديدة

```bash
# 1) افتح PR إلى alitravians-tool ودَع المستخدم يُدمج.
# 2) حدّث boon/package.json -> version
# 3) ادفع tag (يفضّل على commit الـ merge على الفرع):
git tag boon-v<X.Y.Z> <merge-sha>
git push origin boon-v<X.Y.Z>
# 4) workflow boon-release.yml يبني patcher.js + renderer.js + 4 مُثبِّتات
#    ويرفع GitHub Release خلال ~5 دقائق.
# 5) المستخدم يضغط "التحقق من التحديثات" داخل Discord — patcher.js + renderer.js
#    يتحدّثان مباشرة من الـ Release بدون تنزيل .exe جديد.
```

## أوامر مهمة محلياً

```bash
cd boon
npm install          # المرة الأولى فقط
npm run typecheck    # **مطلوب صفر أخطاء قبل أي PR**
npm run build        # ينتج dist/desktop/{patcher,renderer}.js + dist/boon.user.js
npm run lint         # ESLint (إن وُجد)
```

## مفاهيم لازم تعرفها قبل ما تعدّل

| المصطلح              | المعنى |
| -------------------- | ------ |
| **patcher.js**       | يعمل في Electron main process. يفتح IPC للـ renderer ليتجاوز CSP (مثلاً للوصول لـ Google Translate أو GitHub API). يحدّث نفسه ذاتياً عند الترقية. |
| **renderer.js**      | يعمل في renderer process. يحمّل plugins والـ UI، يُحقَن عبر stub في `app.asar`. |
| **IPC bridge**       | الجسر بين renderer و main. كل fetch لخوادم خارجية لازم يمر عبره (CSP). |
| **Webpack patcher**  | يستخدم `core/webpack/` للوصول لمتاجر Discord الداخلية (UserStore, MessageStore, إلخ). |
| **Plugin system**    | كل plugin له `id`, `meta`, `settings`, `init(ctx)`. الـ `ctx` يوفر toast, logger, registerListener, registerStyle لتنظيف تلقائي. |
| **Self-update**      | renderer/patcher يتحدّثان عبر IPC من GitHub Releases مباشرة. المُثبِّت `.exe` لا يحتاج تنزيله مع كل نسخة. |

## قواعد البرمجة الأساسية

- **لا `any`**. TypeScript strict.
- **لا fake claims**. لو ميزة ما تشتغل، قُل ذلك. ممنوع "الأمور الوهمية".
- **اختبر محلياً** على Discord Desktop قبل ما تفتح PR.
- **labels/toasts بالعربية**.
- **commit message**: `feat(plugin/<id>): …` أو `fix(plugin/<id>): …` أو
  `feat(boon): …` للـ core.
- **`ctx.*` لكل listener/style** ليُنظَّف تلقائياً عند تعطيل الـ plugin.
- **لا `eval` ولا `new Function`** (راجع `.github/PULL_REQUEST_TEMPLATE.md` للقائمة الأمنية الكاملة).

## CI / تأكيد قبل الـ PR

```bash
cd boon
npm run typecheck && npm run build
```

كلاهما لازم يكمل بصفر أخطاء.

## جهات الاتصال

- المالك: ali travians (`botbotgroup@gmail.com`)
- آخر release: https://github.com/alitravians/Ali/releases/latest
- الإصدار الحالي في `boon/package.json` (مصدر الحقيقة لرقم النسخة). آخر tag منشور هو
  `boon-v<X.Y.Z>` المطابق له، ويمكن قراءته من
  https://github.com/alitravians/Ali/releases/latest. تجنّب تثبيت رقم نسخة محدد هنا
  لأنه سيتقادم مع كل إصدار جديد.
