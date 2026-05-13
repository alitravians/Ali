# مترجم لغة الإشارة العربية — Arabic Sign Language Translator

تطبيق ويب لترجمة النص العربي إلى لغة الإشارة باستخدام الإيموجي. مبني بـ React + TypeScript + Vite + Tailwind CSS.

> **ملاحظة استرجاع المشروع**
>
> هذا المشروع مُعاد بناؤه من البندل المنشور على
> [`arabic-sign-emoji-app-8y2sacwl.devinapps.com`](https://arabic-sign-emoji-app-8y2sacwl.devinapps.com)
> بعد أن لم نجد السورس الأصلي في أي فرع.
> الـ bundle الأصلي المُجمَّل محفوظ في `recovered/original-bundle.beautified.js` كمرجع.

---

## المميزات الرئيسية

- **المترجم**: نص عربي → إيموجي + تهجئة بالأصابع للكلمات غير المعروفة
- **قاموس شامل**: 331 كلمة وعبارة عربية، 36 حرف للتهجئة، 30 وصف لحركات اليد
- **10 تصنيفات**: التحيات، المشاعر، العائلة، الأرقام، الطعام، الأماكن، الوقت، الأسئلة، الأفعال، العبارات الدينية
- **سجل الترجمات** و **المفضلة** — محفوظة في `localStorage`
- **الوضع الداكن / الفاتح** مع حفظ التفضيل
- **شاشة Splash** احترافية مع progress bar
- **سياسة الخصوصية** قبل الدخول للتطبيق
- **العبارات السريعة** للترجمة الفورية
- **نسخ ومشاركة** الترجمة
- **صفحة التحديثات** (changelog)
- **إحصائيات** عدد الترجمات والكلمات

## التشغيل المحلي

```bash
npm install
npm run dev
```

ثم افتح `http://localhost:5173`.

## البناء للإنتاج

```bash
npm run build
npm run preview   # لمعاينة الإصدار المبني محلياً
```

ملفات الـ production تُولَّد في `dist/`.

## النشر

### Vercel (موصى به)

```bash
npm run build
vercel deploy --prod --yes --token "$VERCEL_TOKEN" ./dist
```

### أي host ثابت

يكفي رفع محتويات مجلد `dist/`.

## هيكل المشروع

```
src/
├── main.tsx                    # نقطة الدخول
├── App.tsx                     # المكون الجذري + إدارة الحالة
├── index.css                   # Tailwind base
├── translator.ts               # محرك الترجمة (نص → إيموجي + تهجئة بالأصابع)
├── storage.ts                  # localStorage helpers (history, favorites, dark mode)
├── components/
│   ├── SplashScreen.tsx        # شاشة التحميل مع progress bar
│   ├── PrivacyAgreement.tsx    # شاشة سياسة الخصوصية
│   ├── TranslationView.tsx     # عرض نتيجة الترجمة + الإجراءات
│   ├── CategoriesPanel.tsx     # لوحة التصنيفات
│   └── HistoryPanel.tsx        # لوحة السجل / المفضلة
└── data/
    ├── dictionary.ts           # 331 كلمة عربية → إيموجي
    ├── alphabet.ts             # 36 حرف عربي → إيموجي للتهجئة
    ├── categories.ts           # 10 تصنيفات
    ├── changelog.ts            # سجل الإصدارات
    ├── handSigns.ts            # وصف 30 حركة يد (أصابع، دوران)
    ├── achievements.ts         # 19 إنجاز
    └── trainingWords.ts        # كلمات وضع التدريب

recovered/
├── original-bundle.beautified.js   # البندل الأصلي المُجمَّل (مرجع فقط)
├── original-index.html             # HTML الأصلي من النشر
└── original-styles.css             # CSS الأصلي من النشر
```

## محرك الترجمة

في `src/translator.ts`:

1. **التطبيع**: إزالة علامات الترقيم وتوحيد المسافات.
2. **مطابقة العبارات**: يحاول أولاً مطابقة عبارة من 2–4 كلمات (مثل "السلام عليكم").
3. **مطابقة الكلمة**: إذا لم يجد عبارة، يبحث عن الكلمة الواحدة في القاموس.
4. **التهجئة بالأصابع**: إذا لم تكن الكلمة في القاموس، يحوّلها حرف-بحرف باستخدام `alphabet.ts`.

## التوسيع

### إضافة كلمة جديدة

افتح `src/data/dictionary.ts` وأضف:

```ts
"كلمة": "🆕",
```

### إضافة تصنيف جديد

افتح `src/data/categories.ts` وأضف عنصر إلى المصفوفة.

### إضافة إصدار للـ changelog

افتح `src/data/changelog.ts` وأضف عنصر إلى أعلى المصفوفة.

## التطبيق على Google Play

التطبيق منشور على Google Play كنسخة Android (غالباً عبر Capacitor wrap على نفس الواجهة). إذا أردت ربط الـ APK بهذا الكود لاحقاً، يمكن إضافة `@capacitor/cli` و `@capacitor/android` ولفّ الـ `dist/` كـ WebView.

## الترخيص

ملكية خاصة — © Ali
