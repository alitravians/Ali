# Video Saver - تطبيق تحميل الفيديوهات

تطبيق أندرويد احترافي لتحميل مقاطع الريلز من Instagram و فيديوهات TikTok عبر نسخ الرابط فقط.

## المميزات

### التحميل
- تحميل مقاطع Instagram Reels و Stories عبر لصق الرابط
- تحميل فيديوهات TikTok القصيرة عبر لصق الرابط
- زر لصق ذكي يقرأ الرابط من الحافظة تلقائياً
- كشف تلقائي للمنصة (Instagram / TikTok) من الرابط
- شريط تقدم مع نسبة مئوية أثناء التحميل
- حفظ تلقائي في مجلد "Video Saver" داخل Gallery
- تسمية ذكية: `{Platform}_{Date}_{Number}.mp4`

### واجهة المستخدم
- شاشة لودينغ احترافية عند فتح التطبيق (0% إلى 100%) مع رسائل حالة متغيرة
- واجهة عربية بالكامل (RTL)
- تصميم Material 3 عصري مع ألوان متدرجة
- معلومات المطور أسفل الشاشة مع اسم "Ali" ملون ومتحرك
- أيقونة احترافية بتدرج أزرق داكن

### المشاركة
- زر مشاركة واتساب بعد نجاح التحميل لتحويل المقاطع مباشرة للأصدقاء
- مشاركة عامة (fallback) إذا واتساب غير مثبت

### الشاشات
1. **الشاشة الرئيسية** - لصق الرابط وتحميل الفيديو
2. **سجل التحميلات** - عرض جميع التحميلات السابقة مع إمكانية إعادة التحميل
3. **الإعدادات** - إعدادات التطبيق والتفضيلات

### التعامل مع الأخطاء
- رسائل خطأ واضحة بالعربي لكل حالة
- كشف المحتوى المقيد بالعمر (Age-gated) في Instagram مع رسالة توضيحية
- إعادة محاولة تلقائية عند فشل التحميل (3 محاولات)
- تنظيف تلقائي لروابط التتبع (مثل `?igsh=...`)

---

## البنية التقنية

### التقنيات المستخدمة
| التقنية | الاستخدام |
|---------|-----------|
| **Kotlin** | لغة البرمجة الأساسية |
| **Jetpack Compose** | واجهة المستخدم (UI) |
| **Material 3** | نظام التصميم |
| **MVVM Architecture** | نمط البنية |
| **Room Database** | قاعدة بيانات محلية لسجل التحميلات |
| **OkHttp** | مكتبة الشبكات |
| **Jsoup** | تحليل HTML |
| **Coil** | تحميل الصور |
| **DataStore** | حفظ إعدادات المستخدم |
| **Coroutines** | البرمجة غير المتزامنة |
| **Navigation Compose** | التنقل بين الشاشات |

### هيكل المشروع
```
app/src/main/java/com/videosaver/app/
├── MainActivity.kt                    # النشاط الرئيسي
├── service/
│   ├── VideoExtractor.kt             # الواجهة الأساسية للاستخراج
│   ├── InstagramExtractor.kt         # استخراج فيديوهات Instagram
│   ├── TikTokExtractor.kt            # استخراج فيديوهات TikTok
│   └── VideoDownloadService.kt       # خدمة التحميل
├── viewmodel/
│   ├── MainViewModel.kt              # ViewModel الشاشة الرئيسية
│   ├── HistoryViewModel.kt           # ViewModel سجل التحميلات
│   └── SettingsViewModel.kt          # ViewModel الإعدادات
├── ui/
│   ├── screens/
│   │   ├── MainScreen.kt             # واجهة الشاشة الرئيسية
│   │   ├── HistoryScreen.kt          # واجهة سجل التحميلات
│   │   ├── SettingsScreen.kt         # واجهة الإعدادات
│   │   └── SplashScreen.kt           # شاشة اللودينغ
│   ├── navigation/
│   │   └── AppNavigation.kt          # التنقل بين الشاشات
│   └── theme/
│       └── Theme.kt                  # سمة التطبيق
├── data/
│   ├── AppDatabase.kt                # قاعدة البيانات
│   ├── DownloadDao.kt                # DAO لسجل التحميلات
│   └── DownloadEntity.kt             # نموذج البيانات
└── model/
    ├── VideoInfo.kt                  # معلومات الفيديو
    ├── Platform.kt                   # المنصات المدعومة
    └── ContentType.kt                # أنواع المحتوى
```

### آلية استخراج الفيديو

#### Instagram
1. **Cobalt API** (أساسي) - خادم `downloadapi.stuff.solutions/api/json` (v7، بدون مصادقة)
2. **oEmbed API** - لكشف المحتوى المقيد وجلب المعلومات
3. **HTML Scraping** - كطريقة احتياطية

#### TikTok
1. **Cobalt API + التحقق** - يستخرج الرابط ويتحقق من صلاحيته بـ GET request
2. **tikwm.com API** - بديل أساسي موثوق يرجع روابط CDN مباشرة
3. **oEmbed** - طريقة احتياطية
4. **HTML Scraping** - طريقة احتياطية
5. **TikTok API** - طريقة احتياطية أخيرة

### إعدادات البناء
| الإعداد | القيمة |
|---------|--------|
| Min SDK | 26 (Android 8.0) |
| Target SDK | 34 (Android 14) |
| Kotlin Compiler Extension | 1.5.8 |
| Compose BOM | 2023.10.01 |
| Java Version | 17 |

---

## سجل الإصدارات

### v1.9 (الإصدار الحالي)
- إضافة tikwm.com API كبديل أساسي لتحميل TikTok
- إضافة تحقق من روابط cobalt stream بـ GET request (بدل HEAD)
- تحسين headers التحميل حسب نوع الرابط (cobalt/tikwm/CDN)
- إصلاح خطأ 500 Internal Server Error من خادم cobalt

### v1.8
- إزالة تحقق HEAD request اللي كان يكسر روابط cobalt stream
- الثقة بردود cobalt API مباشرة بدون تحقق

### v1.7
- إضافة تحقق من صلاحية روابط الفيديو قبل التحميل
- إضافة إعادة محاولة تلقائية (retry logic)
- إضافة `isNoTTWatermark` لفيديوهات TikTok بدون علامة مائية

### v1.6
- استبدال خوادم cobalt الميتة بخادم v7 شغال
- إصلاح خطأ 403 من TikTok CDN بإضافة Referer header
- تنظيف روابط TikTok من معلمات التتبع
- دعم حالة "stream" من cobalt API

### v1.5
- إصلاح جذري لمشكلة المحتوى المقيد بالعمر في Instagram
- كشف تلقائي للمحتوى المقيد مع رسائل توضيحية
- إضافة طرق استخراج متعددة احتياطية
- تنظيف روابط Instagram من معلمات التتبع

### v1.4
- إضافة شاشة لودينغ احترافية (0% إلى 100%)
- إضافة معلومات المطور مع اسم "Ali" ملون ومتحرك
- إضافة زر مشاركة واتساب بعد التحميل

### v1.3
- إصلاح استخراج Instagram بالكامل
- إيجاد خادم cobalt v7 شغال بدون مصادقة

### v1.2
- إصلاح تعارض إصدارات Compose BOM
- إصلاح كراش التطبيق عند التحميل

### v1.1
- إصلاح زر اللصق باستخدام ClipboardManager
- إصلاح كشف الروابط (regex محسّن)
- إضافة Cobalt API كطريقة استخراج أساسية

### v1.0
- الإصدار الأول
- واجهة عربية مع Jetpack Compose
- تحميل أساسي من Instagram و TikTok

---

## كيفية البناء

### المتطلبات
- Android Studio (أو Gradle 8.5+)
- JDK 17
- Android SDK 34

### خطوات البناء
```bash
# استنساخ المستودع
git clone https://github.com/alitravians/Ali.git
cd Ali/video-saver-app

# بناء ملف APK
./gradlew assembleDebug

# ملف APK سيكون في:
# app/build/outputs/apk/debug/app-debug.apk
```

### بناء إصدار Release
```bash
./gradlew assembleRelease
# ملاحظة: يحتاج إعداد signing key
```

---

## الاختبار

تم اختبار التطبيق باستخدام [Appetize.io](https://appetize.io) على:
- **الجهاز**: Pixel 7
- **نظام التشغيل**: Android 13.0
- **الأدوات**: Debug Logs + Network HAR

---

## المطور

تم برمجة وتطوير هذا التطبيق بواسطة **Ali**

---

## الترخيص

هذا المشروع خاص - جميع الحقوق محفوظة.
