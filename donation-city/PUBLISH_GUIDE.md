# دليل النشر التلقائي — Roblox Auto-Publish Guide

## المحتويات
- [ما هو publish.py؟](#ما-هو-publishpy)
- [المتطلبات](#المتطلبات)
- [الخطوة 1: إنشاء API Key من روبلوكس](#الخطوة-1-إنشاء-api-key-من-روبلوكس)
- [الخطوة 2: تثبيت الأدوات](#الخطوة-2-تثبيت-الأدوات)
- [الخطوة 3: إعداد المتغيرات](#الخطوة-3-إعداد-المتغيرات)
- [الخطوة 4: تخصيص publish.py للعبتك](#الخطوة-4-تخصيص-publishpy-للعبتك)
- [الاستخدام](#الاستخدام)
- [كيف يعمل السكربت (شرح تقني)](#كيف-يعمل-السكربت-شرح-تقني)
- [استكشاف الأخطاء](#استكشاف-الأخطاء)
- [نصائح للمبرمجين](#نصائح-للمبرمجين)

---

## ما هو publish.py؟

سكربت Python يقوم بـ **5 خطوات تلقائية** لنشر لعبتك على Roblox:

```
فحص الكود (Lint) → بناء المكان (.rbxlx) → تطبيع ContentId القديم → تحويل إلى .rbxl ثنائي نظيف → رفع على Roblox API
```

**الفائدة:** بدل ما تفتح Roblox Studio وتضغط Publish يدوياً، تكتب أمر واحد وخلاص:
```bash
python3 publish.py
```

السبب الأساسي لهذا المسار هو أن ملف المكان لدينا عبارة عن ملف `rbxlx` مركّب من عمليات حقن كثيرة عبر الزمن، وفيه خصائص قديمة وغير متناسقة في الأنواع.  
Roblox Studio يصلّح هذه الفروقات تلقائياً عند فتح الملف وإعادة حفظه، لكن Open Cloud كان يرفع الملف الخام كما هو، وهذا كان يسبب تعطل تشغيل السيرفرات وظهور رسالة **"Waiting for an available server"**.  
الحل الحالي هو محاكاة سلوك Studio: نطبّع القيم القديمة أولاً، ثم نحول الملف إلى **.rbxl ثنائي** نظيف قبل الرفع.

---

## المتطلبات

| الأداة | الغرض | رابط التثبيت |
|--------|--------|-------------|
| Python 3.8+ | تشغيل السكربت | [python.org](https://www.python.org/downloads/) |
| selene | فحص أخطاء Lua/Luau | [github.com/Kampfkarren/selene](https://github.com/Kampfkarren/selene/releases) |
| luau-analyze (اختياري) | تحليل أنواع Luau | [github.com/luau-lang/luau](https://github.com/luau-lang/luau/releases) |
| Rust + cargo | بناء أداة التحويل من rbxlx إلى rbxl | [rustup.rs](https://rustup.rs/) |
| Roblox API Key | صلاحية النشر | [create.roblox.com](https://create.roblox.com/dashboard/credentials) |

## هيكل الأدوات

- `tools/normalize_rbxlx.py`  
  سكربت Python يعالج القيم القديمة من نوع ContentId ويحوّلها إلى الصيغة الحديثة قبل التحويل.

- `tools/rbxlx2rbxl/`  
  مشروع Rust مستقل يحوّل `rbxlx` المنظَّم إلى ملف `rbxl` ثنائي نظيف، ويطبّق تطبيع الأنواع من خلال Reflection Database.

---

## الخطوة 1: إنشاء API Key من روبلوكس

### 1.1 — افتح صفحة الـ Credentials:
```
https://create.roblox.com/dashboard/credentials
```

### 1.2 — اضغط "Create API Key":
- **Name:** سمّه أي اسم (مثلاً `AutoPublish`)
- **Access Permissions:**
  - اختر API System: **universe-places**
  - اختر التجربة (Experience) حقتك
  - فعّل **Write** (مهم جداً!)
- **Security:**
  - IP Address: اكتب `0.0.0.0/0` واضغط **Add IP Address**
  - (هذا يسمح بالنشر من أي جهاز — لو تبي أمان أكثر حط IP جهازك بس)

### 1.3 — اضغط "Save & Generate Key"
- **انسخ الـ Key فوراً** — ما بيظهر مرة ثانية!
- احفظه بمكان آمن (مثل ملف `.env` أو مدير كلمات المرور)

> ⚠️ **تحذير:** لا تحط الـ API Key بالكود أبداً! استخدم Environment Variable.

---

## الخطوة 2: تثبيت الأدوات

### على Linux/Mac:
```bash
# selene
curl -L https://github.com/Kampfkarren/selene/releases/latest/download/selene-light-linux.zip -o selene.zip
unzip selene.zip && chmod +x selene && sudo mv selene /usr/local/bin/

# luau-analyze (اختياري)
curl -L https://github.com/luau-lang/luau/releases/latest/download/luau-ubuntu.zip -o luau.zip
unzip luau.zip && chmod +x luau-analyze && sudo mv luau-analyze /usr/local/bin/
```

### على Windows:
```powershell
# selene — حمّل من: https://github.com/Kampfkarren/selene/releases
# اختر selene-light-windows.zip → فكّه → حط selene.exe بمجلد بالـ PATH

# luau-analyze — حمّل من: https://github.com/luau-lang/luau/releases
# اختر luau-windows.zip → فكّه → حط luau-analyze.exe بمجلد بالـ PATH
```

### التحقق من التثبيت:
```bash
selene --version        # المفروض يظهر: selene 0.x.x
luau-analyze --version  # المفروض يظهر: Luau analyzer 0.x.x
python3 --version       # المفروض يظهر: Python 3.8+
```

---

## الخطوة 3: إعداد المتغيرات

### الطريقة 1: Environment Variable (مؤقت — بالتيرمنل):
```bash
export ROBLOX_PUBLISH_API_KEY="your-api-key-here"
python3 publish.py
```

### الطريقة 2: ملف `.env` (دائم — بالمشروع):

أنشئ ملف `.env` بنفس مجلد `publish.py`:
```env
ROBLOX_PUBLISH_API_KEY=your-api-key-here
```

ثم حمّله قبل التشغيل:
```bash
source .env && python3 publish.py
```

> ⚠️ **مهم:** أضف `.env` لملف `.gitignore` عشان ما ينرفع على GitHub!

### الطريقة 3: GitHub Actions Secret (للـ CI/CD):
```yaml
# .github/workflows/publish.yml
name: Auto Publish
on:
  push:
    branches: [main]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt  # لو عندك dependencies
      - run: python3 donation-city/publish.py
        env:
          ROBLOX_PUBLISH_API_KEY: ${{ secrets.ROBLOX_PUBLISH_API_KEY }}
```

---

## الخطوة 4: تخصيص publish.py للعبتك

افتح `publish.py` وعدّل هالسطور الثلاث:

```python
# --- Configuration ---
UNIVERSE_ID = "10237943037"          # ← غيّره لـ Universe ID حق لعبتك
PLACE_ID = "134706113896132"         # ← غيّره لـ Place ID حق لعبتك
RBXLX_FILE = "DonationCity_FINAL.rbxlx"  # ← غيّره لاسم ملف لعبتك
```

### كيف تلقى الـ IDs:
1. افتح لعبتك بـ Roblox Studio
2. **Universe ID:** من File → Game Settings → Security → Copy Universe ID
3. **Place ID:** من الـ URL لما تفتح لعبتك بالمتصفح:
   ```
   https://www.roblox.com/games/PLACE_ID/game-name
   ```
4. أو من [create.roblox.com](https://create.roblox.com) → اضغط على لعبتك → شوف الـ URL

---

## الاستخدام

```bash
cd donation-city/   # أو مجلد لعبتك

# النشر الكامل: فحص + بناء + نشر
python3 publish.py

# فحص الكود فقط (بدون نشر)
python3 publish.py --lint-only

# نشر بدون فحص (لو الكود مفحوص مسبقاً)
python3 publish.py --skip-lint
```

### مثال على الخرج الناجح:
```
=== STEP 1: Linting Luau sources ===
Found 27 Lua files

Running selene...
  selene: 0 errors, 52 warnings (non-blocking)

Running luau-analyze...
  luau-analyze: 0 errors, 18 warnings (non-blocking)

Lint passed! All files are clean.

=== STEP 2: Building (injecting sources) ===
Build complete.

=== STEP 3: Normalizing legacy ContentId props ===
string->Content: 271, url->uri: 45
  wrote build/normalized.rbxlx (6,606,594 bytes)

=== STEP 4: Converting normalized rbxlx to binary rbxl ===
coerced properties: 3472
  ImageLabel::BackgroundColor3: Color3uint8->Color3: 1
  UnionOperation::AssetId: String->ContentId: 92
  ...
  dropped properties: 0
  wrote build/DonationCity_FINAL.rbxl (699,465 bytes)

=== STEP 5: Publishing to Roblox ===
  Uploading build/DonationCity_FINAL.rbxl (699,465 bytes)...
  Universe: 10237943037 | Place: 134706113896132

  Published successfully! Version: 335

=== Pipeline complete! ===
```

---

## كيف يعمل السكربت (شرح تقني)

### الخطوة 1: فحص الكود (Lint)
```python
def lint():
    # يبحث عن كل ملفات .lua بمجلد src/
    # يشغّل selene (يكشف bugs شائعة بـ Lua)
    # يشغّل luau-analyze (يكشف أخطاء الأنواع)
    # يتوقف فقط عند أخطاء فعلية (errors) — التحذيرات (warnings) ما توقف النشر
```

**مهم:** السكربت يفرّق بين:
- **Errors (أخطاء):** توقف النشر ❌ — لازم تصلّحها
- **Warnings (تحذيرات):** ما توقف النشر ⚠️ — تقدر تتجاهلها

### الخطوة 2: بناء الملف (Build)
```python
def build():
    # يشغّل build_all.py اللي يحقن الكود المحدّث داخل ملف .rbxlx
    # (لو ما عندك build_all.py، احذف هالخطوة أو عدّلها حسب مشروعك)
```

### الخطوة 3: تطبيع الـ ContentId القديم
```python
def normalize_content_id_props():
    # يشغّل tools/normalize_rbxlx.py
    # يحوّل <string> و <Content><url> القديمة إلى صيغة <Content><uri>/<null>
    # حتى parser الحديث يقرأ الملف كامل بدون أخطاء
```

### الخطوة 4: التحويل إلى .rbxl ثنائي
```python
def convert_to_binary():
    # يشغّل tools/rbxlx2rbxl/target/release/rbxlx2rbxl
    # الأداة تمر على كل Instance و Property
    # ثم توحّد الأنواع بحسب Reflection Database
    # وبعدها تكتب ملف .rbxl ثنائي نظيف
```

### الخطوة 5: الرفع على Roblox
```python
def publish():
    # يقرأ الـ API Key من Environment Variable
    # يرسل ملف .rbxl كـ POST request للـ Roblox Open Cloud API
    # Content-Type لازم يكون application/octet-stream
    # يطبع رقم النسخة الجديدة لو نجح
```

**الـ API Endpoint:**
```
POST https://apis.roblox.com/universes/v1/{UNIVERSE_ID}/places/{PLACE_ID}/versions?versionType=Published
```

**الـ Headers المطلوبة:**
```
x-api-key: YOUR_API_KEY
Content-Type: application/octet-stream
Content-Length: FILE_SIZE_IN_BYTES
```

---

## استكشاف الأخطاء

### Error: "ROBLOX_PUBLISH_API_KEY environment variable not set"
```bash
# تأكد إنك ضبطت المتغير:
echo $ROBLOX_PUBLISH_API_KEY
# لو فاضي:
export ROBLOX_PUBLISH_API_KEY="your-key-here"
```

### Error: "HTTP 400 — Invalid Content stream"
```
✓ سببها: الملف يبدأ بـ <?xml version='1.0' ...?>
✓ الحل: السكربت يشيلها تلقائياً (الخطوة 4)
✓ لو المشكلة مستمرة: تأكد إن الملف يبدأ بـ <roblox version="4">
```

### Error: "HTTP 401 — Unauthorized"
```
✓ الـ API Key منتهي الصلاحية أو خطأ
✓ الحل: أنشئ key جديد من create.roblox.com/dashboard/credentials
```

### Error: "HTTP 403 — Forbidden"
```
✓ الـ API Key ما عنده صلاحية Write
✓ الحل: تأكد إنك فعّلت universe-places → Write على التجربة حقتك
```

### Error: "HTTP 404 — Not Found"
```
✓ الـ Universe ID أو Place ID غلط
✓ الحل: تأكد من الأرقام بإعدادات اللعبة
```

### Error: "selene not found on PATH"
```
✓ selene مو مثبّت
✓ الحل: ثبّته من https://github.com/Kampfkarren/selene/releases
```

### Lint يفشل بأخطاء كثيرة:
```
✓ لو الأخطاء من نوع "unknown global" (مثل game, workspace, script):
  أنشئ ملف selene.toml بالمجلد:
    [config]
    std = "roblox"
  وملف roblox.yml من:
    https://raw.githubusercontent.com/JohnnyMorganz/StyLua/main/tests/inputs/roblox.yml
```

---

## نصائح للمبرمجين

### 1. اربط السكربت بـ Git Hook (نشر تلقائي عند كل push):
```bash
# .git/hooks/post-commit
#!/bin/bash
cd donation-city && python3 publish.py
```

### 2. أضف selene.toml لمشروعك عشان يعرف globals حق روبلوكس:
```toml
# selene.toml
[config]
std = "roblox"
```

### 3. أنشئ ملف .gitignore يحمي الـ secrets:
```gitignore
.env
*.rbxl
```

### 4. لو تبي تنشر بصيغة `.rbxl` (binary) بدل `.rbxlx` (XML):
- غيّر `RBXLX_FILE` لاسم ملف الـ `.rbxl`
- شيل خطوة `validate_xml()` و `strip_xml_declaration()` (ما تنطبق على binary)

### 5. نسخة مبسّطة (بدون build/lint — نشر فقط):
```python
#!/usr/bin/env python3
"""نسخة مبسّطة — ترفع ملف .rbxlx مباشرة على Roblox."""
import os, sys, json, urllib.request

UNIVERSE_ID = "YOUR_UNIVERSE_ID"   # ← غيّره
PLACE_ID = "YOUR_PLACE_ID"         # ← غيّره
RBXLX_FILE = "YourGame.rbxlx"     # ← غيّره

API_URL = f"https://apis.roblox.com/universes/v1/{UNIVERSE_ID}/places/{PLACE_ID}/versions?versionType=Published"

api_key = os.environ.get("ROBLOX_PUBLISH_API_KEY")
if not api_key:
    sys.exit("ERROR: Set ROBLOX_PUBLISH_API_KEY environment variable")

# إزالة XML declaration لو موجودة
with open(RBXLX_FILE, "r", encoding="utf-8") as f:
    content = f.read()
if content.startswith("<?xml"):
    content = content[content.index("\n") + 1:]
    with open(RBXLX_FILE, "w", encoding="utf-8") as f:
        f.write(content)

# رفع الملف
with open(RBXLX_FILE, "rb") as f:
    data = f.read()

req = urllib.request.Request(API_URL, data=data, method="POST", headers={
    "x-api-key": api_key,
    "Content-Type": "application/octet-stream",
    "Content-Length": str(len(data)),
})

try:
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode())
        print(f"Published! Version: {body.get('versionNumber', '?')}")
except urllib.error.HTTPError as e:
    print(f"FAILED (HTTP {e.code}): {e.read().decode()}")
    sys.exit(1)
```

---

## الروابط المهمة

| الرابط | الوصف |
|--------|-------|
| [Roblox Open Cloud API Docs](https://create.roblox.com/docs/cloud/open-cloud/usage-place-publishing) | التوثيق الرسمي للنشر عبر API |
| [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials) | إنشاء/إدارة API Keys |
| [selene GitHub](https://github.com/Kampfkarren/selene) | أداة فحص Lua/Luau |
| [luau-lang GitHub](https://github.com/luau-lang/luau) | محلّل أنواع Luau الرسمي |

---

## الترخيص

هذا السكربت مفتوح المصدر — استخدمه وعدّله كيفما تشاء لمشاريعك.

---

*تم إنشاؤه لمشروع **مدينة شهد** (Donation City) — بواسطة Devin AI*
