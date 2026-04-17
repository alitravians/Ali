# نظام لوحة تحكم الإشعارات - Emergency Alert Notification System

## نظرة عامة

نظام إشعارات طوارئ متكامل يتكون من:
1. **لوحة تحكم ويب** (Admin Panel) - صفحة ويب لإرسال الإشعارات مع دعم رفع الصور
2. **باكند FastAPI** - سيرفر يتعامل مع Firebase Cloud Messaging (FCM)
3. **تطبيق أندرويد** - يستقبل الإشعارات ويعرض شاشة تنبيه كاملة مع صوت صفارة إنذار

---

## المعمارية (Architecture)

```
┌─────────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   لوحة التحكم       │ ──────> │  FastAPI Backend  │ ──────> │  Firebase FCM   │
│   (Admin Panel)     │  HTTP   │  (Python Server)  │  FCM    │  (Google Cloud) │
│   HTML/CSS/JS       │         │                   │  API    │                 │
└─────────────────────┘         └──────────────────┘         └────────┬────────┘
                                                                      │
                                                                      │ Push Notification
                                                                      │ (Data Message)
                                                                      ▼
                                                              ┌─────────────────┐
                                                              │  تطبيق أندرويد  │
                                                              │  (Android App)  │
                                                              │                 │
                                                              │ ┌─────────────┐ │
                                                              │ │ FCM Service │ │
                                                              │ └──────┬──────┘ │
                                                              │        │        │
                                                              │        ▼        │
                                                              │ ┌─────────────┐ │
                                                              │ │AlertActivity│ │
                                                              │ │ صفارة+صورة │ │
                                                              │ └─────────────┘ │
                                                              └─────────────────┘
```

---

## المكونات

### 1. لوحة التحكم (Admin Panel)

صفحة ويب بسيطة وأنيقة تسمح للمشرف بـ:
- كتابة عنوان ونص التنبيه
- رفع صورة (اختياري) تظهر مع الإشعار
- إرسال التنبيه لجميع المستخدمين بضغطة زر
- حماية بكلمة سر

**الملف:** `fcm-admin/app/main.py` (الصفحة مضمّنة في كود Python)

### 2. الباكند (FastAPI Backend)

سيرفر Python خفيف يحتوي على:

| Endpoint | الوظيفة |
|----------|---------|
| `GET /` | عرض لوحة التحكم (HTML) |
| `POST /api/upload` | رفع صورة وتخزينها على السيرفر |
| `GET /uploads/{filename}` | عرض الصورة المرفوعة |
| `POST /api/send` | إرسال إشعار FCM لجميع المستخدمين |

### 3. تطبيق أندرويد (Android App)

يتكون من 3 ملفات رئيسية:

| الملف | الوظيفة |
|-------|---------|
| `MainActivity.java` | إنشاء قناة الإشعارات + الاشتراك في topic |
| `MyFirebaseMessagingService.java` | استقبال الإشعار + تشغيل شاشة التنبيه |
| `AlertActivity.java` | شاشة تنبيه كاملة مع صفارة + اهتزاز + صورة |

---

## خطوات الإعداد من الصفر

### المتطلبات
- حساب Firebase (مجاني)
- Python 3.12+
- مشروع أندرويد (Capacitor أو Native)

### الخطوة 1: إعداد Firebase

1. أنشئ مشروع في [Firebase Console](https://console.firebase.google.com/)
2. فعّل **Cloud Messaging** من إعدادات المشروع
3. أضف تطبيق أندرويد بـ package name تطبيقك
4. حمّل ملف `google-services.json` وضعه في `android/app/`
5. حمّل **Service Account Key**:
   - اذهب إلى Project Settings > Service Accounts
   - اضغط "Generate New Private Key"
   - حمّل الملف واحفظه كـ `service-account.json`

### الخطوة 2: إعداد الباكند

```bash
# أنشئ مجلد المشروع
mkdir fcm-admin && cd fcm-admin
mkdir -p app uploads

# ضع ملف service-account.json في المجلد الرئيسي
cp /path/to/service-account.json ./
```

**ملف `pyproject.toml`:**
```toml
[project]
name = "app"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi[standard] (>=0.136.0,<0.137.0)",
    "firebase-admin (>=7.4.0,<8.0.0)"
]

[tool.poetry]
packages = [{include = "app", from = "src"}]

[build-system]
requires = ["poetry-core>=2.0.0,<3.0.0"]
build-backend = "poetry.core.masonry.api"
```

**ملف `app/main.py`:**
```python
import os
import uuid
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, messaging

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK
service_account_path = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "service-account.json"
)
cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred)

# كلمة سر لوحة التحكم - غيّرها لكلمة سر قوية
ADMIN_PASSWORD = "your_strong_password_here"

# مجلد الصور المرفوعة
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """عرض الصور المرفوعة"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """رفع صورة وإرجاع اسم الملف"""
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": filename}


@app.post("/api/send")
async def send_notification(
    title: str = Form(...),
    body: str = Form(...),
    password: str = Form(...),
    image_url: str = Form(""),
):
    """إرسال إشعار FCM لجميع المشتركين"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="كلمة السر غير صحيحة")

    try:
        data = {
            "title": title,
            "body": body,
            "type": "siren_alert",
        }
        if image_url:
            data["image"] = image_url

        message = messaging.Message(
            data=data,
            topic="all",  # يرسل لجميع المشتركين في topic "all"
            android=messaging.AndroidConfig(
                priority="high",  # أولوية عالية لضمان الوصول فوراً
                ttl=0,
            ),
        )
        response = messaging.send(message)
        return {"success": True, "message_id": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/", response_class=HTMLResponse)
async def admin_panel():
    """لوحة التحكم - صفحة HTML"""
    return """
    <!-- ضع كود HTML لوحة التحكم هنا -->
    <!-- راجع الكود الكامل في fcm-admin/app/main.py -->
    """
```

### الخطوة 3: إعداد تطبيق أندرويد

#### 3.1 إضافة التبعيات في `build.gradle`

```gradle
dependencies {
    // Firebase
    implementation platform('com.google.firebase:firebase-bom:33.7.0')
    implementation 'com.google.firebase:firebase-messaging'

    // AndroidX (للإشعارات)
    implementation 'androidx.core:core:1.15.0'
}
```

#### 3.2 إعداد `AndroidManifest.xml`

أضف هذه الأذونات:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

أضف داخل `<application>`:
```xml
<!-- شاشة التنبيه الكاملة -->
<activity
    android:name=".AlertActivity"
    android:theme="@android:style/Theme.Translucent.NoTitleBar"
    android:showWhenLocked="true"
    android:turnScreenOn="true"
    android:exported="false" />

<!-- خدمة استقبال الإشعارات -->
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>

<!-- إعدادات قناة الإشعارات -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="fcm_default_channel" />
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@mipmap/ic_launcher" />
```

#### 3.3 ملف `MainActivity.java`

```java
package com.yourpackage.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

// إذا كنت تستخدم Capacitor:
import com.getcapacitor.BridgeActivity;
// أو للتطبيقات العادية:
// import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // إنشاء قناة إشعارات بأولوية عالية
        createHighPriorityNotificationChannel();

        // الاشتراك في topic لاستقبال الإشعارات
        subscribeToAlerts();
    }

    private void subscribeToAlerts() {
        // الاشتراك في topic "all" لاستقبال إشعارات من لوحة التحكم
        FirebaseMessaging.getInstance().subscribeToTopic("all");
    }

    private void createHighPriorityNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            NotificationChannel channel = new NotificationChannel(
                "fcm_default_channel",
                "إشعارات التطبيق",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("إشعارات التطبيق");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 200, 500});
            channel.enableLights(true);
            channel.setShowBadge(true);

            // صوت صفارة إنذار مخصص (اختياري)
            // ضع ملف siren.ogg في android/app/src/main/res/raw/
            Uri sirenUri = Uri.parse(
                "android.resource://" + getPackageName() + "/" + R.raw.siren
            );
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            channel.setSound(sirenUri, audioAttributes);

            manager.createNotificationChannel(channel);
        }
    }
}
```

#### 3.4 ملف `MyFirebaseMessagingService.java`

```java
package com.yourpackage.app;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CHANNEL_ID = "fcm_default_channel";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        String title = "";
        String body = "";
        String imageUrl = "";

        // استخراج البيانات من Data Message
        // (Data Messages تشتغل حتى لو التطبيق في الخلفية)
        if (remoteMessage.getData().size() > 0) {
            title = remoteMessage.getData().get("title");
            body = remoteMessage.getData().get("body");
            String img = remoteMessage.getData().get("image");
            if (img != null) imageUrl = img;
        }

        // احتياطي: استخدام Notification Message (يشتغل في الـ foreground فقط)
        if (remoteMessage.getNotification() != null) {
            if (title == null || title.isEmpty()) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (body == null || body.isEmpty()) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        // تشغيل شاشة التنبيه الكاملة
        Intent alertIntent = new Intent(this, AlertActivity.class);
        alertIntent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP
        );
        alertIntent.putExtra("title", title != null ? title : "");
        alertIntent.putExtra("body", body != null ? body : "");
        alertIntent.putExtra("image", imageUrl);

        PendingIntent fullScreenIntent = PendingIntent.getActivity(
            this, 0, alertIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // بناء الإشعار
        Uri sirenUri = Uri.parse(
            "android.resource://" + getPackageName() + "/" + R.raw.siren
        );

        NotificationCompat.Builder builder =
            new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setSound(sirenUri)
                .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000})
                .setAutoCancel(true)
                .setFullScreenIntent(fullScreenIntent, true);

        // إضافة صورة كبيرة في الإشعار (Big Picture)
        if (imageUrl != null && !imageUrl.isEmpty()) {
            try {
                URL url = new URL(imageUrl);
                HttpURLConnection connection =
                    (HttpURLConnection) url.openConnection();
                connection.setDoInput(true);
                connection.connect();
                InputStream input = connection.getInputStream();
                Bitmap bitmap = BitmapFactory.decodeStream(input);
                if (bitmap != null) {
                    builder.setStyle(
                        new NotificationCompat.BigPictureStyle()
                            .bigPicture(bitmap)
                            .bigLargeIcon((Bitmap) null)
                    );
                    builder.setLargeIcon(bitmap);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        NotificationManager manager =
            (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(9999, builder.build());
        }

        // تشغيل شاشة التنبيه مباشرة (للتطبيق في الـ foreground)
        startActivity(alertIntent);
    }
}
```

#### 3.5 ملف `AlertActivity.java`

```java
package com.yourpackage.app;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaPlayer;
import android.media.AudioManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AlertActivity extends Activity {

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // عرض فوق شاشة القفل
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        );

        setContentView(R.layout.activity_alert);

        // عرض العنوان والنص
        String title = getIntent().getStringExtra("title");
        String body = getIntent().getStringExtra("body");

        TextView alertTitle = findViewById(R.id.alertTitle);
        TextView alertBody = findViewById(R.id.alertBody);

        if (title != null && !title.isEmpty()) alertTitle.setText(title);
        if (body != null && !body.isEmpty()) alertBody.setText(body);

        // تحميل وعرض الصورة (إذا موجودة)
        String imageUrl = getIntent().getStringExtra("image");
        if (imageUrl != null && !imageUrl.isEmpty()) {
            ImageView alertImage = findViewById(R.id.alertImage);
            ExecutorService executor = Executors.newSingleThreadExecutor();
            Handler handler = new Handler(Looper.getMainLooper());
            executor.execute(() -> {
                try {
                    URL url = new URL(imageUrl);
                    HttpURLConnection connection =
                        (HttpURLConnection) url.openConnection();
                    connection.setDoInput(true);
                    connection.connect();
                    InputStream input = connection.getInputStream();
                    Bitmap bitmap = BitmapFactory.decodeStream(input);
                    handler.post(() -> {
                        alertImage.setImageBitmap(bitmap);
                        alertImage.setVisibility(View.VISIBLE);
                    });
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        // تشغيل صوت الصفارة
        // ضع ملف siren.ogg في android/app/src/main/res/raw/
        mediaPlayer = MediaPlayer.create(this, R.raw.siren);
        if (mediaPlayer != null) {
            mediaPlayer.setLooping(true);
            mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
            mediaPlayer.start();
        }

        // اهتزاز قوي متكرر
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        if (vibrator != null) {
            long[] pattern = {0, 1000, 500, 1000, 500, 1000};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(
                    VibrationEffect.createWaveform(pattern, 0)
                );
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }

        // زر الإغلاق
        Button dismissButton = findViewById(R.id.dismissButton);
        dismissButton.setOnClickListener(v -> {
            stopAlarm();
            finish();
        });
    }

    private void stopAlarm() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
        if (vibrator != null) {
            vibrator.cancel();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAlarm();
    }
}
```

#### 3.6 ملف التخطيط `activity_alert.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#CC000000"
    android:gravity="center">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_centerInParent="true"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="32dp">

        <!-- أيقونة التطبيق -->
        <ImageView
            android:layout_width="80dp"
            android:layout_height="80dp"
            android:src="@mipmap/ic_launcher"
            android:layout_marginBottom="24dp" />

        <!-- عنوان التنبيه -->
        <TextView
            android:id="@+id/alertTitle"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="تنبيه هام!"
            android:textColor="#FFFFFF"
            android:textSize="28sp"
            android:textStyle="bold"
            android:layout_marginBottom="16dp" />

        <!-- نص التنبيه -->
        <TextView
            android:id="@+id/alertBody"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:textColor="#DDDDDD"
            android:textSize="18sp"
            android:gravity="center"
            android:layout_marginBottom="16dp" />

        <!-- صورة الإشعار (مخفية افتراضياً) -->
        <ImageView
            android:id="@+id/alertImage"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:adjustViewBounds="true"
            android:maxHeight="250dp"
            android:scaleType="centerCrop"
            android:visibility="gone"
            android:layout_marginBottom="24dp" />

        <!-- زر الإغلاق -->
        <Button
            android:id="@+id/dismissButton"
            android:layout_width="200dp"
            android:layout_height="wrap_content"
            android:text="حسناً"
            android:textSize="18sp"
            android:textColor="#FFFFFF"
            android:backgroundTint="#4CAF50"
            android:padding="12dp" />

    </LinearLayout>
</RelativeLayout>
```

---

## إنشاء صوت الصفارة

يمكنك إنشاء ملف صوت صفارة إنذار باستخدام Python:

```python
import numpy as np
import soundfile as sf

sample_rate = 44100
duration = 4  # ثواني

t = np.linspace(0, duration, int(sample_rate * duration), False)

# صوت صفارة إنذار (تردد متغير بين 800 و 1400 هرتز)
frequency = 800 + 600 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.5 * t))
siren = 0.8 * np.sin(2 * np.pi * frequency * t)

# حفظ كملف OGG
sf.write('siren.ogg', siren, sample_rate, format='OGG', subtype='VORBIS')
```

ضع ملف `siren.ogg` في:
```
android/app/src/main/res/raw/siren.ogg
```

---

## النشر (Deployment)

### نشر الباكند على Fly.io

```bash
# تثبيت Fly CLI
curl -L https://fly.io/install.sh | sh

# تسجيل الدخول
fly auth login

# إنشاء التطبيق
fly launch

# النشر
fly deploy
```

### نشر على أي سيرفر آخر

```bash
# تثبيت التبعيات
pip install fastapi[standard] firebase-admin python-multipart

# تشغيل السيرفر
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## ملاحظات مهمة

### Data Messages vs Notification Messages

| النوع | في الـ Foreground | في الـ Background | مَن يتعامل معه |
|-------|-------------------|-------------------|----------------|
| **Data Message** | يشتغل | يشتغل | كود التطبيق (onMessageReceived) |
| **Notification Message** | يشتغل | النظام يعرضه تلقائي | نظام أندرويد |

**نستخدم Data Messages** لأنها تشتغل في كل الحالات ونقدر نتحكم فيها بالكامل.

### Topic Subscription

- التطبيق يشترك تلقائياً في topic `"all"` عند أول فتح
- لوحة التحكم ترسل لـ topic `"all"` فيوصل لجميع المستخدمين
- ممكن تضيف topics مختلفة لمجموعات مختلفة من المستخدمين

### الأمان

- لوحة التحكم محمية بكلمة سر
- ملف `service-account.json` يجب أن **لا يُرفع على GitHub**
- أضف `service-account.json` إلى `.gitignore`

### صوت الصفارة

- يشتغل بأقصى مستوى صوت (STREAM_ALARM)
- يتجاوز وضع الصامت
- يستمر حتى المستخدم يضغط "حسناً"

---

## البنية الكاملة للملفات

```
المشروع/
├── fcm-admin/                          # الباكند
│   ├── app/
│   │   └── main.py                     # السيرفر + لوحة التحكم
│   ├── uploads/                        # مجلد الصور المرفوعة
│   ├── service-account.json            # مفتاح Firebase (لا ترفعه على GitHub!)
│   └── pyproject.toml                  # تبعيات Python
│
├── android/app/src/main/
│   ├── java/com/yourpackage/app/
│   │   ├── MainActivity.java           # إعداد القناة + الاشتراك
│   │   ├── MyFirebaseMessagingService.java  # استقبال الإشعارات
│   │   └── AlertActivity.java          # شاشة التنبيه الكاملة
│   ├── res/
│   │   ├── layout/
│   │   │   └── activity_alert.xml      # تخطيط شاشة التنبيه
│   │   └── raw/
│   │       └── siren.ogg               # صوت الصفارة
│   └── AndroidManifest.xml             # الأذونات والإعدادات
```

---

## التخصيص

### تغيير صوت الصفارة
استبدل ملف `siren.ogg` بأي ملف صوتي بصيغة OGG

### تغيير تصميم شاشة التنبيه
عدّل ملف `activity_alert.xml` لتغيير الألوان والأحجام والتخطيط

### إضافة topics مختلفة
```java
// في MainActivity.java
FirebaseMessaging.getInstance().subscribeToTopic("teachers");
FirebaseMessaging.getInstance().subscribeToTopic("students");
```

```python
# في الباكند
message = messaging.Message(
    data=data,
    topic="teachers",  # أرسل للمعلمين فقط
)
```

### إضافة حقول إضافية
أضف حقول جديدة في `data` dict بالباكند واستخرجها في `onMessageReceived` بالأندرويد

---

## المراجع

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Android Notification Guide](https://developer.android.com/develop/ui/views/notifications)
- [Full-Screen Intent Documentation](https://developer.android.com/reference/android/app/Notification.Builder#setFullScreenIntent)
