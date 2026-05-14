/*
 * alitravians — curated user-facing changelog
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * GitHub release bodies contain raw commit titles, PR numbers, the
 * `@devin-ai-integration[bot]` author tag, and absolute URLs to PR diffs.
 * That format is useful to maintainers but reads as noise to end users.
 *
 * This module holds a hand-curated, user-facing changelog keyed by release
 * tag. When the modal renders a release that has an entry here, the curated
 * text takes precedence over the parsed GitHub body. For tags without an
 * entry, the renderer falls back to a sanitized version of the GitHub body
 * (commit-title prefixes, PR refs, and author handles stripped via the
 * `sanitizeRawItem` helper).
 *
 * Authoring rules — keep entries:
 *   • short (one line each, ≤ 80 chars)
 *   • feature-centric, not file-centric (never mention file names, modules,
 *     internal IDs, IPC channel names, or build pipelines)
 *   • formatted as `[الميزة - الإصلاح/التحسين]` for fixes and improvements,
 *     `[الميزة - وصف الإضافة]` for new features
 *   • Arabic, RTL-friendly
 */

export type CuratedKind = "added" | "fixed" | "improved";

export interface CuratedItem {
    kind: CuratedKind;
    text: string;
}

export const CURATED_CHANGELOG: Readonly<Record<string, ReadonlyArray<CuratedItem>>> = {
    "boon-v0.2.5": [
        { kind: "fixed",    text: "[المترجم اليدوي - الترجمة من قائمة الزر الأيمن أصبحت تظهر وتبقى ثابتة بدلاً من اختفائها بعد ثوانٍ]" },
        { kind: "fixed",    text: "[المترجم اليدوي - الرسائل القصيرة جداً والمختلطة يمكن ترجمتها يدوياً حتى لو رفض الفلتر الترجمة التلقائية]" },
    ],
    "boon-v0.2.4": [
        { kind: "fixed",    text: "[المترجم - الرسائل التي هي ردّ على رسالة أخرى أصبحت تُترجم بشكل ثابت]" },
        { kind: "fixed",    text: "[المترجم - رسائل القناة المرئية فور فتح Discord تُترجم مباشرة بدون انتظار تمرير]" },
        { kind: "fixed",    text: "[قائمة الزر الأيمن - عودة خيار \"🌐 ترجم الرسالة\" بعد اختفائه في النسخة السابقة]" },
    ],
    "boon-v0.2.3": [
        { kind: "fixed",    text: "[المترجم - إصلاح حلقة مفرغة كانت تمسح الترجمة فور إضافتها فلا تظهر للمستخدم]" },
    ],
    "boon-v0.2.2": [
        { kind: "fixed",    text: "[المترجم - الترجمة التلقائية الآن تشمل كل رسالة فيها أي حرف لاتيني بدلاً من تخطّي القصيرة]" },
        { kind: "fixed",    text: "[المترجم - يترجم أيضاً نص الرسالة المُقتبسة (الرد) فوق رسالة المستخدم]" },
        { kind: "fixed",    text: "[المترجم - الرسائل المُحرَّرة + الرسائل التي رُندِرت فارغة يُعاد ترجمتها تلقائياً]" },
    ],
    "boon-v0.2.1": [
        { kind: "fixed",    text: "[المترجم - إصلاح فشل الترجمة عبر السماح للأداة بالاتصال بخدمة الترجمة]" },
        { kind: "added",    text: "[التحديثات - تحديث ذاتي للمحرّك الأساسي بدون الحاجة لإعادة تشغيل المثبّت]" },
    ],
    "boon-v0.2.0": [
        { kind: "added",    text: "[المترجم - ترجمة تلقائية لرسائل الأجانب إلى العربية تظهر تحت كل رسالة]" },
        { kind: "added",    text: "[المترجم - دعم Google (مجاني) أو Gemini (يحتاج مفتاح) مع كاش ذكي]" },
        { kind: "added",    text: "[المترجم - تحكم بالسيرفرات والقنوات والمستخدمين الذين تُترجم رسائلهم]" },
        { kind: "improved", text: "[الإعدادات - نقل قائمة alitravians إلى منتصف شريط الإعدادات بدل النهاية]" },
        { kind: "improved", text: "[الإعدادات - أسماء الأقسام بالإنجليزية المختصرة (Home, Plugins, Themes…)]" },
    ],
    "boon-v0.1.9": [
        { kind: "fixed",    text: "[الإضافات - فلتر \"لم تُستخدم بعد\" أصبح يعرض النتائج الصحيحة ويتذكّرها بعد إعادة التشغيل]" },
        { kind: "fixed",    text: "[الإضافات - شارة \"جديد\" لم تعد تظهر على كل الإضافات بعد التحديث]" },
        { kind: "improved", text: "[الأداء - تقليل قراءات localStorage عند عرض شبكة الإضافات]" },
    ],
    "boon-v0.1.8": [
        { kind: "added",    text: "[الإضافات - شريط بحث وفلتر بالحالة والوسوم وترتيب ذكي]" },
        { kind: "added",    text: "[الإضافات - شارة \"جديد\" تظهر على الإضافات المضافة حديثاً]" },
        { kind: "added",    text: "[إدارة عناصر الواجهة - صفحة لإخفاء أزرار شريط الكتابة فردياً بدون تعطيل الإضافة]" },
    ],
    "boon-v0.1.7": [
        { kind: "improved", text: "[التحديثات - عرض الملاحظات بصياغة موجزة للمستخدمين بدون تفاصيل تقنية]" },
    ],
    "boon-v0.1.6": [
        { kind: "improved", text: "[الواجهة - تم تغيير اسم الأداة إلى alitravians في كل الأقسام]" },
        { kind: "added",    text: "[بطاقة المطوّر - قسم جديد بصورة المطوّر والاسم المتحرّك في الرئيسية]" },
        { kind: "improved", text: "[التحديثات - تنظيف الصفحة بحيث تعرض الجديد فقط مع زر اختياري للسجل]" },
        { kind: "improved", text: "[البيانات - ترحيل تلقائي لإعداداتك القديمة دون فقدان شيء]" },
    ],
    "boon-v0.1.5": [
        { kind: "fixed",    text: "[التحديثات - إصلاح زر التحقق من التحديثات الذي كان يعلق]" },
        { kind: "added",    text: "[التحديثات - مربع منبثق منظّم يعرض الإصدارات والإضافات]" },
        { kind: "improved", text: "[التحديثات - رسائل خطأ واضحة بالعربية بدلاً من الفشل الصامت]" },
    ],
    "boon-v0.1.4": [
        { kind: "fixed",    text: "[التحديثات - السماح للأداة بالاتصال بـ GitHub لجلب الإصدارات]" },
    ],
    "boon-v0.1.3": [
        { kind: "added",    text: "[التحديثات - نظام تحديث ذاتي من داخل التطبيق دون إعادة تثبيت]" },
        { kind: "fixed",    text: "[الإضافات - زر إعدادات الإضافة يفتح اللوحة بشكل صحيح]" },
        { kind: "added",    text: "[التصميم - لوقو وأيقونة احترافية للمثبّت]" },
    ],
    "boon-v0.1.2": [
        { kind: "added",    text: "[المثبّت - مثبّت رسومي بسيط مع إعادة تشغيل تلقائية لـ Discord]" },
    ],
    "boon-v0.1.1": [
        { kind: "added",    text: "[الواجهة - دمج الأداة داخل إعدادات Discord الأصلية]" },
    ],
    "boon-v0.1.0": [
        { kind: "added",    text: "[الإصدار الأول - مجموعة كاملة من الإضافات بدعم عربي كامل]" },
    ],
};

/**
 * Lookup the curated entry for a release tag.
 * Returns `null` if there is no curated entry — the caller should then fall
 * back to a sanitized parse of the raw GitHub body.
 */
export function curatedFor(tag: string): ReadonlyArray<CuratedItem> | null {
    return CURATED_CHANGELOG[tag] ?? null;
}

/**
 * Sanitize a raw bullet from a GitHub release body so it reads as a user
 * message rather than a commit title. Strips:
 *
 *   • Conventional-commit prefixes:  `fix(scope):`, `feat:`, `chore(boon):` …
 *   • Trailing PR refs:               `(#123)`, ` #123`
 *   • "by @user in https://github.com/…/pull/…" suffixes
 *   • Bare GitHub PR URLs
 *   • Author handles                  `@some-bot[bot]`, `@user`
 *   • Trailing whitespace and stray punctuation left after stripping
 *
 * Returns `null` when nothing meaningful remains after sanitization (e.g.
 * the line was *only* a PR link).
 */
export function sanitizeRawItem(raw: string): string | null {
    if (!raw) return null;
    let s = raw.trim();

    // Conventional-commit prefix at the start: `type(scope):` or `type:`.
    // Restricted to the well-known prefix vocabulary so a URL scheme
    // ("https:" / "http:") isn't mistaken for a commit type.
    s = s.replace(/^(?:feat|fix|chore|docs|style|refactor|test|perf|build|ci|revert)(?:\([^)]*\))?:\s*/iu, "");

    // "by @user in https://…/pull/N"  →  drop the whole tail.
    s = s.replace(/\s*by\s+@[^\s]+(?:\s+in\s+https?:\S+)?\s*$/iu, "");

    // Standalone PR URLs (anywhere in the line).
    s = s.replace(/https?:\/\/github\.com\/\S+\/pull\/\d+\S*/gu, "");
    s = s.replace(/https?:\/\/github\.com\/\S+/gu, "");

    // Author handles still left over.
    s = s.replace(/@[A-Za-z0-9_-]+(?:\[bot\])?/gu, "");

    // PR-number refs:  (#123) , trailing " #123" .
    s = s.replace(/\(\s*#\d+\s*\)/gu, "");
    s = s.replace(/\s+#\d+\b/gu, "");

    // Strip any leading "*" / "-" left after re-trimming.
    s = s.replace(/^\s*[-*]\s*/u, "");

    // Collapse whitespace and strip trailing punctuation noise.
    s = s.replace(/\s+/gu, " ").trim();
    s = s.replace(/[\s,;:.\-—]+$/u, "");

    return s.length >= 2 ? s : null;
}
