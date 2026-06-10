# مجسمات 3D — ترقية الماب (Blender → Roblox)

هذا المجلد يحتوي مصادر المجسمات الثلاثية المستخدمة في ترقية ماب donation-city.

## المحتوى
- `*_final.py` — سكربتات Blender (Python) تبني كل مجموعة مجسمات من الصفر (أكشاك، أشجار، بالونات، واجهة سينما، بوابة + سور، معدات إنشاء). شغّلها داخل Blender 4.2+ لإعادة توليد النماذج.
- `mcommon.py` — دوال مساعدة مشتركة (مواد، أشكال أساسية، تصدير).
- `fbx/` — ملفات FBX النهائية (22 ملف) المرفوعة لـ Roblox كـ MeshParts.

## خط الإنتاج (Pipeline)
1. توليد/تعديل النماذج في Blender عبر سكربتات `*_final.py` ثم تصدير FBX.
2. رفع ملفات FBX مرة واحدة عبر Roblox Studio (3D Importer) — تأخذ Asset IDs دائمة.
3. التركيب داخل الماب يتم برمجياً عبر `../inject_3d_upgrade.py`:
   - يحذف المجسمات البدائية القديمة (الأكشاك/الأشجار/البالونات).
   - يضع النماذج الجديدة بالمواقع والمقاسات والألوان الصحيحة ويثبّتها (Anchored).
   - يحافظ على عقد سكربت الأكشاك (Body/Sign/Counter داخل DonationBooth_<Tier>).
   - يضيف سكربت `src/CinemaMarquee.server.lua` (وميض اللافتة + تمايل الكشافات).
4. فتح `DonationCity_FINAL.rbxlx` في Studio ثم File → Publish to Roblox → Update existing experience.

## ملاحظات للمطورين
- تحويل المحاور Blender→Roblox: `R.x = -B.x`, `R.y = B.z`, `R.z = B.y` (الدوران مخبوز في الميش).
- مقياس الاستيراد: 1 stud لكل متر Blender؛ عوامل التكبير عند التركيب موثقة داخل `inject_3d_upgrade.py`.
- لإعادة تشغيل الحقن: استرجع نسخة احتياطية من الملف الأصلي ثم شغّل `python3 inject_3d_upgrade.py` (يتطلب `lxml`).
