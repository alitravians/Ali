# أرض التحديات - Challenge Arena

منصة التحديات الرسمية - تابع التحديات المباشرة وقدم طلبك للمشاركة

## المميزات

- 🌐 دعم اللغتين العربية والإنجليزية
- 📋 سجل التحديات مع عرض البنرات
- 📝 نموذج تقديم طلب تحدي رسمي
- 🔍 نظام تتبع الطلبات بكود مراجعة
- ⏱️ عرض مباشر للتحديات مع عداد تنازلي 10 دقائق
- 👨‍💼 لوحة تحكم إدارية شاملة (رمز الدخول: 3131)
- 🔒 إمكانية فتح/إغلاق الموقع مع ذكر السبب
- 🏆 إدارة نتائج التحديات

## إعداد Firebase

1. قم بإنشاء مشروع جديد على [Firebase Console](https://console.firebase.google.com/)
2. فعّل Realtime Database
3. انسخ بيانات التكوين من إعدادات المشروع
4. أنشئ ملف `.env` في المجلد الرئيسي وأضف البيانات:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. قم بتحديث قواعد الأمان في Firebase Realtime Database:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

## التثبيت والتشغيل

```bash
# تثبيت المكتبات
npm install

# تشغيل الخادم المحلي
npm run dev

# بناء المشروع للنشر
npm run build
```

## لوحة التحكم الإدارية

- رمز الدخول: **3131**
- الوظائف:
  - إدارة الخصوم
  - مراجعة طلبات التحديات
  - توليد البنرات تلقائياً
  - إدارة نتائج التحديات
  - فتح/إغلاق الموقع

## البنية التقنية

- React + Vite
- Tailwind CSS
- Firebase Realtime Database
- Lucide React Icons
