<!--
شكراً لمساهمتك! اختر القسم المناسب أدناه واملأ الحقول.
For non-BOON PRs (chat-platform, war-tracker, etc.) you can delete this template and describe your changes freely.
-->

## نوع الـ PR

- [ ] BOON Plugin جديد
- [ ] BOON Plugin: إصلاح / تحسين
- [ ] BOON Core / Framework
- [ ] توثيق
- [ ] غير ذلك

---

## وصف التغيير

<!-- ماذا أضفت أو غيّرت؟ سطر أو سطرين. -->

## لماذا؟

<!-- ما المشكلة التي يحلّها هذا التغيير، أو ما القيمة المضافة للمستخدمين؟ -->

## كيف اختبرت محلياً؟

- [ ] `npm run typecheck` ينتهي بصفر أخطاء
- [ ] `npm run build` يُنتج الـ targets الثلاثة بدون أخطاء
- [ ] جرّبت الـ userscript في Tampermonkey على Discord Web
- [ ] جرّبت الـ extension في Chrome مع `chrome://extensions` (إن وُجد)

## لقطات شاشة / فيديو

<!-- مرفقات اختيارية. مهمة جداً للـ plugins التي تضيف UI. -->

---

## فحص الأمان (مطلوب لكل plugin جديد)

- [ ] الـ plugin لا يستخدم `eval` أو `new Function`
- [ ] الـ plugin لا يحمّل scripts من خوادم خارجية في runtime
- [ ] الـ plugin لا يرسل token المستخدم لأي طرف ثالث
- [ ] الـ plugin لا يحفظ بيانات حساسة (passwords/tokens) في localStorage
- [ ] إذا كان الـ plugin يستدعي API خارجي، يلزم مفتاح من المستخدم وخيار تعطيل صريح
- [ ] كل listeners و styles مُسجَّلة عبر `ctx.*` (لتُنظَّف تلقائياً عند الإيقاف)

### إذا الـ plugin يتصل بـ API خارجي

<!-- مثال: Gemini, Google Translate, OpenAI, custom server -->
- اسم الـ API:
- ما البيانات التي تُرسَل؟
- مفتاح API يُحفظ في إعدادات المستخدم؟ (نعم/لا)

---

## Checklist عام

- [ ] الكود يتبع TypeScript strict (لا `any`)
- [ ] labels / descriptions / toasts بالعربية
- [ ] استخدمت `as const satisfies SettingsSchema` لتعريف schema
- [ ] الإضافة لا تكسر BOON إذا فشلت (error boundaries جاهزة عبر الـ framework)
- [ ] رفعت التغييرات إلى branch خاص (مش main)
- [ ] رسالة الـ commit بصيغة `feat(plugin/<id>): …` أو `fix(plugin/<id>): …`
