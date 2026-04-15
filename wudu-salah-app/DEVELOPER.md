# تعلم الوضوء والصلاة - دليل المطورين
# Learn Wudu & Salah - Developer Guide

## نظرة عامة / Overview

تطبيق تعليمي إسلامي لتعليم الوضوء والصلاة، يدعم وضعين: وضع الكبار (نصوص تفصيلية) ووضع الأطفال (نصوص مبسطة قابلة للضغط مع صوت عربي).

An Islamic educational app for teaching Wudu (ablution) and Salah (prayer). Supports two modes: Adults (detailed text) and Children (simplified tappable text with Arabic TTS audio).

- **Package ID:** `com.wudusalah.app`
- **App Name:** تعلم الوضوء والصلاة
- **Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Capacitor (Android)
- **TTS Backend:** FastAPI proxy on Fly.io

---

## المتطلبات / Prerequisites

- **Node.js** v18+ (with npm)
- **Java JDK 21** (for Android builds)
- **Android SDK** (via Android Studio or command line tools)
- **Python 3.10+** + Poetry (for TTS proxy backend, optional)

---

## التثبيت والتشغيل / Setup & Run

### 1. تثبيت التبعيات / Install Dependencies

```bash
npm install
```

### 2. تشغيل بيئة التطوير / Run Dev Server

```bash
npm run dev
```

يفتح على `http://localhost:5173/` (أو أول بورت متاح).

> **ملاحظة:** الصوت (TTS) في المتصفح يستخدم Web Speech API. الصوت الكامل عبر proxy يعمل فقط على أندرويد.

### 3. بناء المشروع / Build

```bash
npm run build
```

ينتج ملفات الإنتاج في مجلد `dist/`.

### 4. بناء APK (أندرويد) / Build Android APK

```bash
npm run build-apk
```

ملف APK يكون في: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. بناء AAB (للرفع على Google Play) / Build AAB

```bash
npm run build-aab
```

ملف AAB يكون في: `android/app/build/outputs/bundle/release/app-release.aab`

> **مهم:** AAB موقّع بـ keystore. الـ keystore (`wudu-release-key.jks`) غير مرفوع على الريبو لأسباب أمنية. انظر قسم "التوقيع" أدناه.

---

## هيكل المشروع / Project Structure

```
wudu-salah-app/
├── src/                          # كود React الأساسي
│   ├── App.tsx                   # Routes الرئيسية
│   ├── main.tsx                  # نقطة البداية + WelcomePage + LoadingScreen
│   ├── index.css                 # أنماط Tailwind الأساسية
│   ├── components/               # المكونات المشتركة
│   │   ├── Layout.tsx            # التخطيط العام (Header + BottomNav + ThemeContext)
│   │   ├── Header.tsx            # الشريط العلوي
│   │   ├── BottomNav.tsx         # شريط التنقل السفلي
│   │   ├── LoadingScreen.tsx     # شاشة التحميل (0-100%)
│   │   ├── TappableText.tsx      # نص قابل للضغط - يشغل صوت عند الضغط (وضع الأطفال)
│   │   ├── InfoCard.tsx          # بطاقة معلومات
│   │   ├── StepCard.tsx          # بطاقة خطوة (مرقمة)
│   │   ├── SectionCard.tsx       # بطاقة قسم
│   │   ├── SubSectionCard.tsx    # بطاقة قسم فرعي
│   │   ├── MistakeCard.tsx       # بطاقة خطأ شائع
│   │   └── SpeakButton.tsx       # زر صوت (قديم - تم استبداله بـ TappableText)
│   ├── pages/                    # صفحات التطبيق
│   │   ├── HomePage.tsx          # الصفحة الرئيسية
│   │   ├── WelcomePage.tsx       # صفحة الترحيب (تظهر مرة واحدة)
│   │   ├── ChildrenPage.tsx      # وضع الأطفال
│   │   ├── AdultsPage.tsx        # وضع الكبار
│   │   ├── WuduIntroPage.tsx     # مقدمة الوضوء
│   │   ├── WuduStepsPage.tsx     # خطوات الوضوء
│   │   ├── WuduConditionsPage.tsx    # شروط الوضوء
│   │   ├── WuduMistakesPage.tsx      # أخطاء شائعة في الوضوء
│   │   ├── WuduInvalidatorsPage.tsx  # نواقض الوضوء
│   │   ├── SalahIntroPage.tsx        # مقدمة الصلاة
│   │   ├── SalahStepsPage.tsx        # خطوات الصلاة
│   │   ├── SalahConditionsPage.tsx   # شروط الصلاة
│   │   ├── SalahPillarsPage.tsx      # أركان الصلاة
│   │   ├── SalahObligationsPage.tsx  # واجبات الصلاة
│   │   ├── SalahSunnahPage.tsx       # سنن الصلاة
│   │   ├── SalahMistakesPage.tsx     # أخطاء شائعة في الصلاة
│   │   ├── SalahInvalidatorsPage.tsx # مبطلات الصلاة
│   │   ├── AdhkarPage.tsx        # أذكار بعد الصلاة
│   │   ├── QuizPage.tsx          # اختبار المعلومات
│   │   ├── FAQPage.tsx           # أسئلة شائعة
│   │   ├── SettingsPage.tsx      # الإعدادات
│   │   ├── FavoritesPage.tsx     # المفضلة
│   │   └── AchievementsPage.tsx  # الإنجازات
│   ├── data/                     # بيانات التطبيق (ثابتة)
│   │   ├── wuduData.ts           # بيانات الوضوء
│   │   ├── salahData.ts          # بيانات الصلاة
│   │   ├── adhkarData.ts         # بيانات الأذكار
│   │   ├── quizData.ts           # أسئلة الاختبار
│   │   └── faqData.ts            # الأسئلة الشائعة
│   ├── contexts/                 # React Contexts
│   │   ├── ThemeContext.tsx       # وضع الأطفال/الكبار + الثيم
│   │   └── ProgressContext.tsx    # تتبع تقدم المستخدم
│   └── utils/
│       └── tts.ts                # نظام الصوت (TTS) - الملف الأهم!
├── android/                      # مشروع أندرويد (Capacitor)
│   ├── app/
│   │   ├── build.gradle          # إعدادات البناء (versionCode, signing)
│   │   └── src/main/res/         # موارد أندرويد (أيقونات، ألوان)
│   └── ...
├── tts-proxy/                    # سيرفر TTS الوسيط (FastAPI)
│   ├── main.py                   # كود السيرفر
│   └── pyproject.toml            # تبعيات Python
├── capacitor.config.ts           # إعدادات Capacitor
├── vite.config.ts                # إعدادات Vite
├── package.json                  # تبعيات Node.js + أوامر البناء
└── tsconfig.json                 # إعدادات TypeScript
```

---

## نظام الصوت (TTS) / Text-to-Speech System

هذا أهم جزء تقني في المشروع. الصوت يعمل بطريقة مختلفة على كل منصة:

### على المتصفح (التطوير)
يستخدم **Web Speech API** المدمج في المتصفح.

### على أندرويد (الإنتاج)
يستخدم **سيرفر وسيط (TTS Proxy)** لجلب الصوت من Google Translate:

```
المستخدم يضغط النص → fetchAudio() → TTS Proxy (Fly.io) → Google Translate → MP3 → Web Audio API → صوت
```

**لماذا سيرفر وسيط؟**
- Google تحظر الطلبات المباشرة من WebView بالأندرويد (HTTP 302 → CAPTCHA → 429)
- السيرفر الوسيط يرسل الطلب بـ headers عادية فيبدو كمتصفح حقيقي

**السيرفر الوسيط الحالي:**
- URL: `https://tts-proxy-jabcxjlh.fly.dev`
- منشور على Fly.io
- الكود في `tts-proxy/main.py`

### ملف `src/utils/tts.ts` - التفاصيل التقنية

| الوظيفة | الوصف |
|---------|-------|
| `speakArabic(text)` | الدالة الرئيسية - تشغل الصوت العربي |
| `stopSpeaking()` | توقف الصوت الحالي |
| `isSpeaking()` | ترجع `true` إذا الصوت يعمل حالياً |
| `splitTextIntoChunks()` | تقسم النص الطويل لقطع ≤200 حرف (حد Google) |
| `fetchAudio()` | تجلب الصوت بـ 3 طرق: CapacitorHttp → fetch → XHR |
| `tryPlay()` | تشغل الصوت بـ 3 طرق: Web Audio API → HTML5 Audio + blob → HTML5 Audio + data URI |

### تغيير URL السيرفر الوسيط

إذا تحتاج تغير URL السيرفر، عدّل في `src/utils/tts.ts`:

```typescript
function createAudioUrl(text: string): string {
  const encoded = encodeURIComponent(text);
  return 'https://YOUR-NEW-URL.fly.dev/tts?tl=ar&q=' + encoded;
}
```

---

## مكون TappableText / TappableText Component

المكون الأساسي لوضع الأطفال. يحول أي نص لنص قابل للضغط يقرأ بصوت عالي:

```tsx
<TappableText text="بسم الله الرحمن الرحيم" isChildMode={true}>
  <p>بسم الله الرحمن الرحيم</p>
</TappableText>
```

**السلوك:**
- عند الضغط: يشغل صوت عربي + يظهر تأثير بصري (خط تحت + خلفية ملونة + أيقونة سماعة)
- في وضع الكبار: يعرض المحتوى بدون تفاعل صوتي

---

## سيرفر TTS الوسيط / TTS Proxy Server

### التشغيل محلياً

```bash
cd tts-proxy
pip install poetry
poetry install
poetry run uvicorn main:app --reload --port 8000
```

### النشر على Fly.io

```bash
cd tts-proxy
fly launch
fly deploy
```

### Endpoints

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/tts?tl=ar&q=TEXT` | جلب صوت من Google Translate |
| GET | `/health` | فحص صحة السيرفر |

---

## التوقيع والنشر / Signing & Publishing

### إنشاء Keystore جديد

```bash
keytool -genkey -v -keystore wudu-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias wudu-key
```

### إعدادات التوقيع في `android/app/build.gradle`

```gradle
android {
    signingConfigs {
        release {
            storeFile file('wudu-release-key.jks')
            storePassword 'YOUR_PASSWORD'
            keyAlias 'wudu-key'
            keyPassword 'YOUR_PASSWORD'
        }
    }
}
```

### تحديث الإصدار

قبل كل رفع على Google Play، عدّل في `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 6        // يجب زيادته كل مرة (الحالي: 5)
    versionName "1.5"    // رقم الإصدار المعروض (الحالي: "1.4")
}
```

> **مهم:** Google Play يرفض أي AAB بنفس `versionCode` سابق. يجب زيادته كل مرة.

### تسجيل مفتاح التوقيع على Google Play

عند استخدام keystore جديد:
1. ادخل Google Play Console → التطبيق → سلامة التطبيق
2. اضغط "تسجيل مفتاح تحميل جديد"
3. استخرج SHA-256:
   ```bash
   keytool -list -v -keystore wudu-release-key.jks -alias wudu-key
   ```
4. أدخل بصمة SHA-256

---

## Google Play Console

- **Developer Account:** https://play.google.com/console/
- **App ID:** `4974830162249589361`
- **Track الحالي:** الاختبار المغلق - Alpha
- **سياسة الخصوصية:** منشورة عبر Fly.io (static HTML)

---

## ملاحظات مهمة للمطورين / Important Notes

### الأيقونة (Adaptive Icon)
- Android 8+ يستخدم نظام Adaptive Icon: طبقة أمامية (foreground) + لون خلفية (background)
- لون الخلفية في: `android/app/src/main/res/values/ic_launcher_background.xml`
- اللون الحالي: `#2E7D5B` (أخضر)
- إذا غيرت الأيقونة، تأكد لون الخلفية يتناسب مع التصميم الجديد

### Capacitor
- إعدادات Capacitor في `capacitor.config.ts`
- بعد تعديل أي كود React، شغّل `npx cap sync android` لنقل التغييرات لأندرويد
- أو استخدم `npm run build-apk` اللي يعمل sync تلقائياً

### الاختبار
- **المتصفح:** `npm run dev` - يختبر الواجهة والتنقل (الصوت يعمل بـ Web Speech API)
- **أندرويد:** ابنِ APK وثبته على جهاز حقيقي - الصوت عبر proxy يعمل فقط على أندرويد
- **ملاحظة:** Appetize.io يمكن استخدامه لاختبار APK بدون جهاز حقيقي

### التبعيات الرئيسية
| الحزمة | الاستخدام |
|--------|-----------|
| `react` + `react-dom` | إطار العمل الأساسي |
| `react-router-dom` | التنقل بين الصفحات |
| `tailwindcss` | التنسيق (CSS) |
| `lucide-react` | الأيقونات |
| `@capacitor/core` | التكامل مع أندرويد |
| `@capacitor/android` | منصة أندرويد |
| `vite` | أداة البناء |

### ملفات يمكن حذفها (تنظيف)
- `src/components/SpeakButton.tsx` - تم استبداله بـ `TappableText.tsx`
- `src/App.css` - أنماط Vite الأصلية (غير مستخدمة)
- `src/assets/react.svg`, `src/assets/vite.svg` - شعارات Vite الأصلية (غير مستخدمة)

---

## الأوامر السريعة / Quick Commands

```bash
# تشغيل بيئة التطوير
npm run dev

# بناء المشروع
npm run build

# بناء APK للتجربة
npm run build-apk

# بناء AAB للرفع على Google Play
npm run build-aab

# مزامنة التغييرات مع أندرويد
npm run sync-android

# تشغيل ESLint
npm run lint
```
