# WarScope — وارسكوب

**منصة تتبع وتحليل الأحداث الجيوسياسية والعسكرية في الوقت الفعلي** (Real-time geopolitical and military events intelligence platform)

**الموقع المباشر / Live site:** **[https://dist-mu-taupe-70.vercel.app](https://dist-mu-taupe-70.vercel.app)**

---

## نظرة عامة / Overview

WarScope هي منصة عربية مبنية على React + TypeScript + FastAPI توفّر:
- **تتبع مباشر** للأحداث الجيوسياسية من مصادر موثوقة
- **مراقبة بحرية** للسفن العسكرية والتجارية عبر AIS (مضيق هرمز، البحر الأحمر)
- **تنبيهات فورية** عبر إشعارات الويب (Push Notifications)
- **تحليلات ذكية** باستخدام نماذج لغوية كبيرة
- **لوحة صحّة نظام** (Status Page) مع سجل uptime لـ ٩٠ يوماً
- **لوحة إدارة** متقدمة لإدارة المصادر والتنبيهات

WarScope is an Arabic-first platform built on React + TypeScript + FastAPI that provides:
- **Live tracking** of geopolitical events from trusted sources
- **Maritime surveillance** of military and commercial vessels via AIS (Strait of Hormuz, Red Sea)
- **Instant alerts** via Web Push notifications
- **AI-powered analysis** using LLMs
- **System health dashboard** with 90-day uptime history
- **Admin panel** for source and alert management

---

## الصفحات الرئيسية / Main pages

| المسار | الوصف |
|---|---|
| [`/`](https://dist-mu-taupe-70.vercel.app/) | الصفحة الرئيسية |
| [`/live`](https://dist-mu-taupe-70.vercel.app/live) | التتبع المباشر للأحداث |
| [`/analysis`](https://dist-mu-taupe-70.vercel.app/analysis) | التحليلات الذكية |
| [`/alerts`](https://dist-mu-taupe-70.vercel.app/alerts) | التنبيهات والإشعارات |
| [`/cities`](https://dist-mu-taupe-70.vercel.app/cities) | رصد المدن على الخريطة |
| [`/sources`](https://dist-mu-taupe-70.vercel.app/sources) | المصادر الإخبارية |
| [`/settings`](https://dist-mu-taupe-70.vercel.app/settings) | الإعدادات |
| [`/about`](https://dist-mu-taupe-70.vercel.app/about) | نبذة عن المنصة |

---

## التقنيات / Tech stack

**Frontend** (`war-tracker/`): React 18, TypeScript, Vite, Tailwind CSS, React Router, React Helmet Async, Leaflet, Lucide Icons.

**Backend** (`war-tracker-backend/`): FastAPI, Python 3.11, aiosqlite, websockets, AISStream.io, NewsAPI, httpx.

**الاستضافة / Hosting:** Vercel (frontend) + Fly.io (backend + persistent volume).

---

## SEO & Indexing

المنصة مُهيَّأة بالكامل لمحركات البحث:
- `sitemap.xml` + `robots.txt`
- 4 JSON-LD schemas (WebApplication, Organization, WebSite+SearchAction, BreadcrumbList)
- Open Graph + Twitter Card metadata
- hreflang للعربية + og:locale alternates (ar_SA, ar_AE, ar_EG)
- Google Search Console verified
- IndexNow integration for Bing / Yandex

---

## البنية / Structure

```
Ali/
├── war-tracker/              # React frontend (deployed to Vercel)
│   ├── src/
│   │   ├── pages/            # Page components (Live, Analysis, Alerts, ...)
│   │   ├── components/       # Shared UI
│   │   │   ├── maritime/     # Hormuz blockade monitor, vessel tracker
│   │   │   ├── admin/        # Admin panel sections
│   │   │   └── shared/       # Reusable widgets
│   │   └── types/            # TypeScript contracts with backend
│   └── public/               # Static assets (sitemap, robots, og-image, sw.js)
│
├── war-tracker-backend/      # FastAPI backend (deployed to Fly.io)
│   ├── main.py               # FastAPI app entry
│   ├── database.py           # SQLite persistence
│   ├── health_monitor.py     # Uptime + incident tracking
│   ├── models.py             # Pydantic DTOs
│   └── services/
│       ├── maritime_service.py   # AIS WebSocket + vessel tracking
│       └── news_service.py       # News aggregation + AI analysis
│
└── chat-platform/            # (Separate Next.js chat subsystem)
```

---

## الترخيص / License

All rights reserved © WarScope. Contact via GitHub Issues for inquiries.

---

**الموقع المباشر / Live deployment:** https://dist-mu-taupe-70.vercel.app

**Repository:** https://github.com/alitravians/Ali
