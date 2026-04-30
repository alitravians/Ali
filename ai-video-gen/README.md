# AI Video Gen — موقع توليد فيديوهات قصيرة بالذكاء الاصطناعي

موقع مجاني ١٠٠٪ لتوليد فيديوهات قصيرة (5 / 10 / 15 ثانية) من وصف نصي بالعربي أو
الإنجليزي.

## كيف يعمل؟

1. المستخدم يكتب وصف المشهد ويختار المدة والأسلوب الفني.
2. الخادم يستدعي [Pollinations.ai](https://image.pollinations.ai) (مجاني، بدون
   مفتاح API) لتوليد عدة إطارات (keyframes) متنوعة من زوايا كاميرا مختلفة.
3. متصفح المستخدم يجمّع الإطارات في فيديو MP4 باستخدام
   [`@ffmpeg/ffmpeg`](https://github.com/ffmpegwasm/ffmpeg.wasm) مع:
   - حركة كاميرا (Ken Burns / zoompan)
   - انتقالات تلاشٍ (xfade)
   - 720p @ 24fps
4. الفيديو يُحفظ محلياً في معرض المستخدم (localStorage) ويمكن تحميله أو مشاركته.

## التقنيات

- **Next.js 14** (App Router, Edge runtime لمسارات الـ API)
- **TypeScript** + **Tailwind CSS**
- **Pollinations.ai** لتوليد الصور (مجاني)
- **FFmpeg WebAssembly** لتجميع الفيديو في المتصفح (لا تكلفة على الخادم)
- **Vercel** للاستضافة

## التشغيل محلياً

```bash
npm install
npm run dev
```

ثم افتح http://localhost:3000.

## النشر

النشر على Vercel جاهز out-of-the-box بلا أي إعداد إضافي. الموقع يستخدم النواة
أحادية الخيط من `@ffmpeg/core@0.12.10` التي **لا تتطلب** `SharedArrayBuffer`،
لذلك لا حاجة لترويسات `COOP/COEP` على الخادم. تم اختبار خط الأنابيب الكامل
على Vercel (Pollinations → ffmpeg.wasm → MP4) بدون عزل cross-origin.

> ملاحظة: لو احتجنا مستقبلاً للنواة متعددة الخيوط (`ffmpeg-core-mt`)، سيلزمنا
> ضبط `Cross-Origin-Embedder-Policy: credentialless` (وليس `require-corp`،
> لأن ذلك سيكسر تحميل صور Pollinations التي لا ترسل ترويسات `CORP`).

## القيود

- جودة الفيديو تعتمد على Pollinations.ai (نمط الصور المتولدة).
- المعالجة تتم في متصفح المستخدم — قد تستغرق 20-90 ثانية حسب جهازه.
- يحتاج المتصفح أن يدعم WebAssembly (متوفر في كل المتصفحات الحديثة).

## الترخيص

MIT
