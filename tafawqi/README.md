# تفوّقي · Tafawqi

موقع عربي بالكامل مُخصَّص لاختبار طالبات الصف العاشر في مادة الرياضيات (المنهج السوري)،
يعتمد على اختبارات قصيرة تفاعلية + تصحيح فوري + شرح للأخطاء + نظام نقاط وشارات وشهادات.

## نظرة سريعة على الميزات

- 🏠 صفحة رئيسية: ترحيب، شرح الفكرة، الفصول، أعلى الطالبات، الأسئلة الشائعة، تواصل
- 🔐 تسجيل / دخول / استرجاع كلمة المرور (Cookie-based JWT session)
- 📚 فصول مقسَّمة حسب المنهج السوري للصف العاشر (جبر، معادلات، هندسة، كسور، إحصاء، احتمالات، دوال)
- ⏱ اختبارات قصيرة (٥/١٠ أسئلة، اختبارات سريعة بدقيقتين، اختبارات نهاية الوحدة، مراجعة)
- ❓ أنواع أسئلة: اختيار من متعدد، صح/خطأ، أكمل الفراغ، مطابقة، ترتيب الخطوات
- ✨ تصحيح فوري مع شرح الإجابات الصحيحة لكل سؤال
- 🧠 ذكاء بسيط: اقتراح اختبارات إضافية للأقسام التي تكثر الأخطاء فيها
- 🏆 نظام نقاط + ٨ مستويات (مبتدئة … أسطورة) + شارات + شهادات إلكترونية
- 🥇 لوحة المتصدِّرات
- 🔔 إشعارات (اختبار جديد، اقتراحات، تهانٍ)
- 🌙 الوضع الليلي
- 🛠 لوحة تحكم إدارية شاملة (إحصاءات، طالبات، أسئلة، اختبارات، إعدادات)

## التقنيات

- **Next.js 14** (App Router) + **TypeScript** + **React 18**
- **Tailwind CSS** (RTL + Dark Mode)
- **Prisma 5** + **PostgreSQL** (إنتاج) / SQLite للتطوير المحلي
- **bcryptjs** + **jsonwebtoken** لتسجيل دخول مبسَّط بدون NextAuth
- **Tajawal** خط جوجل العربي

## التشغيل المحلي

```bash
# 1. ثبّت الحزم
npm install

# 2. أنشئ ملف .env من المثال وعدّل DATABASE_URL
cp .env.example .env

# 3. هيّئ قاعدة البيانات (PostgreSQL)
npx prisma db push

# 4. اسكب البيانات الأوّلية
npm run seed

# 5. شغّل خادم التطوير
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

> ملاحظة: للتطوير السريع باستخدام SQLite، عدّل `provider` في `prisma/schema.prisma` إلى `"sqlite"` و
> اضبط `DATABASE_URL="file:./dev.db"`.

## حسابات الاختبار الافتراضية

| النوع | البريد | كلمة المرور |
| --- | --- | --- |
| مشرفة | `admin@tafawqi.app` | `admin123` |
| طالبة | `demo@tafawqi.app`  | `demo1234` |

## النشر على Vercel

1. اربط هذا المجلد (`tafawqi/`) بمشروع Vercel.
2. أضف قاعدة بيانات Postgres من Vercel (Storage → Create Database) — سيُضاف `DATABASE_URL` تلقائياً.
3. ضع متغيرات البيئة:
   - `DATABASE_URL` — من Vercel Postgres.
   - `AUTH_SECRET` — أيّ نصّ سرّي عشوائي طويل.
   - `SEED_TOKEN` — رمز لحماية إندبوينت السقاية الأوَّلي.
4. أوّل نشر سينفّذ `prisma db push` تلقائياً لإنشاء الجداول.
5. بعد النشر، استدعِ `POST https://your-domain/api/admin/seed?token=YOUR_SEED_TOKEN` مرة واحدة لزرع المحتوى الأولي.

## هيكل المشروع

```
tafawqi/
├── app/
│   ├── api/                # API routes (auth, attempts, admin, etc.)
│   ├── admin/              # لوحة الإدارة
│   ├── chapters/           # تصفّح الفصول والأقسام
│   ├── quiz/[slug]/        # محرّك تنفيذ الاختبار
│   ├── results/[id]/       # عرض النتائج وشرح الأخطاء
│   ├── dashboard/          # لوحة الطالبة
│   ├── leaderboard/        # لوحة المتصدِّرات
│   ├── profile/            # الملف الشخصي والشهادات
│   ├── certificate/[code]/ # عرض شهادة قابل للطباعة
│   ├── login | register | forgot/
│   ├── layout.tsx          # RTL + dir="rtl" + خط Tajawal
│   ├── theme-provider.tsx  # تبديل الوضع الليلي
│   ├── site-header.tsx
│   ├── site-footer.tsx
│   └── globals.css         # ألوان + Tailwind utilities
├── lib/
│   ├── prisma.ts           # PrismaClient singleton
│   ├── auth.ts             # تجزئة كلمات المرور + JWT + جلسات
│   ├── levels.ts           # نظام المستويات والنقاط
│   └── grader.ts           # تصحيح الإجابات (يدعم النصوص العربية)
├── prisma/
│   ├── schema.prisma       # ١٣ نموذجاً (User, Question, Quiz, …)
│   ├── questionBank.ts     # ٧ فصول، ١٤+ قسماً، ٦٠+ سؤالاً
│   └── seed.ts             # سكربت السقاية المحلي
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## الترخيص

مشروع تعليمي مفتوح لمالك المستودع.
