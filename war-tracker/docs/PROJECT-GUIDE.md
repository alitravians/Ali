# 📘 دليل مشروع WarScope — التوثيق الشامل

> آخر تحديث: أبريل 2026

---

## 📌 نظرة عامة

**WarScope** — منصة تتبع أحداث جيوسياسية في الشرق الأوسط بالوقت الحقيقي. تجمع بيانات من مصادر متعددة (أخبار، أقمار صناعية، طيران، سفن) وتعرضها على خريطة تفاعلية مع تحليل ذكاء اصطناعي.

| | التفاصيل |
|---|---|
| **الفرونتند** | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| **الباكند** | Python 3.12 + FastAPI + uvicorn |
| **الذكاء الاصطناعي** | Groq Llama 3.3 (تحليل + ردود ذكية) |
| **رابط الإنتاج (فرونتند)** | https://dist-mu-taupe-70.vercel.app |
| **رابط الإنتاج (باكند)** | https://war-tracker-backend-v2.fly.dev |
| **استضافة الفرونتند** | Vercel |
| **استضافة الباكند** | Fly.io |
| **اللغة** | عربي بالكامل (RTL) |

---

## 📁 هيكل المشروع

### الفرونتند (`war-tracker/`)
```
war-tracker/
├── src/
│   ├── App.tsx                          # الراوتر الرئيسي — كل المسارات
│   ├── main.tsx                         # نقطة الدخول
│   ├── index.css                        # الأنماط العامة
│   │
│   ├── pages/                           # ── صفحات التطبيق ──
│   │   ├── Home.tsx                     # الرئيسية — إحصائيات عامة
│   │   ├── LiveTracking.tsx             # الخريطة الحية (/live)
│   │   ├── Analysis.tsx                 # تحليل الذكاء الاصطناعي (/analysis)
│   │   ├── Cities.tsx                   # المدن + تفاصيل المدينة (/cities, /cities/:slug)
│   │   ├── Alerts.tsx                   # التنبيهات (/alerts)
│   │   ├── Sources.tsx                  # مصادر البيانات (/sources)
│   │   ├── StatusPage.tsx               # حالة النظام (/status)
│   │   └── Admin.tsx                    # لوحة التحكم (/admin)
│   │
│   ├── components/
│   │   ├── shared/                      # ── مكونات مشتركة ──
│   │   │   ├── BugReportButton.tsx      # زر الإبلاغ عن مشكلة (ثابت بكل الصفحات)
│   │   │   ├── RepairTracker3D.tsx      # صفحة أنيميشن الإصلاح (7 مراحل)
│   │   │   ├── LoadingScreen.tsx        # شاشة التحميل
│   │   │   ├── EventCard.tsx            # بطاقة الحدث
│   │   │   ├── EventDetailModal.tsx     # نافذة تفاصيل الحدث
│   │   │   ├── EventSearch.tsx          # بحث الأحداث
│   │   │   ├── AlertToast.tsx           # إشعارات Toast
│   │   │   ├── BahrainAlertBanner.tsx   # بانر تنبيه البحرين
│   │   │   ├── IndicatorCard.tsx        # بطاقة المؤشر
│   │   │   ├── TrustBadge.tsx           # شارة مستوى الثقة
│   │   │   ├── Modal.tsx                # نافذة منبثقة عامة
│   │   │   └── PhoneModeToggle.tsx      # تبديل وضع الجوال
│   │   │
│   │   ├── layout/                      # ── هيكل الصفحة ──
│   │   │   ├── Layout.tsx               # الإطار الرئيسي
│   │   │   ├── Navbar.tsx               # شريط التنقل العلوي
│   │   │   ├── Sidebar.tsx              # الشريط الجانبي
│   │   │   ├── BreakingTicker.tsx       # شريط الأخبار العاجلة
│   │   │   └── FooterStats.tsx          # إحصائيات الأسفل
│   │   │
│   │   ├── map/
│   │   │   └── LiveMap.tsx              # خريطة Leaflet الحية
│   │   │
│   │   ├── ai/
│   │   │   ├── AISummary.tsx            # ملخص الذكاء الاصطناعي
│   │   │   └── AISummaryModal.tsx       # نافذة الملخص
│   │   │
│   │   ├── maritime/
│   │   │   └── MaritimePanel.tsx        # لوحة تتبع السفن
│   │   │
│   │   └── timeline/
│   │       └── Timeline.tsx             # الخط الزمني للأحداث
│   │
│   ├── config/
│   │   └── api.ts                       # رابط الباكند (مصدر واحد للحقيقة)
│   │
│   ├── context/
│   │   ├── LiveDataContext.tsx           # بيانات الوقت الحقيقي (WebSocket)
│   │   └── PhoneModeContext.tsx          # حالة وضع الجوال
│   │
│   ├── hooks/
│   │   └── useAlertSound.ts             # مؤثرات صوتية للتنبيهات
│   │
│   ├── types/
│   │   └── index.ts                     # تعريفات TypeScript
│   │
│   ├── utils/
│   │   └── helpers.ts                   # دوال مساعدة
│   │
│   └── data/
│       └── staticConfig.ts              # بيانات ثابتة (المدن، الإعدادات)
│
├── vercel.json                          # إعدادات Vercel (CSP + SPA rewrites)
├── vite.config.ts                       # إعدادات Vite
├── package.json                         # الاعتماديات
└── tsconfig.json                        # إعدادات TypeScript
```

### الباكند (`war-tracker-backend/`)
```
war-tracker-backend/
├── main.py                # التطبيق الرئيسي — كل الـ endpoints + WebSocket + الجدولة
├── config.py              # متغيرات البيئة، مفاتيح API، CORS
├── models.py              # نماذج Pydantic (TrackerEvent, Alert, إلخ)
├── health_monitor.py      # فحص صحة الخدمات، تاريخ 90 يوم، سجل الحوادث
├── services/
│   ├── gdelt_service.py         # جلب أحداث GDELT (مجاني)
│   ├── rss_service.py           # جلب أخبار RSS (مجاني)
│   ├── news_service.py          # NewsAPI.org (يحتاج مفتاح)
│   ├── mediastack_service.py    # MediaStack (يحتاج مفتاح)
│   ├── acled_service.py         # بيانات نزاعات ACLED (يحتاج مفتاح)
│   ├── opensky_service.py       # تتبع الطيران OpenSky (مجاني)
│   ├── maritime_service.py      # تتبع السفن AISStream (يحتاج مفتاح)
│   ├── ai_service.py            # ترجمة وتحليل بالذكاء الاصطناعي (Groq)
│   ├── gemini_service.py        # تكامل Google Gemini
│   ├── devin_autofix.py         # Devin API للإصلاح التلقائي
│   └── dedup_engine.py          # محرك إزالة التكرار
├── Dockerfile               # Python 3.12-slim
├── fly.toml                 # إعدادات Fly.io
├── requirements.txt         # اعتماديات pip
└── pyproject.toml           # بيانات المشروع
```

---

## 🗺️ مسارات التطبيق (Routes)

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/` | Home | الصفحة الرئيسية — إحصائيات وملخص |
| `/live` | LiveTracking | الخريطة الحية مع الأحداث |
| `/analysis` | Analysis | تحليل الذكاء الاصطناعي |
| `/cities` | Cities | قائمة المدن المتأثرة |
| `/cities/:cityId` | Cities (detail) | تفاصيل مدينة محددة مع خريطة |
| `/alerts` | Alerts | التنبيهات والإشعارات |
| `/sources` | Sources | حالة مصادر البيانات |
| `/status` | StatusPage | حالة النظام الشاملة |
| `/admin` | Admin | لوحة تحكم الإدارة |

---

## 🔌 واجهات الباكند (API Endpoints)

### البيانات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/events` | كل الأحداث المتتبعة |
| GET | `/api/events/{id}` | تفاصيل حدث واحد |
| GET | `/api/aircraft` | مواقع الطائرات (OpenSky) |
| GET | `/api/alerts` | التنبيهات النشطة |
| GET | `/api/indicators` | مؤشرات المخاطر (5 فئات) |
| GET | `/api/sources` | حالة مصادر البيانات |
| GET | `/api/ai/summary` | ملخصات الذكاء الاصطناعي |
| GET | `/api/health` | فحص صحة سريع |
| GET | `/api/status` | حالة النظام الشاملة (خدمات + حوادث + uptime) |

### نظام البلاغات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/bug-report` | إرسال بلاغ مشكلة تقنية |
| GET | `/api/tickets/{id}` | حالة تذكرة بلاغ |
| WS | `/ws/ticket/{id}` | تحديثات مباشرة للتذكرة |

### WebSocket
| Endpoint | الوصف |
|----------|-------|
| `WS /ws` | بث البيانات الحية (أحداث، تنبيهات، مؤشرات) |
| `WS /ws/ticket/{id}` | تحديثات تذكرة محددة |

---

## 🐛 نظام الإبلاغ عن المشاكل

### المكونات
- **`BugReportButton.tsx`** — زر أحمر ثابت بأسفل-يسار كل الصفحات
- **`RepairTracker3D.tsx`** — صفحة أنيميشن الإصلاح (7 مراحل)
- **الباكند:** `/api/bug-report` في `main.py`

### تدفق العمل
1. المستخدم يضغط زر "إبلاغ عن مشكلة"
2. يكتب وصف المشكلة (5 أحرف كحد أدنى)
3. النظام يجمع تلقائياً: أخطاء الكونسول، إجراءات المستخدم، معلومات المتصفح، لقطة شاشة
4. يُرسل للباكند → الفلتر الذكي يتحقق
5. لو مقبول → تفتح صفحة الأنيميشن مع تذكرة
6. الردود الذكية تظهر تدريجياً بـ 7 مراحل

### الفلتر الذكي (3 مستويات)
1. **كلمات المشاكل** → يقبل فوراً: `مشكلة، خطأ، خلل، عطل، لا يعمل، ما يشتغل، توقف، تعلق، بطيء، error، bug، crash`
2. **كلمات الاقتراحات** → يرفض فوراً: `اقتراح، اقترح، فكرة، ياليت، نبي، ابي، تسوون، تضيفون، نبغى، ابغى، suggest، idea، feature`
3. **ذكاء اصطناعي** (Groq Llama 3.3) → للحالات الغامضة

### الحماية
- **حد يومي:** 3 بلاغات لكل مستخدم (IP) خلال 24 ساعة
- **تبريد عام:** دقيقتين بين أي بلاغين
- **حد أدنى:** 5 أحرف للوصف

### المراحل السبع للأنيميشن
| المرحلة | الاسم | الوصف |
|---------|-------|-------|
| 0 | استلام البلاغ | تم استلام البلاغ بنجاح |
| 1 | التحليل | فحص المشكلة وتحديد نقطة الخلل |
| 2 | تحديد السبب | تحديد السبب الجذري |
| 3 | الإصلاح | الدعم الفني المختص يعمل على الحل |
| 4 | التحقق | اختبار الحل والتأكد من فعاليته |
| 5 | النشر | نشر التحديث على الموقع |
| 6 | اكتمال | تم حل المشكلة بنجاح |

### الردود الذكية
- الباكند يرسل وصف المشكلة لـ Groq Llama 3.3
- الذكاء الاصطناعي ينتج 8 رسائل حالة مخصصة بالعربي
- الرسائل تظهر تدريجياً (8-15 ثانية بين كل رسالة)
- كل الرسائل آمنة — بدون أسماء ملفات أو أكواد أو تفاصيل حساسة
- تستخدم "الدعم الفني المختص" بدل "Devin"

### تحسينات الأنيميشن
- **دخول سينمائي:** العناصر تدخل واحد واحد بحركة fade+slide
- **Typewriter:** آخر رسالة تنكتب حرف بحرف مع مؤشر وامض
- **انتقال المراحل:** توهّج، خطوط جانبية ملونة، حركة bounce
- **جزيئات خلفية:** 20 جزيئة متحركة بألوان تتغير حسب المرحلة
- **شريط نيون:** ألوان متعددة متحركة (أزرق←بنفسجي←وردي) مع توهج
- **بطاقة الاكتمال:** حلقات ضوئية متوسعة + أيقونة نجاح متحركة
- **عداد الوقت:** يعرض مدة الإصلاح (مثل "1 د 23 ث")

### اتصال الـ WebSocket
| الحالة | الوصف |
|--------|-------|
| 🟢 LIVE | متصل مباشر عبر WebSocket |
| 🟡 POLLING | تحديث دوري كل 10 ثواني (WebSocket انقطع) |
| 🔴 SYNCING | جاري إعادة الاتصال |
| 🔵 CONNECTING | جاري الاتصال الأولي |

---

## 📊 صفحة الحالة (Status Page)

### الخدمات المراقبة (10 خدمات)
| الفئة | الخدمة | الحالة |
|-------|--------|--------|
| **البنية التحتية** | Backend API | مفعّلة |
| | WebSocket Server | مفعّلة |
| | Frontend | مفعّلة |
| **مصادر البيانات** | GDELT | مفعّلة (مجاني) |
| | RSS Feeds | مفعّلة (مجاني) |
| | NewsAPI | معطّلة (يحتاج مفتاح API) |
| | MediaStack | معطّلة (يحتاج مفتاح API) |
| **خدمات خارجية** | OpenSky | مفعّلة (مجاني) |
| | AISStream | معطّلة (يحتاج مفتاح API) |
| | ACLED | معطّلة (يحتاج مفتاح API) |

### الميزات
- شريط تاريخ 90 يوم لكل خدمة (أخضر/أحمر/رمادي)
- عداد "X يوم بدون حوادث"
- رسوم بيانية لزمن الاستجابة (تختفي لما تكون 0ms)
- سجل الحوادث مع تفاصيل
- الخدمات المعطّلة تعرض السبب
- تحديث تلقائي كل 30 ثانية

---

## 📡 مصادر البيانات

| المصدر | الفاصل الزمني | مفتاح API | ملاحظات |
|--------|--------------|-----------|---------|
| GDELT | 120 ثانية | لا | تجنب حد 429 |
| RSS | 180 ثانية | لا | مجاني بالكامل |
| NewsAPI | 900 ثانية | نعم | 100 طلب/يوم مجاني |
| MediaStack | — | نعم | معطّل حالياً |
| ACLED | — | نعم | معطّل حالياً |
| OpenSky | 60 ثانية | لا | تتبع طيران |
| AISStream | مستمر | نعم | معطّل حالياً |
| تحليل AI | 900 ثانية | GROQ_API_KEY | تحليل ذكي |

---

## 🔐 المتغيرات البيئية (Backend)

| المتغير | مطلوب | الوصف |
|---------|-------|-------|
| `GROQ_API_KEY` | ✅ نعم | Groq AI — تحليل + ردود ذكية |
| `DEVIN_API_KEY` | لا | Devin API — إصلاح تلقائي |
| `DEVIN_TARGET_SESSION_ID` | لا | جلسة Devin لتحويل البلاغات |
| `NEWSAPI_KEY` | لا | NewsAPI.org |
| `MEDIASTACK_KEY` | لا | MediaStack |
| `ACLED_KEY` | لا | ACLED |
| `AISSTREAM_API_KEY` | لا | AISStream — تتبع سفن |
| `CORS_DEV` | لا | `1` لتفعيل localhost CORS |

---

## 🔧 أوامر التطوير

### الفرونتند
```bash
cd war-tracker
npm install            # تثبيت الاعتماديات
npm run dev            # تشغيل سيرفر التطوير (Vite, منفذ 5173)
npm run build          # بناء: tsc -b && vite build
npm run lint           # فحص ESLint
npm run preview        # معاينة البناء
```

### الباكند
```bash
cd war-tracker-backend
pip install -r requirements.txt              # تثبيت الاعتماديات
uvicorn main:app --host 0.0.0.0 --port 8080  # تشغيل السيرفر
```

---

## 🚀 النشر (Deployment)

### الفرونتند → Vercel
```bash
cd war-tracker

# إعداد المشروع الصحيح (مرة واحدة)
mkdir -p .vercel
echo '{"projectId":"warscope","orgId":"team_Ejgun9t4NxnuP6rWpOEZFCZl"}' > .vercel/project.json

# النشر
npx vercel deploy --prod --yes
```

**⚠️ مهم:**
- الرابط الثابت: `https://dist-mu-taupe-70.vercel.app` — لا تغيّره أبداً
- Vercel يبني من المصدر (يشغّل `tsc -b && vite build`)
- لازم تعمل commit + push قبل النشر
- لو غيّرت رابط الباكند، حدّث `connect-src` في `vercel.json`

### الباكند → Fly.io
```bash
cd war-tracker-backend
fly deploy
```

**إعدادات Fly.io:**
- اسم التطبيق: `war-tracker-backend-v2`
- المنطقة: `iad` (شرق أمريكا)
- المنفذ: 8080
- إيقاف تلقائي: مفعّل
- تشغيل تلقائي: مفعّل
- أقل عدد أجهزة: 1

**إضافة متغيرات بيئية:**
```bash
fly secrets set GROQ_API_KEY=xxx
fly secrets set DEVIN_API_KEY=xxx
```

---

## 🗃️ نماذج البيانات الرئيسية

### TrackerEvent (حدث)
```
id, title, titleAr, description, descriptionAr, category, trustLevel,
trustReason, trustReasonAr, location{lat, lng, name, nameAr},
timestamp, sources[], isBreaking, isDuplicate, relatedCities[]
```

### فئات الأحداث
`military` عسكري | `alert` تنبيه | `official` رسمي | `airspace` أجواء | `maritime` بحري | `fire` حريق | `humanitarian` إنساني

### مستويات الثقة
`confirmed` مؤكد | `high` عالي | `medium` متوسط | `low` منخفض

### مؤشرات المخاطر (5)
النشاط العسكري | مخاطر الأجواء | مخاطر الملاحة | مخاطر المدنيين | عدم يقين المعلومات

---

## 🌍 منطقة التغطية

- **الإحداثيات:** خط عرض 24°-40° | خط طول 30°-65°
- **الدول:** إيران، إسرائيل، لبنان، سوريا، العراق، اليمن، فلسطين، البحرين، الكويت، قطر، الإمارات، السعودية، الأردن، عُمان
- **الممرات المائية:** مضيق هرمز، البحر الأحمر، قناة السويس

---

## 🎨 معايير التصميم

| العنصر | القيمة |
|--------|--------|
| اللغة | عربي بالكامل |
| الاتجاه | RTL (يمين لليسار) |
| الخلفية | داكنة (#0a0e1a, #12121a) |
| اللون الأساسي | أزرق (#3b82f6) |
| لون النجاح | أخضر (#22c55e) |
| لون الخطأ | أحمر (#ef4444) |
| الخط الثانوي | 9-11px |
| الخط الأساسي | 13-14px |
| الأنيميشن | cubic-bezier للسلاسة |

---

## ⚙️ إعدادات مهمة

### CORS (الباكند)
```python
# config.py — الروابط المسموحة
FRONTEND_ORIGINS = [
    "https://dist-mu-taupe-70.vercel.app",    # فرونتند الإنتاج
    "https://war-tracker-backend-v2.fly.dev",  # الباكند نفسه
]
# + localhost:5173 و localhost:3000 لو CORS_DEV=1
```

### CSP (الفرونتند)
```json
// vercel.json — Content-Security-Policy
"connect-src": "self https://war-tracker-backend-v2.fly.dev wss://war-tracker-backend-v2.fly.dev"
```

### رابط الباكند (مصدر واحد)
```typescript
// src/config/api.ts
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'https://war-tracker-backend-v2.fly.dev';
```

---

## 📋 ملاحظات للمطور المستقبلي

1. **البيانات بالذاكرة فقط** — الباكند ما يستخدم قاعدة بيانات. كل البيانات تنمسح عند إعادة التشغيل. هذا بالتصميم لأن المنصة تتبع أحداث الوقت الحقيقي.

2. **لا تنشئ روابط جديدة** — دائماً انشر على نفس الرابط الأصلي (`dist-mu-taupe-70.vercel.app`).

3. **نظام البلاغات بدون تذاكر** — النظام fire-and-forget. المستخدم يرسل بلاغ ويشوف الأنيميشن وخلاص. ما فيه نظام تذاكر أو متابعة.

4. **"الدعم الفني المختص"** — استخدم هالعبارة بدل "Devin" بكل النصوص اللي يشوفها المستخدم.

5. **الفلتر الذكي** — لازم يرفض الاقتراحات والأفكار. الزر مخصص للمشاكل التقنية فقط.

6. **بعد أي تعديل** — سوّي `Ctrl+Shift+R` (تحديث صلب) عشان تتأكد إن التغييرات ظهرت.

7. **مدن بدون أحداث** — لو مدينة ما عندها أحداث، اعرض رسالة إيجابية مثل "لم تُسجّل أحداث — مؤشر إيجابي".
