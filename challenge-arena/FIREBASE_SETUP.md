# دليل إعداد Firebase لموقع أرض التحديات

## الخطوة 1: إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اضغط على "Add project" أو "إضافة مشروع"
3. أدخل اسم المشروع: `challenge-arena` أو أي اسم تريده
4. اختر الخطة المجانية (Spark Plan)
5. أكمل خطوات الإنشاء

## الخطوة 2: تفعيل Realtime Database

1. من القائمة الجانبية، اختر "Build" ثم "Realtime Database"
2. اضغط على "Create Database"
3. اختر الموقع الأقرب لك (مثلاً: europe-west1)
4. اختر "Start in test mode" للبداية
5. اضغط "Enable"

## الخطوة 3: تعديل قواعد الأمان

في صفحة Realtime Database، اذهب إلى تبويب "Rules" وضع هذه القواعد:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **ملاحظة:** هذه القواعد للتطوير فقط. للإنتاج، يجب تحسين الأمان.

## الخطوة 4: الحصول على بيانات التكوين

1. اذهب إلى إعدادات المشروع (أيقونة الترس ⚙️ بجانب "Project Overview")
2. في تبويب "General"، انزل إلى قسم "Your apps"
3. اضغط على أيقونة الويب `</>`
4. سجل التطبيق باسم "Challenge Arena"
5. انسخ بيانات `firebaseConfig`

ستحصل على شيء مثل:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## الخطوة 5: إضافة البيانات للموقع

أنشئ ملف `.env` في المجلد الرئيسي للمشروع وأضف:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## الخطوة 6: إعادة البناء والنشر

بعد إضافة ملف `.env`:

```bash
npm run build
```

ثم أعد نشر الموقع.

## البنية الأساسية للبيانات

سيتم إنشاء هذه البنية تلقائياً عند الاستخدام:

```
challenge-arena/
├── opponents/
│   └── {id}/
│       ├── name1: "اسم الخصم الأول"
│       ├── name2: "اسم الخصم الثاني"
│       ├── avatar1: "رابط الصورة"
│       ├── avatar2: "رابط الصورة"
│       └── dateTime: "2025-01-01T20:00"
│
├── challengeRequests/
│   └── {id}/
│       ├── opponent1: "اسم الخصم الأول"
│       ├── opponent2: "اسم الخصم الثاني"
│       ├── dateTime: "2025-01-01T20:00"
│       ├── trackingCode: "ABC12345"
│       ├── status: "pending|approved|rejected"
│       ├── submittedAt: "timestamp"
│       └── rejectionReason: "السبب" (إذا كان مرفوض)
│
├── approvedChallenges/
│   └── {id}/
│       ├── opponent1: "اسم الخصم الأول"
│       ├── opponent2: "اسم الخصم الثاني"
│       ├── opponent1Avatar: "رابط الصورة"
│       ├── opponent2Avatar: "رابط الصورة"
│       ├── dateTime: "2025-01-01T20:00"
│       ├── approvedAt: "timestamp"
│       └── result: "اسم الفائز" (بعد انتهاء التحدي)
│
└── siteSettings/
    ├── isOpen: true|false
    └── closureReason: "سبب الإغلاق"
```

## استكشاف الأخطاء

### خطأ: "Firebase: Error (auth/invalid-api-key)"
- تأكد من صحة API Key في ملف `.env`
- تأكد من أن الملف يبدأ بـ `VITE_`

### خطأ: "PERMISSION_DENIED"
- تأكد من قواعد الأمان في Realtime Database
- تأكد من أن `.read` و `.write` مضبوطين على `true`

### البيانات لا تظهر
- افتح Firebase Console وتحقق من البيانات يدوياً
- تأكد من أن `databaseURL` صحيح
- افتح Developer Console في المتصفح وتحقق من الأخطاء

## الأمان للإنتاج

عند الانتقال للإنتاج، استخدم قواعد أمان أفضل:

```json
{
  "rules": {
    "opponents": {
      ".read": true,
      ".write": false
    },
    "challengeRequests": {
      ".read": true,
      ".write": true,
      "$requestId": {
        ".validate": "newData.hasChildren(['opponent1', 'opponent2', 'dateTime', 'trackingCode'])"
      }
    },
    "approvedChallenges": {
      ".read": true,
      ".write": false
    },
    "siteSettings": {
      ".read": true,
      ".write": false
    }
  }
}
```

## الدعم

إذا واجهت أي مشاكل، تحقق من:
- [Firebase Documentation](https://firebase.google.com/docs/database)
- [Firebase Console](https://console.firebase.google.com/)
