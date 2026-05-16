# alitravians

أداة تعديل عميل Discord (Discord Client Modification Framework) مكتوبة بـ TypeScript مع
مُثبِّت Go لويندوز/ماك/لينكس. تشتغل على Discord Desktop (Stable و PTB و Canary) عبر
patch لـ `app.asar` بـ stub loader يحمّل runtime من القرص ويربطه بنظام تحديث ذاتي
عبر GitHub Releases — بدون الحاجة لإعادة تنزيل المُثبِّت في كل إصدار جديد.

> الواجهة كلها بالعربية. الألوان: أخضر سايبر `#00ff88` على خلفية داكنة `#0a0e1a`.

## بنية المستودع

| المجلد              | الوصف                                                     |
| -------------------- | --------------------------------------------------------- |
| `boon/`              | الكود المصدري للأداة (TypeScript). plugins + renderer + patcher. |
| `boon-installer/`    | المُثبِّت بـ Go — GUI ويندوز/ماك/لينكس يُضمِّن `patcher.js` + `renderer.js`. |
| `.github/workflows/` | `boon-release.yml` — يبني المُثبِّت + runtime ويرفع الـ assets عند دفع tag `boon-v*`. |

## الفروع

- **`alitravians-tool`** — الفرع المخصص لتطوير الأداة (هذا الفرع). كل PRs الأداة تستهدفه.
- **`arabic-localization`** — الفرع الافتراضي للريبو، يحوي مشاريع ثانية (بوتات، dashboards، إلخ) غير ذات صلة بالأداة.

## دورة الإصدار

1. شغل التعديلات على فرع feature → افتح PR إلى `alitravians-tool`.
2. لمّا يُدمج، حدّث `boon/package.json` `version` وادفع tag `boon-v<X.Y.Z>`.
3. workflow `boon-release.yml` يبني `patcher.js` و`renderer.js` و4 مُثبِّتات
   (windows-amd64.exe, linux-amd64, macos-amd64, macos-arm64) ويصدر GitHub Release.
4. المستخدم يحصل على التحديث من داخل Discord عبر زر **"التحقق من التحديثات"** في
   إعدادات alitravians — يُحدَّث `renderer.js` و`patcher.js` مباشرة من الـ Release،
   بدون تنزيل `.exe` جديد.

## التطوير محلياً

```bash
cd boon
npm install
npm run typecheck      # صفر أخطاء قبل الـ PR
npm run build          # ينتج dist/desktop/{patcher,renderer}.js + dist/boon.user.js
```

تركيب المُثبِّت يدوياً للاختبار:

```bash
cd boon-installer
go build -o alitravians-installer .
./alitravians-installer
```

## رابط آخر إصدار

https://github.com/alitravians/Ali/releases/latest

## الترخيص

GPL-3.0-or-later
