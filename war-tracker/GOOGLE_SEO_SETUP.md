# 🔍 نشر موقع WarScope على محرك بحث قوقل — Google SEO Setup

## الخطوات التقنية المنجزة ✓

الملفات التالية تم إعدادها مسبقاً وجاهزة:

| الملف | الوظيفة | الحالة |
|-------|---------|--------|
| `public/sitemap.xml` | خريطة الموقع — تعرّف قوقل على كل الصفحات | ✓ جاهز |
| `public/robots.txt` | يسمح لقوقل بفهرسة الموقع (ماعدا /admin) | ✓ جاهز |
| `index.html` | Meta tags + Open Graph + Twitter Card + JSON-LD | ✓ جاهز |
| `src/components/shared/SEO.tsx` | عناوين وأوصاف ديناميكية لكل صفحة | ✓ جاهز |
| `src/main.tsx` | HelmetProvider لإدارة الـ meta tags | ✓ جاهز |
| `src/App.tsx` | DynamicSEO component يتغير مع كل صفحة | ✓ جاهز |

---

## الخطوة المتبقية: تسجيل الموقع بـ Google Search Console

### 1. فتح Google Search Console
- روح على: https://search.google.com/search-console
- سجّل دخول بحساب قوقل

### 2. إضافة الموقع
- اضغط **"Add Property"**
- اختر **"URL Prefix"** (الخيار الأيمن)
- اكتب: `https://dist-mu-taupe-70.vercel.app`
- اضغط **"CONTINUE"**

### 3. التحقق من الملكية (Verification)
اختر طريقة **"HTML tag"**:
- قوقل راح يعطيك كود مثل:
  ```html
  <meta name="google-site-verification" content="XXXXXXXXXX" />
  ```
- أضف هذا الكود في ملف `index.html` داخل `<head>` (بعد سطر `<meta charset="UTF-8" />`)
- ارفع التغيير وانشر:
  ```bash
  cd war-tracker
  git add index.html
  git commit -m "إضافة Google Search Console verification tag"
  git push
  npx vercel deploy --prod --yes
  ```
- ارجع لـ Search Console واضغط **"VERIFY"**

### 4. إرسال خريطة الموقع (Sitemap)
- بعد التحقق، من القائمة اليسار اضغط **"Sitemaps"**
- في خانة "Add a new sitemap" اكتب: `sitemap.xml`
- اضغط **"SUBMIT"**

### 5. طلب الفهرسة (Index Request)
- من القائمة اليسار اضغط **"URL Inspection"**
- اكتب رابط الصفحة الرئيسية: `https://dist-mu-taupe-70.vercel.app/`
- اضغط **"REQUEST INDEXING"**
- كرر العملية لصفحة `/live` و `/analysis` و `/alerts`

---

## متى يظهر الموقع بنتائج قوقل؟
- **بعد التسجيل:** 3-7 أيام لبداية الفهرسة
- **نتائج البحث:** أسابيع إلى شهور حسب المنافسة
- **تحسين الترتيب:** محتوى منتظم + زيارات + روابط خارجية

## نصائح لتحسين الظهور (SEO Tips)
1. شارك رابط الموقع بمواقع التواصل (تويتر، تلقرام، واتساب)
2. أضف محتوى جديد بانتظام
3. تأكد إن الموقع سريع التحميل (Code Splitting موجود ✓)
4. استخدم كلمات مفتاحية عربية بالمحتوى

---

## الروابط المهمة
- **الموقع:** https://dist-mu-taupe-70.vercel.app
- **Sitemap:** https://dist-mu-taupe-70.vercel.app/sitemap.xml
- **Robots.txt:** https://dist-mu-taupe-70.vercel.app/robots.txt
- **Google Search Console:** https://search.google.com/search-console
- **Bing Webmaster (اختياري):** https://www.bing.com/webmasters
